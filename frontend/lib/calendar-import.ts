export type AcaoImportacaoCalendar = 'novo' | 'atualizar' | 'cancelar' | 'sem_alteracao' | 'conflito'

export interface EventoGoogleImportacao {
  id: string
  titulo: string
  descricao: string | null
  data: string
  horaInicio: string | null
  duracaoMinutos: number | null
  atualizadoEm: string
  cancelado: boolean
  link: string | null
  agendaUuid: string | null
}

export interface EventoAgendaSincronizado {
  uuid: string
  google_calendar_event_id: string | null
  google_calendar_synced_at: string | null
  updated_at: string
  deleted?: boolean
}

export function classificarImportacaoCalendar(
  remoto: EventoGoogleImportacao,
  local: EventoAgendaSincronizado | null,
): AcaoImportacaoCalendar {
  if (!local) return remoto.cancelado ? 'sem_alteracao' : 'novo'
  if (remoto.cancelado && local.deleted) return 'sem_alteracao'
  const sincronizadoEm = local.google_calendar_synced_at
    ? new Date(local.google_calendar_synced_at).getTime()
    : 0
  const remotoEm = remoto.atualizadoEm ? new Date(remoto.atualizadoEm).getTime() : Date.now()
  const localEm = local.updated_at ? new Date(local.updated_at).getTime() : 0
  const remotoMudou = remotoEm > sincronizadoEm
  const localMudou = localEm > sincronizadoEm + 1_000
  if ((remoto.cancelado || remotoMudou) && localMudou) return 'conflito'
  if (remoto.cancelado) return 'cancelar'
  if (remotoMudou || !local.google_calendar_synced_at) return 'atualizar'
  return 'sem_alteracao'
}

export function dataHoraRecife(dateTime: string) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(dateTime))
  const obter = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  return { data: `${obter('year')}-${obter('month')}-${obter('day')}`, hora: `${obter('hour')}:${obter('minute')}` }
}
