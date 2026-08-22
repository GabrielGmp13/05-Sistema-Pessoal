import { NextRequest, NextResponse } from 'next/server'

interface BrapiQuoteResponse {
  results?: Array<{
    symbol?: string
    shortName?: string
    currency?: string
    regularMarketPrice?: number
    regularMarketChangePercent?: number
  }>
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get('ticker')?.trim().toUpperCase() ?? ''
  if (!/^[A-Z0-9.^-]{2,15}$/.test(ticker)) {
    return NextResponse.json({ erro: 'Ticker inválido.' }, { status: 400 })
  }

  const token = process.env.BRAPI_TOKEN?.trim()
  if (!token) {
    return NextResponse.json({
      disponivel: false,
      cotacao: null,
      mensagem: 'Cotação automática indisponível. Configure BRAPI_TOKEN no servidor.',
    })
  }

  try {
    const response = await fetch(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}`, {
      next: { revalidate: 60 },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Sistema-Pessoal/2.0',
      },
    })
    if (!response.ok) {
      return NextResponse.json({ erro: 'O serviço de cotações não respondeu para este ativo.' }, { status: 502 })
    }

    const data = await response.json() as BrapiQuoteResponse
    const resultado = data.results?.[0]
    if (!resultado?.symbol || typeof resultado.regularMarketPrice !== 'number') {
      return NextResponse.json({ erro: 'Cotação não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({
      disponivel: true,
      cotacao: {
        ticker: resultado.symbol,
        nome: resultado.shortName ?? resultado.symbol,
        moeda: resultado.currency ?? 'BRL',
        preco: resultado.regularMarketPrice,
        variacao_percentual: typeof resultado.regularMarketChangePercent === 'number'
          ? resultado.regularMarketChangePercent
          : null,
      },
    })
  } catch {
    return NextResponse.json({ erro: 'Serviço de cotações temporariamente indisponível.' }, { status: 502 })
  }
}
