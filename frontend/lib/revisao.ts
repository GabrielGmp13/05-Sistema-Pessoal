import { sb, getUserId, now, sbErr } from './supabase'

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
  ef: number
  repeticoes: number
  intervalo_dias: number
  proxima_revisao: string // DATE (YYYY-MM-DD)
  updated_at: string
  deleted: boolean
}

export interface ResultadoSM2 {
  ef: number
  repeticoes: number
  intervaloDias: number
  proximaRevisao: string // DATE (YYYY-MM-DD)
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

  const proxima = new Date()
  proxima.setDate(proxima.getDate() + novoIntervalo)
  const proximaRevisao = proxima.toISOString().slice(0, 10)

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
    const novoCardUuid = crypto.randomUUID()
    const { error: erroCriacao } = await sb.from('revisao_espacada').insert({
      uuid: novoCardUuid,
      user_id: userId,
      pergunta: conteudo.nome,
      resposta: '',
      modulo: 'estudos',
      referencia_uuid: conteudo.uuid,
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