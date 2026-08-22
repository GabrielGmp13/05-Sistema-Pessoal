import { NextResponse } from 'next/server'

import { getGoogleAccessToken } from '@/lib/server/google'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

export async function POST() {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  try {
    const token = await getGoogleAccessToken(user.id).catch(() => null)
    if (token) {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }),
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null)
    }
    const { error } = await getServiceSupabase().from('integracoes_google').delete().eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ conectado: false })
  } catch {
    return NextResponse.json({ erro: 'Não foi possível desconectar o Google.' }, { status: 500 })
  }
}
