import { NextRequest, NextResponse } from 'next/server'

import { parseGoogleService, type GoogleService } from '@/lib/google-service'
import { exchangeGoogleCode, googleConfigured, storeGoogleConnection } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'

function redirect(request: NextRequest, status: string, service?: GoogleService) {
  const destination = new URL('/configuracoes', request.url)
  destination.searchParams.set('google', status)
  if (service) destination.searchParams.set('servico', service)
  const response = NextResponse.redirect(destination)
  response.cookies.set('google_oauth_state', '', { path: '/api/integracoes/google', maxAge: 0 })
  response.cookies.set('google_oauth_verifier', '', { path: '/api/integracoes/google', maxAge: 0 })
  response.cookies.set('google_oauth_service', '', { path: '/api/integracoes/google', maxAge: 0 })
  return response
}

export async function GET(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  if (!googleConfigured()) return redirect(request, 'configuracao')

  const state = request.nextUrl.searchParams.get('state')
  const code = request.nextUrl.searchParams.get('code')
  const expectedState = request.cookies.get('google_oauth_state')?.value
  const verifier = request.cookies.get('google_oauth_verifier')?.value
  const service = parseGoogleService(request.cookies.get('google_oauth_service')?.value)
  if (!state || !code || !expectedState || state !== expectedState || !verifier || !service) {
    return redirect(request, 'estado-invalido')
  }

  try {
    const tokens = await exchangeGoogleCode(code, verifier)
    await storeGoogleConnection(user.id, service, tokens)
    return redirect(request, 'conectado', service)
  } catch {
    return redirect(request, 'erro', service)
  }
}
