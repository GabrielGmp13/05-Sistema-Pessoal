import { sb, getUserId, now, sbErr, softDelete } from './supabase'
import { dataLocalSomandoDias } from './date'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CardRevisao {
  uuid: string
  user_id: string
  pergunta: string
  resposta: string | null
  modulo: string | null
  referencia_uuid: string | null
  materia_uuid: string | null
  conteudo_uuid: string | null
  ef: number
  repeticoes: number
  intervalo_dias: number
  proxima_revisao: string // DATE (YYYY-MM-DD)
  arquivado: boolean
  updated_at: string
  deleted: boolean
}

export interface ResultadoSM2 {
  ef: number
  repeticoes: number
  intervaloDias: number
  proximaRevisao: string // DATE (YYYY-MM-DD)
}

export interface CardManualInput {
  pergunta: string
  resposta: string | null
}

export interface CardImportacaoInput extends CardManualInput {
  modulo: string | null
  materia_uuid?: string | null
  conteudo_uuid?: string | null
}

export interface ResultadoImportacaoCards {
  criados: number
  duplicados: number
}

// qualidade: 0-5, mesma escala do SM-2 original (Anki-like)
// 0-2 = errou / esqueceu · 3 = difícil mas lembrou · 4 = bom · 5 = fácil
export type Qualidade = 0 | 1 | 2 | 3 | 4 | 5

// ---------------------------------------------------------------------------
// Função pura — mesma assinatura documentada em ARCHITECTURE.md / sm2.js (v1)
// ---------------------------------------------------------------------------

export function calcularSM2(
  ef: number,
  repeticoes: number,
  intervaloDias: number,
  qualidade: number
): ResultadoSM2 {
  let novoEf = ef
  let novasRepeticoes = repeticoes
  let novoIntervalo = intervaloDias

  // Atualiza o fator de facilidade (EF) — nunca abaixo de 1.3
  novoEf = ef + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02))
  if (novoEf < 1.3) novoEf = 1.3

  if (qualidade < 3) {
    // Errou: reinicia repetições, intervalo curto
    novasRepeticoes = 0
    novoIntervalo = 1
  } else {
    novasRepeticoes = repeticoes + 1
    if (novasRepeticoes === 1) {
      novoIntervalo = 1
    } else if (novasRepeticoes === 2) {
      novoIntervalo = 6
    } else {
      novoIntervalo = Math.round(intervaloDias * novoEf)
    }
  }

  const proximaRevisao = dataLocalSomandoDias(novoIntervalo)

  return {
    ef: Number(novoEf.toFixed(2)),
    repeticoes: novasRepeticoes,
    intervaloDias: novoIntervalo,
    proximaRevisao,
  }
}

// ---------------------------------------------------------------------------
// Wrapper integrado ao Supabase — busca, calcula e persiste em um passo
// ---------------------------------------------------------------------------

export async function avaliarCard(
  cardUuid: string,
  qualidade: number
): Promise<CardRevisao | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data: card, error: erroBusca } = await sb
    .from('revisao_espacada')
    .select('*')
    .eq('uuid', cardUuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .single()

  if (erroBusca || !card) {
    return sbErr(erroBusca, 'avaliarCard')
  }

  const resultado = calcularSM2(
    card.ef,
    card.repeticoes,
    card.intervalo_dias,
    qualidade
  )

  const { data: atualizado, error: erroUpdate } = await sb
    .from('revisao_espacada')
    .update({
      ef: resultado.ef,
      repeticoes: resultado.repeticoes,
      intervalo_dias: resultado.intervaloDias,
      proxima_revisao: resultado.proximaRevisao,
      updated_at: now(),
    })
    .eq('uuid', cardUuid)
    .eq('user_id', userId)
    .select()
    .single()

  if (erroUpdate) {
    return sbErr(erroUpdate, 'avaliarCard')
  }

  return atualizado as CardRevisao
}

// ---------------------------------------------------------------------------
// Leitura em lote — usado pela tela de Matéria pra mostrar "próxima revisão"
// de cada conteúdo sem 1 query por conteúdo. Recebe os revisao_uuid (podem
// ter null misturado — filtrado antes da query).
// ---------------------------------------------------------------------------

