import { sb, getUserId } from './supabase'

export interface Avaliacao {
  uuid: string
  user_id: string
  materia_uuid: string
  titulo: string
  data: string | null
  nota: number | null
  nota_maxima: number
  peso: number
  updated_at: string
  deleted: boolean
}
export type AvaliacaoInput = Pick<Avaliacao, 'titulo' | 'data' | 'nota' | 'nota_maxima' | 'peso'>

export async function listarAvaliacoes(materiaUuid: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Entre novamente na sua conta.')
  const { data, error } = await sb.from('lancamentos_nota').select('*')
    .eq('user_id', userId).eq('materia_uuid', materiaUuid).eq('deleted', false)
    .order('data', { ascending: false, nullsFirst: false })
  if (error) throw new Error('Não foi possível carregar as avaliações.')
  return data as Avaliacao[]
}

export async function salvarAvaliacao(materiaUuid: string, uuid: string, input: AvaliacaoInput, anterior?: Avaliacao) {
  const userId = await getUserId()
  if (!userId || (anterior && anterior.user_id !== userId)) throw new Error('A conta mudou. Atualize a página.')
  if (!input.titulo.trim() || input.titulo.trim().length > 200 ||
      !Number.isFinite(input.nota_maxima) || input.nota_maxima <= 0 ||
      !Number.isFinite(input.peso) || input.peso <= 0 ||
      (input.nota !== null && (!Number.isFinite(input.nota) || input.nota < 0 || input.nota > input.nota_maxima))) {
    throw new Error('Confira título, nota, nota máxima e peso.')
  }
  const valores = { ...input, titulo: input.titulo.trim(), updated_at: new Date().toISOString() }
  const query = anterior
    ? sb.from('lancamentos_nota').update(valores).eq('uuid', uuid).eq('user_id', userId)
      .eq('materia_uuid', materiaUuid).eq('updated_at', anterior.updated_at).eq('deleted', false)
    : sb.from('lancamentos_nota').insert({ ...valores, uuid, user_id: userId, materia_uuid: materiaUuid })
  const { data, error } = await query.select().single()
  if (error || !data) throw new Error('Salvamento não confirmado. Atualize a lista antes de tentar novamente; outra aba pode ter alterado a avaliação.')
  return data as Avaliacao
}

export async function removerAvaliacao(item: Avaliacao) {
  const userId = await getUserId()
  if (!userId || userId !== item.user_id) throw new Error('A conta mudou. Atualize a página.')
  const { data, error } = await sb.from('lancamentos_nota')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('uuid', item.uuid).eq('user_id', userId).eq('updated_at', item.updated_at).eq('deleted', false)
    .select('uuid').single()
  if (error || !data) throw new Error('Remoção não confirmada. Atualize a lista.')
}
