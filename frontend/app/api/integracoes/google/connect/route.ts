import { NextRequest, NextResponse } from 'next/server'

import { googleScopes, parseGoogleService } from '@/lib/google-service'
import { googleConfigured, oauthState, pkceChallenge, pkceVerifier } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'

export async function GET(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/configuracoes?google=configuracao', request.url))
  }
  const service = parseGoogleService(request.nextUrl.searchParams.get('servico'))
  if (!service) return NextResponse.redirect(new URL('/configuracoes?google=servico-invalido', request.url))

  const state = oauthState()
  const verifier = pkceVerifier()
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorization.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: googleScopes(service).join(' '),
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: 'S256',
  }).toString()

  const response = NextResponse.redirect(authorization)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/integracoes/google',
    maxAge: 600,
  }
  response.cookies.set('google_oauth_state', state, cookieOptions)
  response.cookies.set('google_oauth_verifier', verifier, cookieOptions)
  response.cookies.set('google_oauth_service', service, cookieOptions)
  return response
}
