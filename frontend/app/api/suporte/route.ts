import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'
import { notifySupportTicket } from '@/lib/server/support-email'
import { parseSupportInput } from '@/lib/support'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  const admin = getServiceSupabase()
  const { data, error } = await admin
    .from('chamados_suporte')
    .select('uuid, protocolo, tipo, titulo, modulo, descricao, status, resposta, created_at, updated_at, chamados_suporte_historico(uuid,status,mensagem,origem,created_at), chamados_suporte_anexos(uuid,nome_original,mime_type,tamanho_bytes,created_at)')
    .eq('user_id', user.id)
    .eq('chamados_suporte_historico.user_id', user.id)
    .eq('chamados_suporte_anexos.user_id', user.id)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ erro: 'Não foi possível carregar seus pedidos.' }, { status: 500 })
  return NextResponse.json({ chamados: data }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  let input
  try {
    input = parseSupportInput(await request.json())
  } catch (cause) {
    return NextResponse.json({ erro: cause instanceof Error ? cause.message : 'Relato inválido.' }, { status: 400 })
  }

  const admin = getServiceSupabase()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin.from('chamados_suporte').select('uuid', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
  if ((count ?? 0) >= 10) return NextResponse.json({ erro: 'Limite de 10 pedidos por 24 horas atingido.' }, { status: 429 })
  const uuid = randomUUID()
  const protocolDate = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const protocolo = `SP-${protocolDate}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
  const { error } = await admin.from('chamados_suporte').insert({
    uuid, user_id: user.id, protocolo, ...input,
  })
  if (error) return NextResponse.json({ erro: 'Não foi possível registrar o pedido.' }, { status: 500 })

  const { error: historyError } = await admin.from('chamados_suporte_historico').insert({
    uuid: randomUUID(), chamado_suporte_uuid: uuid, user_id: user.id,
    status: 'recebido', origem: 'sistema', mensagem: 'Pedido recebido e registrado.',
  })
  if (historyError) {
    await admin.from('chamados_suporte').delete().eq('uuid', uuid).eq('user_id', user.id)
    return NextResponse.json({ erro: 'Não foi possível iniciar o histórico do pedido.' }, { status: 500 })
  }

  await notifySupportTicket({ ...input, protocolo, emailUsuario: user.email })
  return NextResponse.json({ uuid, protocolo }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
}