export async function buscarCardsRevisao(revisaoUuids: string[]): Promise<CardRevisao[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  if (revisaoUuids.length === 0) return []

  const { data, error } = await sb
    .from('revisao_espacada')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('uuid', revisaoUuids)

  if (error) return sbErr(error, 'buscarCardsRevisao')
  return data
}

/** Lista todos os cards ativos do usuário, ordenados pela próxima revisão. */
export async function listarCardsRevisao(): Promise<CardRevisao[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('revisao_espacada')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('arquivado', false)
    .order('proxima_revisao')
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarCardsRevisao')
  return data
}

/** Lista cards suspensos, preservando progresso e vínculos existentes. */
export async function listarCardsArquivados(): Promise<CardRevisao[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('revisao_espacada')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('arquivado', true)
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarCardsArquivados')
  return data
}

export async function definirCardArquivado(uuid: string, arquivado: boolean): Promise<boolean> {
  const userId = await getUserId()
  if (!userId) return false

  const { error } = await sb
    .from('revisao_espacada')
    .update({ arquivado, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)

  if (error) {
    sbErr(error, 'definirCardArquivado')
    return false
  }
  return true
}

/** Cria um card simples, independente dos lembretes gerados por Estudos. */
export async function criarCardManual(
  input: CardManualInput,
): Promise<CardRevisao | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('revisao_espacada')
    .insert({
      uuid: crypto.randomUUID(),
      user_id: userId,
      pergunta: input.pergunta,
      resposta: input.resposta,
      modulo: 'manual',
      referencia_uuid: null,
      materia_uuid: null,
      conteudo_uuid: null,
      arquivado: false,
      updated_at: now(),
    })
    .select()
    .single()

  if (error) return sbErr(error, 'criarCardManual')
  return data as CardRevisao
}

function chaveCard(pergunta: string, resposta: string | null) {
  return `${pergunta.trim().toLocaleLowerCase('pt-BR')}\u0000${(resposta ?? '').trim().toLocaleLowerCase('pt-BR')}`
}

/** Importa cards independentes e ignora pares pergunta/resposta já existentes. */
export async function importarCardsRevisao(
  entradas: CardImportacaoInput[],
): Promise<ResultadoImportacaoCards | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data: existentes, error: erroBusca } = await sb
    .from('revisao_espacada')
    .select('pergunta, resposta')
    .eq('user_id', userId)
    .eq('deleted', false)

  if (erroBusca) return sbErr(erroBusca, 'importarCardsRevisao:listar')

  const chaves = new Set((existentes ?? []).map((card) => chaveCard(card.pergunta, card.resposta)))
  const novos = entradas.filter((entrada) => {
    const chave = chaveCard(entrada.pergunta, entrada.resposta)
    if (chaves.has(chave)) return false
    chaves.add(chave)
    return true
  })

  if (novos.length === 0) return { criados: 0, duplicados: entradas.length }
  const atualizadoEm = now()
  const { error: erroInsert } = await sb.from('revisao_espacada').insert(novos.map((card) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    pergunta: card.pergunta,
    resposta: card.resposta,
    modulo: card.modulo?.trim() || 'manual',
    referencia_uuid: null,
    materia_uuid: card.materia_uuid ?? null,
    conteudo_uuid: card.conteudo_uuid ?? null,
    arquivado: false,
    updated_at: atualizadoEm,
  })))

  if (erroInsert) return sbErr(erroInsert, 'importarCardsRevisao:inserir')
  return { criados: novos.length, duplicados: entradas.length - novos.length }
}

/**
 * Soft delete com cuidado extra para cards gerados por Estudos: o conteúdo
 * precisa perder o vínculo para poder criar um novo card na próxima revisão.
 */
export async function deletarCardRevisao(card: CardRevisao): Promise<boolean> {
  const userId = await getUserId()
  if (!userId) return false

  const vinculadoAConteudo = card.modulo === 'estudos' && card.referencia_uuid

  if (vinculadoAConteudo) {
    const { error: erroVinculo } = await sb
      .from('conteudos')
      .update({ revisao_uuid: null, updated_at: now() })
      .eq('uuid', card.referencia_uuid)
      .eq('user_id', userId)
      .eq('revisao_uuid', card.uuid)

    if (erroVinculo) {
      sbErr(erroVinculo, 'deletarCardRevisao:desvincularConteudo')
      return false
    }
  }

  const apagado = await softDelete('revisao_espacada', card.uuid)
  if (apagado || !vinculadoAConteudo) return apagado

  const { error: erroRestauracao } = await sb
    .from('conteudos')
    .update({ revisao_uuid: card.uuid, updated_at: now() })
    .eq('uuid', card.referencia_uuid)
    .eq('user_id', userId)
    .is('revisao_uuid', null)

  if (erroRestauracao) {
    sbErr(erroRestauracao, 'deletarCardRevisao:restaurarVinculo')
  }
  return false
}

