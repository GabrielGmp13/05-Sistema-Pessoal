import 'server-only'

import type { SupportInput } from '@/lib/support'

interface TicketNotice extends SupportInput {
  protocolo: string
  emailUsuario?: string
}

export async function notifySupportTicket(ticket: TicketNotice): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.SUPPORT_EMAIL_FROM?.trim()
  const to = process.env.SUPPORT_NOTIFICATION_EMAIL?.trim()
  if (!apiKey || !from || !to) return false

  const text = [
    `Novo ${ticket.tipo === 'bug' ? 'bug' : 'pedido/sugestão'}: ${ticket.protocolo}`,
    `Título: ${ticket.titulo}`,
    `Módulo: ${ticket.modulo || 'não informado'}`,
    `Conta: ${ticket.emailUsuario || 'não informada'}`,
    '',
    ticket.descricao.slice(0, 1200),
    '',
    'Consulte o registro completo e os anexos privados no Supabase Dashboard.',
  ].join('\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `suporte-${ticket.protocolo}`,
      },
      body: JSON.stringify({ from, to: [to], subject: `[${ticket.protocolo}] ${ticket.titulo}`, text }),
    })
    return response.ok
  } catch {
    return false
  }
}
