import { NextRequest, NextResponse } from 'next/server'
import { BrapiQuoteResponse, extrairCotacaoBrapi, normalizarTickerBrapi } from '@/lib/brapi'

export async function GET(request: NextRequest) {
  const ticker = normalizarTickerBrapi(request.nextUrl.searchParams.get('ticker'))
  if (!ticker) {
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
    const cotacao = extrairCotacaoBrapi(data)
    if (!cotacao) {
      return NextResponse.json({ erro: 'Cotação não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({
      disponivel: true,
      cotacao,
    })
  } catch {
    return NextResponse.json({ erro: 'Serviço de cotações temporariamente indisponível.' }, { status: 502 })
  }
}
