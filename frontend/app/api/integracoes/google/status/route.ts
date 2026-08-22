import { NextResponse } from 'next/server'

import { getGoogleConnection, googleConfigured } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'

export async function GET() {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) {
    return NextResponse.json({ configurado: false, conectado: false })
  }
  try {
    const connection = await getGoogleConnection(user.id)
    return NextResponse.json({
      configurado: true,
      conectado: Boolean(connection),
      email: connection?.email_google ?? null,
      scopes: connection?.scopes ?? [],
      atualizadoEm: connection?.updated_at ?? null,
    })
  } catch {
    return NextResponse.json({ erro: 'Não foi possível consultar a conexão.' }, { status: 500 })
  }
}
