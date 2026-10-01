export interface ContagemDesempenho {
  corretas: number
  incorretas: number
  neutras: number
}

export interface QuestaoTopico {
  conteudo_uuid: string | null
  prova_uuid: string | null
  acertou: boolean | null
}

export interface SimuladoTopico {
  conteudo_uuid: string | null
  total_questoes: number
  total_acertos: number
  total_anuladas: number
}

export interface TentativaRevisaoTopico {
  conteudo_uuid: string | null
  resultado: 'falhou' | 'dificil' | 'bom' | 'facil'
}

export interface SubtopicoProgresso {
  uuid: string
  teoria_vista: boolean
}

export interface CardRevisaoTopico {
  conteudo_uuid: string | null
  proxima_revisao: string
  arquivado: boolean
}

export interface MetricasTopico {
  progresso: number | null
  revisao: ContagemDesempenho
  prova: ContagemDesempenho
  simulado: ContagemDesempenho
  geral: ContagemDesempenho
  proximaRevisao: string | null
  revisaoAtrasada: boolean
  revisoesConcluidas: number
}

export function percentualDesempenho(contagem: ContagemDesempenho): number | null {
  const avaliadas = contagem.corretas + contagem.incorretas
  return avaliadas > 0 ? Math.round((contagem.corretas / avaliadas) * 100) : null
}

function somar(...contagens: ContagemDesempenho[]): ContagemDesempenho {
  return contagens.reduce((total, atual) => ({
    corretas: total.corretas + atual.corretas,
    incorretas: total.incorretas + atual.incorretas,
    neutras: total.neutras + atual.neutras,
  }), { corretas: 0, incorretas: 0, neutras: 0 })
}

export function calcularMetricasTopico({
  subtopicos,
  cards,
  questoes,
  simulados,
  tentativasRevisao,
  hoje,
}: {
  subtopicos: SubtopicoProgresso[]
  cards: CardRevisaoTopico[]
  questoes: QuestaoTopico[]
  simulados: SimuladoTopico[]
  tentativasRevisao: TentativaRevisaoTopico[]
  hoje: string
}): MetricasTopico {
  const ids = new Set(subtopicos.map((subtopico) => subtopico.uuid))
  const ativos = subtopicos.length
  const concluidos = subtopicos.filter((subtopico) => subtopico.teoria_vista).length

  const revisao = tentativasRevisao.reduce<ContagemDesempenho>((total, tentativa) => {
    if (!tentativa.conteudo_uuid || !ids.has(tentativa.conteudo_uuid)) return total
    if (tentativa.resultado === 'falhou') total.incorretas += 1
    else total.corretas += 1
    return total
  }, { corretas: 0, incorretas: 0, neutras: 0 })

  const prova = questoes.reduce<ContagemDesempenho>((total, questao) => {
    if (!questao.conteudo_uuid || !ids.has(questao.conteudo_uuid) || !questao.prova_uuid) return total
    if (questao.acertou === true) total.corretas += 1
    else if (questao.acertou === false) total.incorretas += 1
    else total.neutras += 1
    return total
  }, { corretas: 0, incorretas: 0, neutras: 0 })

  const simulado = simulados.reduce<ContagemDesempenho>((total, item) => {
    if (!item.conteudo_uuid || !ids.has(item.conteudo_uuid)) return total
    total.corretas += item.total_acertos
    total.incorretas += Math.max(0, item.total_questoes - item.total_anuladas - item.total_acertos)
    total.neutras += item.total_anuladas
    return total
  }, { corretas: 0, incorretas: 0, neutras: 0 })

  const datas = cards
    .filter((card) => card.conteudo_uuid && ids.has(card.conteudo_uuid) && !card.arquivado)
    .map((card) => card.proxima_revisao)
    .sort()
  const proximaRevisao = datas[0] ?? null

  return {
    progresso: ativos > 0 ? Math.round((concluidos / ativos) * 100) : null,
    revisao,
    prova,
    simulado,
    geral: somar(revisao, prova, simulado),
    proximaRevisao,
    revisaoAtrasada: proximaRevisao !== null && proximaRevisao < hoje,
    revisoesConcluidas: revisao.corretas + revisao.incorretas,
  }
}
