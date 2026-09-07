import { NextResponse } from 'next/server'

import { buildPrivacyExport, privacyExportFilename, type PrivacyDatabaseExport } from '@/lib/privacy-export'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const admin = getServiceSupabase()
  const { data, error } = await admin.rpc('exportar_dados_usuario', { target_user_id: user.id })
  if (error || !data) {
    return NextResponse.json(
      { erro: 'Não foi possível preparar a cópia agora. O protocolo continua válido para atendimento.' },
      { status: 500 },
    )
  }

  const body = JSON.stringify(buildPrivacyExport(user, data as PrivacyDatabaseExport), null, 2)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${privacyExportFilename()}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

