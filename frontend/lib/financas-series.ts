export type ModoLancamento = 'unico' | 'parcelado' | 'recorrente'

export interface SerieLancamentoInput {
  valor: number
  data: string
  descricao: string | null
  modo: ModoLancamento
  quantidade: number
}

export interface ParcelaGerada {
  valor: number
  data: string
  descricao: string | null
}

function adicionarMes(dataIso: string, meses: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  const primeiroDoMes = new Date(Date.UTC(ano, mes - 1 + meses, 1))
  const ultimoDia = new Date(Date.UTC(primeiroDoMes.getUTCFullYear(), primeiroDoMes.getUTCMonth() + 1, 0)).getUTCDate()
  return [primeiroDoMes.getUTCFullYear(), String(primeiroDoMes.getUTCMonth() + 1).padStart(2, '0'), String(Math.min(dia, ultimoDia)).padStart(2, '0')].join('-')
}

export function gerarSerieLancamentos(input: SerieLancamentoInput): ParcelaGerada[] {
  if (!Number.isFinite(input.valor) || input.valor <= 0) throw new Error('O valor deve ser positivo.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new Error('A data é inválida.')
  const quantidade = input.modo === 'unico' ? 1 : Math.trunc(input.quantidade)
  if (input.modo !== 'unico' && (!Number.isInteger(quantidade) || quantidade < 2 || quantidade > 120)) throw new Error('Informe de 2 a 120 lançamentos.')
  const descricaoBase = input.descricao?.trim() || null
  const totalCentavos = Math.round(input.valor * 100)
  const centavosBase = input.modo === 'parcelado' ? Math.floor(totalCentavos / quantidade) : totalCentavos
  const resto = input.modo === 'parcelado' ? totalCentavos % quantidade : 0
  return Array.from({ length: quantidade }, (_, indice) => ({
    data: adicionarMes(input.data, indice),
    valor: (centavosBase + (indice < resto ? 1 : 0)) / 100,
    descricao: input.modo === 'unico' ? descricaoBase : `${descricaoBase ?? (input.modo === 'parcelado' ? 'Compra parcelada' : 'Lançamento recorrente')} (${indice + 1}/${quantidade})`,
  }))
}
