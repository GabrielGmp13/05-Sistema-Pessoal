export interface BrapiQuoteResponse {
  results?: Array<{
    symbol?: string
    shortName?: string
    currency?: string
    regularMarketPrice?: number
    regularMarketChangePercent?: number
  }>
}

export function normalizarTickerBrapi(value: string | null) {
  const ticker = value?.trim().toUpperCase() ?? ''
  return /^[A-Z0-9.^-]{2,15}$/.test(ticker) ? ticker : null
}

export function extrairCotacaoBrapi(data: BrapiQuoteResponse) {
  const resultado = data.results?.[0]
  if (!resultado?.symbol || typeof resultado.regularMarketPrice !== 'number') return null
  return {
    ticker: resultado.symbol,
    nome: resultado.shortName ?? resultado.symbol,
    moeda: resultado.currency ?? 'BRL',
    preco: resultado.regularMarketPrice,
    variacao_percentual: typeof resultado.regularMarketChangePercent === 'number'
      ? resultado.regularMarketChangePercent
      : null,
  }
}
