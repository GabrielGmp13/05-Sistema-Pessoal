import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export interface Lugar {
  uuid: string
  user_id: string
  nome: string
  tipo: string | null
  cidade: string | null
  pais: string | null
  latitude: number | null
  longitude: number | null
  endereco: string | null
  google_place_id: string | null
  data_inicio: string | null
  data_fim: string | null
  custo: number | null
  nota: number | null
  favorito: boolean
  texto: string | null
  capa_url: string | null
  capa_path: string | null
  updated_at: string
  deleted: boolean
}

export type LugarInput = Omit<Lugar, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>

export async function listarLugares(): Promise<Lugar[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data, error } = await sb
    .from('lugares')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('favorito', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) return sbErr(error, 'listarLugares')
  return data as Lugar[]
}

export async function salvarLugar(input: LugarInput, uuid?: string): Promise<Lugar | null> {
  const userId = await getUserId()
  if (!userId) return null
  const query = uuid
    ? sb.from('lugares').update({ ...input, updated_at: now() }).eq('uuid', uuid).eq('user_id', userId).eq('deleted', false)
    : sb.from('lugares').insert({ ...input, uuid: crypto.randomUUID(), user_id: userId, updated_at: now() })
  const { data, error } = await query.select().single()
  if (error) return sbErr(error, 'salvarLugar')
  return data as Lugar
}

export const deletarLugar = (uuid: string) => softDelete('lugares', uuid)

export function linkMapa(lugar: Pick<Lugar, 'nome' | 'latitude' | 'longitude' | 'cidade' | 'pais' | 'google_place_id'>) {
  const busca = lugar.latitude !== null && lugar.longitude !== null
    ? `${lugar.latitude},${lugar.longitude}`
    : [lugar.nome, lugar.cidade, lugar.pais].filter(Boolean).join(', ')
  const placeId = lugar.google_place_id ? `&query_place_id=${encodeURIComponent(lugar.google_place_id)}` : ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}${placeId}`
}
