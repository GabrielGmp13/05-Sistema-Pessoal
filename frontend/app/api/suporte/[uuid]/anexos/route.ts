import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'
import { hasValidImageSignature, SUPPORT_MAX_FILES, validateSupportImage } from '@/lib/support'

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function POST(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  const { uuid: chamadoUuid } = await params
  const admin = getServiceSupabase()
  const { data: chamado } = await admin.from('chamados_suporte').select('uuid').eq('uuid', chamadoUuid).eq('user_id', user.id).eq('deleted', false).maybeSingle()
  if (!chamado) return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 })

  const { count } = await admin.from('chamados_suporte_anexos').select('uuid', { count: 'exact', head: true }).eq('chamado_suporte_uuid', chamadoUuid).eq('user_id', user.id).eq('deleted', false)
  if ((count ?? 0) >= SUPPORT_MAX_FILES) return NextResponse.json({ erro: 'Este pedido já possui 3 prints.' }, { status: 409 })

  const body = await request.formData()
  const candidate = body.get('arquivo')
  if (!(candidate instanceof File)) return NextResponse.json({ erro: 'Selecione um print.' }, { status: 400 })
  const validation = validateSupportImage(candidate)
  if (validation) return NextResponse.json({ erro: validation }, { status: 400 })

  const anexoUuid = randomUUID()
  const path = `${user.id}/${chamadoUuid}/${anexoUuid}.${EXTENSIONS[candidate.type]}`
  const bytes = Buffer.from(await candidate.arrayBuffer())
  if (!hasValidImageSignature(bytes, candidate.type)) return NextResponse.json({ erro: 'O conteúdo do arquivo não corresponde a uma imagem válida.' }, { status: 400 })
  const { error: uploadError } = await admin.storage.from('suporte-anexos').upload(path, bytes, { contentType: candidate.type, upsert: false })
  if (uploadError) return NextResponse.json({ erro: 'Não foi possível guardar o print.' }, { status: 500 })
  const nomeOriginal = candidate.name.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 180) || `print.${EXTENSIONS[candidate.type]}`
  const { error } = await admin.from('chamados_suporte_anexos').insert({
    uuid: anexoUuid, chamado_suporte_uuid: chamadoUuid, user_id: user.id,
    storage_path: path, nome_original: nomeOriginal, mime_type: candidate.type, tamanho_bytes: candidate.size,
  })
  if (error) {
    await admin.storage.from('suporte-anexos').remove([path])
    return NextResponse.json({ erro: 'Não foi possível vincular o print ao pedido.' }, { status: 500 })
  }
  return NextResponse.json({ uuid: anexoUuid, nome_original: nomeOriginal }, { status: 201 })
}
