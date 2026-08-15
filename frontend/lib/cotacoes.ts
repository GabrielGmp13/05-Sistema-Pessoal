export interface CotacaoAtivo {
  ticker: string
  nome: string
  moeda: string
  preco: number
  variacao_percentual: number | null
}

export interface RespostaCotacao {
  disponivel: boolean
  cotacao: CotacaoAtivo | null
  mensagem?: string
}

export async function buscarCotacao(ticker: string): Promise<RespostaCotacao> {
  const response = await fetch(`/api/financas/cotacao?ticker=${encodeURIComponent(ticker)}`, {
    cache: 'no-store',
  })
  const data = await response.json() as RespostaCotacao & { erro?: string }
  if (!response.ok) throw new Error(data.erro || 'Não foi possível consultar a cotação.')
  return data
}
