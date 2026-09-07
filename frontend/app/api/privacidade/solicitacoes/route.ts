import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { parsePrivacyRequest } from '@/lib/privacy-request'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'
import { notifySupportTicket } from '@/lib/server/support-email'

export const dynamic = 'force-dynamic'

const requestDetails = {
  copia: {
    titulo: 'Solicitação de cópia dos meus dados',
    descricao: 'Solicito confirmação do tratamento e uma cópia possível dos dados vinculados à minha conta.',
  },
  exclusao: {
    titulo: 'Solicitação de exclusão da minha conta',
    descricao: 'Solicito a exclusão da minha conta e dos dados ativos vinculados a ela. Estou ciente de que a identidade será confirmada antes da execução e de que este protocolo não apaga dados automaticamente.',
  },
} as const

export async function POST(request: Request) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  let tipo
  try {
    tipo = parsePrivacyRequest(await request.json())
  } catch (cause) {
    return NextResponse.json({ erro: cause instanceof Error ? cause.message : 'Solicitação inválida.' }, { status: 400 })
  }

  const admin = getServiceSupabase()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin.from('chamados_suporte').select('uuid', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
  if ((count ?? 0) >= 10) return NextResponse.json({ erro: 'Limite de 10 pedidos por 24 horas atingido.' }, { status: 429 })

  const uuid = randomUUID()
  const protocolDate = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const protocolo = `SP-${protocolDate}-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
  const details = requestDetails[tipo]
  const supportInput = {
    tipo: 'sugestao' as const,
    titulo: details.titulo,
    modulo: 'Privacidade / Conta',
    descricao: details.descricao,
  }

  const { error } = await admin.from('chamados_suporte').insert({ uuid, user_id: user.id, protocolo, ...supportInput })
  if (error) return NextResponse.json({ erro: 'Não foi possível registrar a solicitação.' }, { status: 500 })

  const { error: historyError } = await admin.from('chamados_suporte_historico').insert({
    uuid: randomUUID(), chamado_suporte_uuid: uuid, user_id: user.id,
    status: 'recebido', origem: 'sistema', mensagem: 'Solicitação de privacidade recebida. A identidade será confirmada antes do atendimento.',
  })
  if (historyError) {
    await admin.from('chamados_suporte').delete().eq('uuid', uuid).eq('user_id', user.id)
    return NextResponse.json({ erro: 'Não foi possível iniciar o histórico da solicitação.' }, { status: 500 })
  }

  await notifySupportTicket({ ...supportInput, protocolo, emailUsuario: user.email })
  return NextResponse.json({ protocolo }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
}
