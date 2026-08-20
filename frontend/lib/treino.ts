import { createBrowserClient } from '@supabase/ssr'

type SB = ReturnType<typeof createBrowserClient>
const BUCKET_EXERCICIOS = 'exercicios'
const TIPOS_IMAGEM_EXERCICIO = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const LIMITE_IMAGEM_EXERCICIO = 5 * 1024 * 1024

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

export interface SessaoTreinoResumo {
  uuid: string
  treino_uuid: string
  data_inicio: string
  data_fim: string | null
}

export interface RegistroShapeResumo {
  uuid: string
  data: string
  peso: number | null
  foto_path: string | null
  updated_at: string
}

export interface DadosDashboardTreino {
  treinos: Treino[]
  sessoes: SessaoTreinoResumo[]
  sessoesSemana: SessaoTreinoResumo[]
  sessoesConcluidas: Array<Pick<SessaoTreinoResumo, 'treino_uuid'>>
  registrosShape: RegistroShapeResumo[]
  totalExercicios: number
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
  dados: { nome: string; series_alvo: number; reps_alvo: number; carga_alvo: number; descanso_segundos: number; imagem_path?: string | null; ordem: number }
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
  dados: { nome: string; distancia_alvo_km: number | null; duracao_alvo_minutos: number | null; imagem_path?: string | null; ordem: number }
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

export async function uploadImagemExercicio(sb: SB, userId: string, file: File): Promise<{ path: string | null; error: string | null }> {
  if (!TIPOS_IMAGEM_EXERCICIO.has(file.type)) return { path: null, error: 'Use JPG, PNG, WebP ou GIF.' }
  if (file.size > LIMITE_IMAGEM_EXERCICIO) return { path: null, error: 'A imagem deve ter no máximo 5 MB.' }
  const extensao = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${extensao}`
  const { error } = await sb.storage.from(BUCKET_EXERCICIOS).upload(path, file, { upsert: false })
  if (error) {
    console.error('[uploadImagemExercicio]', error)
    return { path: null, error: 'Não foi possível enviar a imagem.' }
  }
  return { path, error: null }
}

export async function getImagemExercicioUrl(sb: SB, path: string): Promise<string | null> {
  const { data, error } = await sb.storage.from(BUCKET_EXERCICIOS).createSignedUrl(path, 60 * 60)
  if (error) {
    console.error('[getImagemExercicioUrl]', error)
    return null
  }
  return data.signedUrl
}

export async function deleteImagemExercicio(sb: SB, path: string): Promise<boolean> {
  const { error } = await sb.storage.from(BUCKET_EXERCICIOS).remove([path])
  if (error) console.error('[deleteImagemExercicio]', error)
  return !error
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

export async function getDadosDashboardTreino(
  sb: SB,
  userId: string,
): Promise<DadosDashboardTreino | null> {
  const inicioSemana = new Date()
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7))
  inicioSemana.setHours(0, 0, 0, 0)

  const [treinos, sessoes, sessoesSemana, sessoesConcluidas, shape, forca, cardio] = await Promise.all([
    sb.from('treinos').select('uuid, nome, descricao, modulo_uuid').eq('user_id', userId).eq('deleted', false).order('nome'),
    sb.from('sessoes_treino').select('uuid, treino_uuid, data_inicio, data_fim').eq('user_id', userId).eq('deleted', false).order('data_inicio', { ascending: false }).limit(12),
    sb.from('sessoes_treino').select('uuid, treino_uuid, data_inicio, data_fim').eq('user_id', userId).eq('deleted', false).gte('data_inicio', inicioSemana.toISOString()).order('data_inicio', { ascending: false }),
    sb.from('sessoes_treino').select('treino_uuid').eq('user_id', userId).eq('deleted', false).not('data_fim', 'is', null),
    sb.from('shape').select('uuid, data, peso, foto_path, updated_at').eq('user_id', userId).eq('deleted', false).order('data', { ascending: false }).order('updated_at', { ascending: false }).limit(6),
    sb.from('exercicios_forca').select('uuid').eq('user_id', userId).eq('deleted', false),
    sb.from('exercicios_cardio').select('uuid').eq('user_id', userId).eq('deleted', false),
  ])

  const erro = treinos.error ?? sessoes.error ?? sessoesSemana.error ?? sessoesConcluidas.error ?? shape.error ?? forca.error ?? cardio.error
  if (erro) {
    console.error('[getDadosDashboardTreino]', erro)
    return null
  }

  return {
    treinos: treinos.data ?? [],
    sessoes: sessoes.data ?? [],
    sessoesSemana: sessoesSemana.data ?? [],
    sessoesConcluidas: sessoesConcluidas.data ?? [],
    registrosShape: shape.data ?? [],
    totalExercicios: (forca.data?.length ?? 0) + (cardio.data?.length ?? 0),
  }
}
