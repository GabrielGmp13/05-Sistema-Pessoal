export interface RespostaEnemResumo {
  numero: number | null
  letra_marcada: string | null
  acertou: boolean | null
}

export function resumirGabaritoEnem(
  persistidas: RespostaEnemResumo[],
  selecionadas: Record<number, string>,
  total = 90,
) {
  const numerosPersistidos = new Set(persistidas.map((questao) => questao.numero).filter((numero): numero is number => numero !== null))
  const respondidasPersistidas = persistidas.filter((questao) => questao.letra_marcada !== null).length
  const respondidasNovas = Object.keys(selecionadas)
    .map(Number)
    .filter((numero) => !numerosPersistidos.has(numero)).length
  const respondidas = Math.min(total, respondidasPersistidas + respondidasNovas)
  return {
    respondidas,
    emBranco: Math.max(0, total - respondidas),
    acertos: persistidas.filter((questao) => questao.acertou === true).length,
    erros: persistidas.filter((questao) => questao.acertou === false).length,
    total,
  }
}
