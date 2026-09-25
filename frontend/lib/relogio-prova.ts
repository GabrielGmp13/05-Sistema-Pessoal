export function blocosRelogioProva(duracaoMinutos: number, segundosRestantes: number) {
  if (!Number.isFinite(duracaoMinutos) || duracaoMinutos <= 0 || duracaoMinutos > 1440 || !Number.isFinite(segundosRestantes)) return []
  const decorridos = Math.max(0, duracaoMinutos * 60 - Math.max(0, segundosRestantes))
  return Array.from({ length: Math.ceil(duracaoMinutos / 30) }, (_, indice) => {
    const inicio = indice * 30
    const fim = Math.min(duracaoMinutos, inicio + 30)
    return { inicio, fim, concluido: decorridos >= fim * 60, atual: decorridos >= inicio * 60 && decorridos < fim * 60 }
  })
}