// ---------------------------------------------------------------------------
// Helper específico de Estudos v2 (DEC-035) — conteúdos.revisao_uuid é FK
// polimórfica pra revisao_espacada.uuid. Aqui o card funciona como LEMBRETE
// (pergunta = rótulo do conteúdo, resposta vazia), não flashcard pergunta/
// resposta — ver DEC-035, seção "Decisão".
// ---------------------------------------------------------------------------

export async function avaliarCardPorConteudo(
  conteudoUuid: string,
  qualidade: number
): Promise<CardRevisao | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data: conteudo, error: erroConteudo } = await sb
    .from('conteudos')
    .select('uuid, nome, revisao_uuid')
    .eq('uuid', conteudoUuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .single()

  if (erroConteudo || !conteudo) {
    return sbErr(erroConteudo, 'avaliarCardPorConteudo')
  }

  // Conteúdo ainda não tem card de revisão — cria um na primeira avaliação.
  if (!conteudo.revisao_uuid) {
    const { data: vinculo } = await sb
      .from('conteudos_materias')
      .select('materia_uuid')
      .eq('conteudo_uuid', conteudoUuid)
      .eq('user_id', userId)
      .eq('deleted', false)
      .limit(1)
      .maybeSingle()
    const novoCardUuid = crypto.randomUUID()
    const { error: erroCriacao } = await sb.from('revisao_espacada').insert({
      uuid: novoCardUuid,
      user_id: userId,
      pergunta: conteudo.nome,
      resposta: '',
      modulo: 'estudos',
      referencia_uuid: conteudo.uuid,
      materia_uuid: vinculo?.materia_uuid ?? null,
      conteudo_uuid: conteudo.uuid,
      updated_at: now(),
    })

    if (erroCriacao) {
      return sbErr(erroCriacao, 'avaliarCardPorConteudo')
    }

    const { error: erroVinculo } = await sb
      .from('conteudos')
      .update({ revisao_uuid: novoCardUuid, updated_at: now() })
      .eq('uuid', conteudoUuid)
      .eq('user_id', userId)

    if (erroVinculo) {
      return sbErr(erroVinculo, 'avaliarCardPorConteudo')
    }

    return avaliarCard(novoCardUuid, qualidade)
  }

  return avaliarCard(conteudo.revisao_uuid, qualidade)
}

// ---------------------------------------------------------------------------
// Revisões pendentes — usado no card do Hub de Estudos ("Revisões
// pendentes"). Só cards do módulo 'estudos', vencidos ou a vencer nos
// próximos N dias, ordenados por data (mais urgente primeiro). `pergunta`
// já guarda o nome do conteúdo (ver avaliarCardPorConteudo), então não
// precisa de join com `conteudos` pra exibir.
// ---------------------------------------------------------------------------

export async function listarRevisoesPendentes(diasNoFuturo = 7): Promise<CardRevisao[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('revisao_espacada')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('arquivado', false)
    .eq('modulo', 'estudos')
    .lte('proxima_revisao', dataLocalSomandoDias(diasNoFuturo))
    .order('proxima_revisao')

  if (error) return sbErr(error, 'listarRevisoesPendentes')
  return data
}

// ---------------------------------------------------------------------------
// Helper de conveniência — deriva qualidade (0-5) a partir de % de acerto,
// uso principal: lib/simulados.ts ao disparar SM-2 a partir de
// total_acertos/total_questoes (ver DEC-036).
// ---------------------------------------------------------------------------

export function qualidadePorPercentualAcerto(
  totalAcertos: number,
  totalQuestoes: number
): number {
  if (totalQuestoes <= 0) return 0
  const pct = totalAcertos / totalQuestoes

  if (pct >= 0.9) return 5
  if (pct >= 0.75) return 4
  if (pct >= 0.6) return 3
  if (pct >= 0.4) return 2
  if (pct >= 0.2) return 1
  return 0
}
