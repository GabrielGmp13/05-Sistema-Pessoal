export function pontosSaude<T extends { data: string }>(registros: T[], valor: (registro: T) => number | null, inicio: string, fim: string) {
  return registros.filter((item) => item.data >= inicio && item.data <= fim)
    .toSorted((a, b) => a.data.localeCompare(b.data))
    .flatMap((item) => {
      const n = valor(item)
      if (n === null || !Number.isFinite(Number(n))) return []
      return [{ label: new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR'), valor: Number(n) }]
    })
}
