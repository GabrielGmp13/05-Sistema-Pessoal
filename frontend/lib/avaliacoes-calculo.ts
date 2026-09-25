export function resultadoSimulado(total: number, acertos: number, anuladas = 0) {
  if (![total, acertos, anuladas].every(Number.isSafeInteger) || total < 0 ||
      anuladas < 0 || anuladas > total || acertos < 0 || acertos > total - anuladas) {
    throw new Error('Confira total, acertos e questões anuladas.')
  }
  const validas = total - anuladas
  return { validas, percentual: validas > 0 ? 100 * acertos / validas : null }
}

export function mediaAvaliacoes(itens: { nota: number | null; nota_maxima: number; peso: number }[]) {
  const avaliadas = itens.filter((item) => item.nota !== null)
  const peso = avaliadas.reduce((soma, item) => soma + item.peso, 0)
  return {
    percentual: peso > 0 ? avaliadas.reduce((soma, item) => soma + (item.nota! / item.nota_maxima) * item.peso, 0) * 100 / peso : null,
    avaliadas: avaliadas.length,
    pendentes: itens.length - avaliadas.length,
  }
}
