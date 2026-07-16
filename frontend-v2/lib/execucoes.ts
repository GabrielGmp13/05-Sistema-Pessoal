import { createBrowserClient } from '@supabase/ssr'

type SB = ReturnType<typeof createBrowserClient>

export interface SerieForca {
  exercicio_uuid: string
  serie_numero: number
  carga_real: number | null
  reps_real: number | null
  concluida: boolean
}

export interface RegistroCardio {
  exercicio_uuid: string
  concluido: boolean
  distancia_real_km: number | null
  duracao_real_minutos: number | null
}

// Cria a sessão de treino (chamada uma vez ao entrar no modo Academia).
export async function criarSessao(sb: SB, userId: string, treinoUuid: string): Promise<string | null> {
  const uuid = crypto.randomUUID()
  const { error } = await sb.from('sessoes_treino').insert({
    uuid,
    user_id: userId,
    treino_uuid: treinoUuid,
    data_inicio: new Date().toISOString(),
  })
  if (error) {
    console.error('[criarSessao]', error)
    return null
  }
  return uuid
}

export async function finalizarSessao(sb: SB, sessaoUuid: string, observacoes: string): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('sessoes_treino')
    .update({ data_fim: new Date().toISOString(), observacoes: observacoes || null, updated_at: new Date().toISOString() })
    .eq('uuid', sessaoUuid)
  if (error) console.error('[finalizarSessao]', error)
  return { error: error?.message ?? null }
}

// Maior carga_real já registrada para o exercício (histórico, sessão atual excluída).
// Usado para detectar PR — mesma lógica da v1.
export async function getRecordeCarga(sb: SB, userId: string, exercicioUuid: string): Promise<number> {
  const { data, error } = await sb
    .from('execucoes_forca')
    .select('carga_real')
    .eq('user_id', userId)
    .eq('exercicio_uuid', exercicioUuid)
    .eq('deleted', false)
    .not('carga_real', 'is', null)
    .order('carga_real', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[getRecordeCarga]', error)
    return 0
  }
  return data?.[0]?.carga_real ?? 0
}

// Salva um lote de séries de força de uma vez (mesma ideia de "salvamento em lote
// por exercício" fechada no planejamento da Fase 7.1).
export async function salvarExecucoesForca(
  sb: SB, userId: string, sessaoUuid: string, series: SerieForca[]
): Promise<{ error: string | null }> {
  const linhas = series.map((s) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    sessao_uuid: sessaoUuid,
    exercicio_uuid: s.exercicio_uuid,
    serie_numero: s.serie_numero,
    carga_real: s.carga_real,
    reps_real: s.reps_real,
    concluida: s.concluida,
  }))

  const { error } = await sb.from('execucoes_forca').insert(linhas)
  if (error) console.error('[salvarExecucoesForca]', error)
  return { error: error?.message ?? null }
}

// Cardio é registro simples — um insert por exercício concluído.
export async function salvarExecucaoCardio(
  sb: SB, userId: string, sessaoUuid: string, registro: RegistroCardio
): Promise<{ error: string | null }> {
  const { error } = await sb.from('execucoes_cardio').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    sessao_uuid: sessaoUuid,
    ...registro,
  })
  if (error) console.error('[salvarExecucaoCardio]', error)
  return { error: error?.message ?? null }
}