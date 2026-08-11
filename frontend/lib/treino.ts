import { createBrowserClient } from '@supabase/ssr'

type SB = ReturnType<typeof createBrowserClient>

export interface Treino {
  uuid: string
  nome: string
  descricao: string | null
  modulo_uuid: string
}

export interface ExercicioForca {
  uuid: string
  treino_uuid: string
  nome: string
  series_alvo: number | null
  reps_alvo: number | null
  carga_alvo: number | null
  descanso_segundos: number | null
  imagem_path: string | null
  ordem: number
}

export interface ExercicioCardio {
  uuid: string
  treino_uuid: string
  nome: string
  distancia_alvo_km: number | null
  duracao_alvo_minutos: number | null
  imagem_path: string | null
  ordem: number
}

// ---------- Treinos ----------

export async function getTreinosPorModulo(sb: SB, userId: string, moduloUuid: string): Promise<Treino[]> {
  const { data, error } = await sb
    .from('treinos')
    .select('uuid, nome, descricao, modulo_uuid')
    .eq('user_id', userId)
    .eq('modulo_uuid', moduloUuid)
    .eq('deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[getTreinosPorModulo]', error)
    return []
  }
  return data ?? []
}

export async function criarTreino(
  sb: SB, userId: string, moduloUuid: string, nome: string, descricao: string
): Promise<{ error: string | null }> {
  const { error } = await sb.from('treinos').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    modulo_uuid: moduloUuid,
    nome,
    descricao: descricao || null,
  })
  if (error) console.error('[criarTreino]', error)
  return { error: error?.message ?? null }
}

export async function atualizarTreino(
  sb: SB, treinoUuid: string, nome: string, descricao: string
): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('treinos')
    .update({ nome, descricao: descricao || null, updated_at: new Date().toISOString() })
    .eq('uuid', treinoUuid)
  if (error) console.error('[atualizarTreino]', error)
  return { error: error?.message ?? null }
}

export async function softDeleteTreino(sb: SB, treinoUuid: string): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('treinos')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('uuid', treinoUuid)
  if (error) console.error('[softDeleteTreino]', error)
  return { error: error?.message ?? null }
}

// ---------- Exercícios (força) ----------

export async function getExerciciosForca(sb: SB, userId: string, treinoUuid: string): Promise<ExercicioForca[]> {
  const { data, error } = await sb
    .from('exercicios_forca')
    .select('uuid, treino_uuid, nome, series_alvo, reps_alvo, carga_alvo, descanso_segundos, imagem_path, ordem')
    .eq('user_id', userId)
    .eq('treino_uuid', treinoUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('[getExerciciosForca]', error)
    return []
  }
  return data ?? []
}

export async function criarExercicioForca(
  sb: SB, userId: string, treinoUuid: string,
  dados: { nome: string; series_alvo: number; reps_alvo: number; carga_alvo: number; descanso_segundos: number; ordem: number }
): Promise<{ error: string | null }> {
  const { error } = await sb.from('exercicios_forca').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    treino_uuid: treinoUuid,
    ...dados,
  })
  if (error) console.error('[criarExercicioForca]', error)
  return { error: error?.message ?? null }
}

export async function softDeleteExercicioForca(sb: SB, uuid: string): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('exercicios_forca')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
  if (error) console.error('[softDeleteExercicioForca]', error)
  return { error: error?.message ?? null }
}

// ---------- Exercícios (cardio) ----------

export async function getExerciciosCardio(sb: SB, userId: string, treinoUuid: string): Promise<ExercicioCardio[]> {
  const { data, error } = await sb
    .from('exercicios_cardio')
    .select('uuid, treino_uuid, nome, distancia_alvo_km, duracao_alvo_minutos, imagem_path, ordem')
    .eq('user_id', userId)
    .eq('treino_uuid', treinoUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('[getExerciciosCardio]', error)
    return []
  }
  return data ?? []
}

export async function criarExercicioCardio(
  sb: SB, userId: string, treinoUuid: string,
  dados: { nome: string; distancia_alvo_km: number | null; duracao_alvo_minutos: number | null; ordem: number }
): Promise<{ error: string | null }> {
  const { error } = await sb.from('exercicios_cardio').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    treino_uuid: treinoUuid,
    ...dados,
  })
  if (error) console.error('[criarExercicioCardio]', error)
  return { error: error?.message ?? null }
}

export async function softDeleteExercicioCardio(sb: SB, uuid: string): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('exercicios_cardio')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
  if (error) console.error('[softDeleteExercicioCardio]', error)
  return { error: error?.message ?? null }
}

export async function getTodosTreinos(sb: SB, userId: string): Promise<Treino[]> {
  const { data, error } = await sb
    .from('treinos')
    .select('uuid, nome, descricao, modulo_uuid')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('nome')

  if (error) {
    console.error('[getTodosTreinos]', error)
    return []
  }
  return data ?? []
}
