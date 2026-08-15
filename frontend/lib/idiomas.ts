import { dataLocalIso } from './date'
import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export type TipoPraticaIdioma = 'leitura' | 'escuta' | 'conversacao' | 'escrita' | 'aula' | 'revisao' | 'outro'

export const TIPOS_PRATICA_IDIOMA: Record<TipoPraticaIdioma, string> = {
  leitura: 'Leitura',
  escuta: 'Escuta',
  conversacao: 'Conversação',
  escrita: 'Escrita',
  aula: 'Aula',
  revisao: 'Revisão',
  outro: 'Outro',
}

export interface Idioma {
  uuid: string
  user_id: string
  nome: string
  nivel_atual: string | null
  objetivo: string | null
  cor: string | null
  ativo: boolean
  updated_at: string
  deleted: boolean
}

export type IdiomaInput = Omit<Idioma, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
export type IdiomaUpdate = Partial<IdiomaInput>

export interface VocabularioIdioma {
  uuid: string
  user_id: string
  idioma_uuid: string
  termo: string
  traducao: string
  exemplo: string | null
  dominado: boolean
  updated_at: string
  deleted: boolean
}

export type VocabularioIdiomaInput = Omit<VocabularioIdioma, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
export type VocabularioIdiomaUpdate = Partial<VocabularioIdiomaInput>

export interface PraticaIdioma {
  uuid: string
  user_id: string
  idioma_uuid: string
  data: string
  tipo: TipoPraticaIdioma
  duracao_minutos: number
  observacoes: string | null
  updated_at: string
  deleted: boolean
}

export type PraticaIdiomaInput = Omit<PraticaIdioma, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>

export interface ResumoIdiomasHub {
  idiomaAtivo: Idioma | null
  minutosSemana: number
}

export async function listarIdiomas(): Promise<Idioma[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('ativo', { ascending: false })
    .order('nome')

  if (error) return sbErr(error, 'listarIdiomas')
  return data
}

export async function criarIdioma(input: IdiomaInput): Promise<Idioma | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single()

  if (error) return sbErr(error, 'criarIdioma')
  return data
}

export async function atualizarIdioma(uuid: string, update: IdiomaUpdate): Promise<Idioma | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas')
    .update({ ...update, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarIdioma')
  return data
}

export async function deletarIdioma(uuid: string): Promise<boolean> {
  const userId = await getUserId()
  if (!userId) return false

  const atualizadoEm = now()
  const [vocabulario, praticas] = await Promise.all([
    sb.from('idiomas_vocabulario').update({ deleted: true, updated_at: atualizadoEm }).eq('user_id', userId).eq('idioma_uuid', uuid).eq('deleted', false),
    sb.from('idiomas_praticas').update({ deleted: true, updated_at: atualizadoEm }).eq('user_id', userId).eq('idioma_uuid', uuid).eq('deleted', false),
  ])
  if (vocabulario.error || praticas.error) {
    if (vocabulario.error) sbErr(vocabulario.error, 'deletarIdioma.vocabulario')
    if (praticas.error) sbErr(praticas.error, 'deletarIdioma.praticas')
    return false
  }
  return softDelete('idiomas', uuid)
}

export async function listarVocabulario(idiomaUuid: string): Promise<VocabularioIdioma[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas_vocabulario')
    .select('*')
    .eq('user_id', userId)
    .eq('idioma_uuid', idiomaUuid)
    .eq('deleted', false)
    .order('dominado')
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarVocabulario')
  return data
}

export async function criarVocabulario(input: VocabularioIdiomaInput): Promise<VocabularioIdioma | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas_vocabulario')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single()

  if (error) return sbErr(error, 'criarVocabulario')
  return data
}

export async function atualizarVocabulario(uuid: string, update: VocabularioIdiomaUpdate): Promise<VocabularioIdioma | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas_vocabulario')
    .update({ ...update, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarVocabulario')
  return data
}

export async function deletarVocabulario(uuid: string): Promise<boolean> {
  return softDelete('idiomas_vocabulario', uuid)
}

export async function listarPraticas(idiomaUuid: string): Promise<PraticaIdioma[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas_praticas')
    .select('*')
    .eq('user_id', userId)
    .eq('idioma_uuid', idiomaUuid)
    .eq('deleted', false)
    .order('data', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarPraticas')
  return data
}

export async function criarPratica(input: PraticaIdiomaInput): Promise<PraticaIdioma | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('idiomas_praticas')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single()

  if (error) return sbErr(error, 'criarPratica')
  return data
}

export async function deletarPratica(uuid: string): Promise<boolean> {
  return softDelete('idiomas_praticas', uuid)
}

export async function buscarResumoIdiomasHub(): Promise<ResumoIdiomasHub | null> {
  const userId = await getUserId()
  if (!userId) return null

  const inicioSemana = new Date()
  const dia = inicioSemana.getDay()
  inicioSemana.setDate(inicioSemana.getDate() - (dia === 0 ? 6 : dia - 1))
  const inicio = dataLocalIso(inicioSemana)

  const [idiomas, praticas] = await Promise.all([
    sb.from('idiomas').select('*').eq('user_id', userId).eq('deleted', false).eq('ativo', true).order('updated_at', { ascending: false }).limit(1),
    sb.from('idiomas_praticas').select('duracao_minutos').eq('user_id', userId).eq('deleted', false).gte('data', inicio),
  ])

  if (idiomas.error || praticas.error) {
    if (idiomas.error) sbErr(idiomas.error, 'buscarResumoIdiomasHub.idiomas')
    if (praticas.error) sbErr(praticas.error, 'buscarResumoIdiomasHub.praticas')
    return null
  }

  return {
    idiomaAtivo: idiomas.data?.[0] ?? null,
    minutosSemana: (praticas.data ?? []).reduce((total, pratica) => total + Number(pratica.duracao_minutos), 0),
  }
}
