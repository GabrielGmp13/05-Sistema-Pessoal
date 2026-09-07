import { NextResponse } from 'next/server'

import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

export async function GET(_request: Request, { params }: { params: Promise<{ uuid: string; anexoUuid: string }> }) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  const { uuid, anexoUuid } = await params
  const admin = getServiceSupabase()
  const { data } = await admin.from('chamados_suporte_anexos').select('storage_path').eq('uuid', anexoUuid).eq('chamado_suporte_uuid', uuid).eq('user_id', user.id).eq('deleted', false).maybeSingle()
  if (!data) return NextResponse.json({ erro: 'Print não encontrado.' }, { status: 404 })
  const { data: signed, error } = await admin.storage.from('suporte-anexos').createSignedUrl(data.storage_path, 60)
  if (error || !signed?.signedUrl) return NextResponse.json({ erro: 'Não foi possível abrir o print.' }, { status: 500 })
  return NextResponse.redirect(signed.signedUrl, { headers: { 'Cache-Control': 'private, no-store' } })
}
