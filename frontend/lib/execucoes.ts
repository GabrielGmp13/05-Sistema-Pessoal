import { createBrowserClient } from '@supabase/ssr'
import { logDiagnostic } from './safe-diagnostics'
import { dataLocalIso } from './date'

type SB = ReturnType<typeof createBrowserClient>

export interface SerieForca {
  uuid?: string
  exercicio_uuid: string
  serie_numero: number
  carga_real: number | null
  reps_real: number | null
  concluida: boolean
}

export interface RegistroCardio {
  uuid?: string
  exercicio_uuid: string
  concluido: boolean
  distancia_real_km: number | null
  duracao_real_minutos: number | null
}

// Procura a sessão aberta antes de permitir iniciar outra.
export async function getSessaoAberta(sb: SB, userId: string, treinoUuid: string) {
  const { data, error } = await sb.from('sessoes_treino').select('uuid')
    .eq('user_id', userId).eq('treino_uuid', treinoUuid).eq('deleted', false)
    .is('data_fim', null).order('data_inicio', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error('Não foi possível verificar a sessão em andamento.')
  return data?.uuid as string | undefined
}

export async function getExecucoesSessao(sb: SB, userId: string, sessaoUuid: string) {
  const [forca, cardio] = await Promise.all([
    sb.from('execucoes_forca').select('uuid, exercicio_uuid, serie_numero, carga_real, reps_real, concluida')
      .eq('user_id', userId).eq('sessao_uuid', sessaoUuid).eq('deleted', false),
    sb.from('execucoes_cardio').select('uuid, exercicio_uuid, distancia_real_km, duracao_real_minutos, concluido')
      .eq('user_id', userId).eq('sessao_uuid', sessaoUuid).eq('deleted', false),
  ])
  if (forca.error || cardio.error) throw new Error('Não foi possível recuperar as execuções desta sessão.')
  return { forca: forca.data as SerieForca[], cardio: cardio.data as RegistroCardio[] }
}

// Cria a sessão somente após a ação explícita de começar.
export async function criarSessao(sb: SB, userId: string, treinoUuid: string): Promise<string | null> {
  const uuid = crypto.randomUUID()
  const { error } = await sb.from('sessoes_treino').insert({
    uuid,
    user_id: userId,
    treino_uuid: treinoUuid,
    data_inicio: new Date().toISOString(),
  })
  if (error) {
    logDiagnostic('execucoes/criar-sessao', error)
    return null
  }
  return uuid
}

export async function finalizarSessao(sb: SB, userId: string, sessaoUuid: string, observacoes: string): Promise<{ error: string | null; aviso?: string }> {
  const { data, error } = await sb
    .from('sessoes_treino')
    .update({ data_fim: new Date().toISOString(), observacoes: observacoes || null, updated_at: new Date().toISOString() })
    .eq('uuid', sessaoUuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .is('data_fim', null)
    .select('uuid')
    .maybeSingle()
  if (error) logDiagnostic('execucoes/finalizar-sessao', error)
  if (error) return { error: error.message }
  void data
  // Resposta perdida depois do commit: repetir não deve mudar o horário final.
  const { data: existente, error: erroConsulta } = await sb.from('sessoes_treino')
    .select('data_fim,data_inicio,treino_uuid').eq('uuid', sessaoUuid).eq('user_id', userId)
    .eq('deleted', false).maybeSingle()
  if (erroConsulta) logDiagnostic('execucoes/conferir-finalizacao', erroConsulta)
  if (erroConsulta || !existente?.data_fim) return { error: erroConsulta?.message ?? 'A sessão não está mais disponível. O treino não foi finalizado.' }
  // Reenvio mantém data_fim e conclui somente ocorrências reais do dia inicial.
  const { data: eventos, error: erroEventos } = await sb.from('agenda').select('uuid')
    .eq('user_id', userId).eq('treino_uuid', existente.treino_uuid).eq('tipo', 'treino')
    .eq('data', dataLocalIso(new Date(existente.data_inicio))).eq('deleted', false).limit(2)
  if (erroEventos) return { error: 'Sessão salva. Não foi possível conferir a Agenda; tente finalizar novamente.' }
  if (!eventos?.length) return { error: null }
  if (eventos.length > 1) return { error: null, aviso: 'Há mais de um compromisso deste treino no mesmo dia. Marque na Agenda qual deles você realizou.' }
  const { error: erroAgenda } = await sb.from('agenda')
    .update({ concluido: true, updated_at: new Date().toISOString() })
    .eq('uuid', eventos[0].uuid)
    .eq('user_id', userId).eq('treino_uuid', existente.treino_uuid).eq('tipo', 'treino')
    .eq('data', dataLocalIso(new Date(existente.data_inicio))).eq('deleted', false).eq('concluido', false)
  if (erroAgenda) logDiagnostic('execucoes/concluir-agenda', erroAgenda)
  return { error: erroAgenda ? 'Sessão concluída; não foi possível atualizar sua presença na Agenda. Tente novamente.' : null }
}

// Maior carga_real já registrada para o exercício (histórico, sessão atual excluída).
// Usado para detectar PR — mesma lógica da v1.
export async function getRecordeCarga(sb: SB, userId: string, exercicioUuid: string): Promise<number> {
  const { data, error } = await sb
    .from('execucoes_forca')
    .select('carga_real, sessoes_treino!inner(data_fim, deleted)')
    .eq('user_id', userId)
    .eq('exercicio_uuid', exercicioUuid)
    .eq('deleted', false)
    .eq('concluida', true)
    .eq('sessoes_treino.deleted', false)
    .not('sessoes_treino.data_fim', 'is', null)
    .not('carga_real', 'is', null)
    .order('carga_real', { ascending: false })
    .limit(1)

  if (error) {
    logDiagnostic('execucoes/recorde-carga', error)
    throw new Error('Não foi possível carregar o histórico de recordes.')
  }
  return data?.[0]?.carga_real ?? 0
}

// Salva um lote de séries de força de uma vez (mesma ideia de "salvamento em lote
// por exercício" fechada no planejamento da Fase 7.1).
export async function salvarExecucoesForca(
  sb: SB, userId: string, sessaoUuid: string, series: SerieForca[]
): Promise<{ error: string | null }> {
  const linhas = series.map((s) => ({
    uuid: s.uuid ?? crypto.randomUUID(),
    user_id: userId,
    sessao_uuid: sessaoUuid,
    exercicio_uuid: s.exercicio_uuid,
    serie_numero: s.serie_numero,
    carga_real: s.carga_real,
    reps_real: s.reps_real,
    concluida: s.concluida,
  }))

  const { error } = await sb.from('execucoes_forca').upsert(linhas, { onConflict: 'uuid' })
  if (error) logDiagnostic('execucoes/salvar-forca', error)
  return { error: error?.message ?? null }
}

// Cardio é registro simples — um insert por exercício concluído.
export async function salvarExecucaoCardio(
  sb: SB, userId: string, sessaoUuid: string, registro: RegistroCardio
): Promise<{ error: string | null }> {
  const { error } = await sb.from('execucoes_cardio').upsert({
    ...registro,
    uuid: registro.uuid ?? crypto.randomUUID(),
    user_id: userId,
    sessao_uuid: sessaoUuid,
  }, { onConflict: 'uuid' })
  if (error) logDiagnostic('execucoes/salvar-cardio', error)
  return { error: error?.message ?? null }
}
