import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export interface Receita {
  uuid: string
  user_id: string
  titulo: string
  ingredientes: string
  modo_preparo: string
  tempo_preparo_minutos: number | null
  porcoes: number | null
  categoria: string | null
  nota: number | null
  favorito: boolean
  fez: boolean
  foto_url: string | null
  updated_at: string
  deleted: boolean
}

export type ReceitaInput = Omit<Receita, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>

export async function listarReceitas(): Promise<Receita[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('receitas')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('favorito', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarReceitas')
  return data as Receita[]
}

export async function criarReceita(input: ReceitaInput): Promise<Receita | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('receitas')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId, updated_at: now() })
    .select()
    .single()

  if (error) return sbErr(error, 'criarReceita')
  return data as Receita
}

export async function atualizarReceita(uuid: string, input: Partial<ReceitaInput>): Promise<Receita | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('receitas')
    .update({ ...input, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarReceita')
  return data as Receita
}

export async function deletarReceita(uuid: string): Promise<boolean> {
  return softDelete('receitas', uuid)
}
