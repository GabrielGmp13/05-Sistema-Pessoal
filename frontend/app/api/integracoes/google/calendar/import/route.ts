import { NextRequest, NextResponse } from 'next/server'

import { classificarImportacaoCalendar, dataHoraRecife, EventoGoogleImportacao } from '@/lib/calendar-import'
import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

interface GoogleCalendarItem {
  id?: string
  status?: string
  summary?: string
  description?: string
  updated?: string
  htmlLink?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
  extendedProperties?: { private?: { sistemaPessoalAgendaUuid?: string } }
}

interface GoogleCalendarList { items?: GoogleCalendarItem[]; nextPageToken?: string }

function eventoImportavel(item: GoogleCalendarItem): EventoGoogleImportacao | null {
  if (!item.id) return null
  const cancelado = item.status === 'cancelled'
  const inicio = item.start?.dateTime ? dataHoraRecife(item.start.dateTime) : null
  const data = inicio?.data ?? item.start?.date ?? ''
  if (!data && !cancelado) return null
  const fim = item.end?.dateTime ? new Date(item.end.dateTime).getTime() : null
  const inicioMs = item.start?.dateTime ? new Date(item.start.dateTime).getTime() : null
  return {
    id: item.id,
    titulo: item.summary?.trim() || 'Evento do Google Calendar',
    descricao: item.description?.trim() || null,
    data,
    horaInicio: inicio?.hora ?? null,
    duracaoMinutos: fim !== null && inicioMs !== null ? Math.max(1, Math.round((fim - inicioMs) / 60_000)) : null,
    atualizadoEm: item.updated ?? new Date().toISOString(),
    cancelado,
    link: item.htmlLink ?? null,
    agendaUuid: item.extendedProperties?.private?.sistemaPessoalAgendaUuid ?? null,
  }
}

async function listarEventosGoogle(userId: string, inicio: string, fim: string) {
  const itens: GoogleCalendarItem[] = []
  let pageToken = ''
  do {
    const parametros = new URLSearchParams({
      singleEvents: 'true', showDeleted: 'true', maxResults: '2500', orderBy: 'startTime',
      timeMin: `${inicio}T00:00:00-03:00`, timeMax: `${fim}T23:59:59-03:00`, timeZone: 'America/Recife',
    })
    if (pageToken) parametros.set('pageToken', pageToken)
    const pagina = await googleApi<GoogleCalendarList>(userId, 'calendar', `https://www.googleapis.com/calendar/v3/calendars/primary/events?${parametros}`)
    itens.push(...(pagina.items ?? []))
    pageToken = pagina.nextPageToken ?? ''
  } while (pageToken)
  return itens.map(eventoImportavel).filter((item): item is EventoGoogleImportacao => item !== null)
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { inicio?: unknown; fim?: unknown; aplicarIds?: unknown } | null
  const inicio = typeof body?.inicio === 'string' ? body.inicio : ''
  const fim = typeof body?.fim === 'string' ? body.fim : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || inicio > fim) {
    return NextResponse.json({ erro: 'Período inválido.' }, { status: 400 })
  }
  const diasDoPeriodo = (new Date(`${fim}T00:00:00Z`).getTime() - new Date(`${inicio}T00:00:00Z`).getTime()) / 86_400_000
  if (!Number.isFinite(diasDoPeriodo) || diasDoPeriodo > 62) {
    return NextResponse.json({ erro: 'Consulte no máximo 63 dias por importação.' }, { status: 400 })
  }

  try {
    const admin = getServiceSupabase()
    const remotos = await listarEventosGoogle(user.id, inicio, fim)
    const { data: locais, error } = await admin.from('agenda')
      .select('uuid,google_calendar_event_id,google_calendar_synced_at,updated_at,deleted')
      .eq('user_id', user.id)
    if (error) throw error
    const porId = new Map((locais ?? []).filter((evento) => evento.google_calendar_event_id).map((evento) => [evento.google_calendar_event_id, evento]))
    const porUuid = new Map((locais ?? []).map((evento) => [evento.uuid, evento]))
    const previa = remotos.map((remoto) => {
      const local = porId.get(remoto.id) ?? (remoto.agendaUuid ? porUuid.get(remoto.agendaUuid) : null) ?? null
      return { ...remoto, agendaUuid: local?.uuid ?? remoto.agendaUuid, acao: classificarImportacaoCalendar(remoto, local) }
    })

    const aplicarIds = Array.isArray(body?.aplicarIds)
      ? new Set(body.aplicarIds.filter((id): id is string => typeof id === 'string'))
      : null
    if (!aplicarIds) return NextResponse.json({ eventos: previa })

    let aplicados = 0
    for (const evento of previa) {
      if (!aplicarIds.has(evento.id) || evento.acao === 'sem_alteracao' || evento.acao === 'conflito') continue
      const sincronizadoEm = new Date().toISOString()
      if (evento.acao === 'novo') {
        const { error: erroInsert } = await admin.from('agenda').insert({
          uuid: crypto.randomUUID(), user_id: user.id, titulo: evento.titulo, tipo: 'geral', prioridade: 'normal',
          data: evento.data, hora_inicio: evento.horaInicio, duracao_minutos: evento.duracaoMinutos,
          descricao: evento.descricao, materia_uuid: null, conteudo_uuid: null, treino_uuid: null, concluido: false,
          google_calendar_event_id: evento.id, google_calendar_synced_at: sincronizadoEm,
        })
        if (erroInsert) throw erroInsert
      } else if (evento.agendaUuid) {
        const atualizacao = evento.acao === 'cancelar'
          ? { deleted: true, google_calendar_synced_at: sincronizadoEm, updated_at: sincronizadoEm }
          : { titulo: evento.titulo, data: evento.data, hora_inicio: evento.horaInicio, duracao_minutos: evento.duracaoMinutos, descricao: evento.descricao, deleted: false, google_calendar_event_id: evento.id, google_calendar_synced_at: sincronizadoEm, updated_at: sincronizadoEm }
        const { error: erroUpdate } = await admin.from('agenda').update(atualizacao).eq('uuid', evento.agendaUuid).eq('user_id', user.id)
        if (erroUpdate) throw erroUpdate
      }
      aplicados += 1
    }
    return NextResponse.json({ eventos: previa, aplicados })
  } catch (error) {
    console.error('[google-calendar-import]', { message: error instanceof Error ? error.message : 'Erro desconhecido' })
    return NextResponse.json({ erro: 'Não foi possível consultar ou importar o Google Calendar.' }, { status: 502 })
  }
}
