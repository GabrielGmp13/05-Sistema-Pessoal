import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

interface GoogleCalendarEvent { id?: string; htmlLink?: string }

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

function calendarBody(event: {
  uuid: string; titulo: string; descricao: string | null; data: string
  hora_inicio: string | null; duracao_minutos: number | null
}) {
  const base = {
    summary: event.titulo,
    description: event.descricao ?? undefined,
    extendedProperties: { private: { sistemaPessoalAgendaUuid: event.uuid } },
  }
  if (!event.hora_inicio) {
    return { ...base, start: { date: event.data }, end: { date: nextDate(event.data) } }
  }
  const start = `${event.data}T${event.hora_inicio.slice(0, 5)}:00-03:00`
  const end = new Date(new Date(start).getTime() + Math.max(1, event.duracao_minutos ?? 60) * 60_000).toISOString()
  return {
    ...base,
    start: { dateTime: start, timeZone: 'America/Recife' },
    end: { dateTime: end, timeZone: 'America/Recife' },
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { agendaUuid?: unknown } | null
  const agendaUuid = typeof body?.agendaUuid === 'string' ? body.agendaUuid : ''
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(agendaUuid)) return NextResponse.json({ erro: 'Compromisso inválido.' }, { status: 400 })

  try {
    const admin = getServiceSupabase()
    const { data: event, error } = await admin.from('agenda').select('uuid, titulo, descricao, data, hora_inicio, duracao_minutos, google_calendar_event_id').eq('uuid', agendaUuid).eq('user_id', user.id).eq('deleted', false).single()
    if (error || !event) return NextResponse.json({ erro: 'Compromisso não encontrado.' }, { status: 404 })
    const payload = calendarBody(event)
    const existingId = event.google_calendar_event_id as string | null
    const url = existingId
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existingId)}`
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    const exported = await googleApi<GoogleCalendarEvent>(user.id, 'calendar', url, {
      method: existingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const eventId = exported.id ?? existingId
    if (!eventId) throw new Error('Google não retornou o identificador do evento.')
    const { error: updateError } = await admin.from('agenda').update({
      google_calendar_event_id: eventId,
      google_calendar_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('uuid', agendaUuid).eq('user_id', user.id)
    if (updateError) throw updateError
    return NextResponse.json({ exportado: true, atualizado: Boolean(existingId), link: exported.htmlLink ?? null })
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível exportar o compromisso.' }, { status: 502 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { agendaUuid?: unknown } | null
  const agendaUuid = typeof body?.agendaUuid === 'string' ? body.agendaUuid : ''
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(agendaUuid)) return NextResponse.json({ erro: 'Compromisso inválido.' }, { status: 400 })

  try {
    const admin = getServiceSupabase()
    const { data: event, error } = await admin.from('agenda')
      .select('uuid,google_calendar_event_id')
      .eq('uuid', agendaUuid)
      .eq('user_id', user.id)
      .single()
    if (error || !event) return NextResponse.json({ erro: 'Compromisso não encontrado.' }, { status: 404 })

    if (event.google_calendar_event_id) {
      await googleApi<void>(
        user.id,
        'calendar',
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.google_calendar_event_id)}`,
        { method: 'DELETE' },
      )
    }

    const sincronizadoEm = new Date().toISOString()
    const { error: updateError } = await admin.from('agenda').update({
      google_calendar_synced_at: sincronizadoEm,
      updated_at: sincronizadoEm,
    }).eq('uuid', agendaUuid).eq('user_id', user.id)
    if (updateError) throw updateError
    return NextResponse.json({ removido: true })
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível remover o compromisso do Google.' }, { status: 502 })
  }
}
