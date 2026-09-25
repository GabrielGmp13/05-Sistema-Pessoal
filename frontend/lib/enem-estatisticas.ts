type QuestaoResultado = {
  numero: number | null; letra_marcada: string | null; letra_correta: string | null; motivo_erro: string | null
}

export function estatisticasEnem(questoes: QuestaoResultado[], total = 90) {
  const porNumero = new Map<number, QuestaoResultado>()
  for (const questao of questoes) {
    if (questao.numero !== null && Number.isInteger(questao.numero) && questao.numero >= 1 && questao.numero <= total) porNumero.set(questao.numero, questao)
  }
  let acertos = 0, erros = 0, emBranco = 0, semCorrecao = total - porNumero.size
  const motivos = new Map<string, number>()
  for (const questao of porNumero.values()) {
    if (!questao.letra_correta || !/^[A-E]$/.test(questao.letra_correta)) { semCorrecao++; continue }
    if (!questao.letra_marcada) { emBranco++; continue }
    if (questao.letra_marcada === questao.letra_correta) { acertos++; continue }
    erros++
    const motivo = questao.motivo_erro?.trim() || 'Sem motivo informado'
    motivos.set(motivo, (motivos.get(motivo) ?? 0) + 1)
  }
  const corrigidas = acertos + erros + emBranco
  return {
    total, acertos, erros, emBranco, semCorrecao, corrigidas,
    percentualCorrigidas: corrigidas ? 100 * acertos / corrigidas : null,
    motivos: [...motivos].map(([motivo, quantidade]) => ({ motivo, quantidade })).sort((a, b) => b.quantidade - a.quantidade || a.motivo.localeCompare(b.motivo, 'pt-BR')),
  }
}
