import { getUserId, sb, sbErr, softDelete } from './supabase'
import { compararEventosAgenda } from './agenda-order'

export { compararEventosAgenda } from './agenda-order'

export type TipoEventoAgenda = 'geral' | 'estudo' | 'treino'
export type PrioridadeEventoAgenda = 'baixa' | 'normal' | 'alta'

export interface EventoAgenda {
  uuid: string
  user_id: string
  data: string
  treino_uuid: string | null
  titulo: string
  tipo: TipoEventoAgenda
  prioridade: PrioridadeEventoAgenda
  hora_inicio: string | null
  duracao_minutos: number | null
  descricao: string | null
  materia_uuid: string | null
  conteudo_uuid: string | null
  concluido: boolean
  google_calendar_event_id: string | null
  google_calendar_synced_at: string | null
  updated_at: string
  deleted: boolean
}

export type EventoAgendaInput = Omit<EventoAgenda, 'uuid' | 'user_id' | 'google_calendar_event_id' | 'google_calendar_synced_at' | 'updated_at' | 'deleted'>
export type EventoAgendaUpdate = Partial<EventoAgendaInput>

export async function listarEventosAgenda(inicio: string, fim: string): Promise<EventoAgenda[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('agenda')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
    .order('hora_inicio', { nullsFirst: false })

  if (error) return sbErr(error, 'listarEventosAgenda')
  return data.sort(compararEventosAgenda)
}

export async function criarEventoAgenda(input: EventoAgendaInput): Promise<EventoAgenda | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('agenda')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single()

  if (error) return sbErr(error, 'criarEventoAgenda')
  return data
}

export async function atualizarEventoAgenda(
  uuid: string,
  update: EventoAgendaUpdate,
): Promise<EventoAgenda | null> {
  const { data, error } = await sb
    .from('agenda')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarEventoAgenda')
  return data
}

export async function deletarEventoAgenda(uuid: string): Promise<boolean> {
  return softDelete('agenda', uuid)
}
