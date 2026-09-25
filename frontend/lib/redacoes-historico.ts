import { sb, getUserId } from './supabase'

export interface VersaoRedacao {
  uuid: string; user_id: string; redacao_uuid: string; numero: number
  texto: string | null; imagem_path: string | null; criada_em: string
}
export interface AvaliacaoRedacao {
  uuid: string; user_id: string; redacao_uuid: string; versao_uuid: string | null
  avaliador: string; origem: string; data_avaliacao: string; nota: number
  competencia_1: number | null; competencia_2: number | null; competencia_3: number | null
  competencia_4: number | null; competencia_5: number | null; comentario: string | null
}

export async function historicoRedacao(uuid: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Entre novamente na conta.')
  const [versoes, avaliacoes] = await Promise.all([
    sb.from('redacoes_versoes').select('*').eq('user_id', userId).eq('redacao_uuid', uuid).order('numero', { ascending: false }),
    sb.from('redacoes_avaliacoes').select('*').eq('user_id', userId).eq('redacao_uuid', uuid).eq('deleted', false).order('data_avaliacao', { ascending: false }),
  ])
  if (versoes.error || avaliacoes.error) throw new Error('Não foi possível carregar o histórico.')
  return { versoes: versoes.data as VersaoRedacao[], avaliacoes: avaliacoes.data as AvaliacaoRedacao[] }
}

export async function preservarVersaoRedacao(r: { uuid: string; user_id: string; texto: string | null; imagem_path: string | null }) {
  if (r.texto === null && r.imagem_path === null) return
  const userId = await getUserId()
  if (userId !== r.user_id) throw new Error('A conta mudou. Atualize a página.')
  const { data: ultima, error } = await sb.from('redacoes_versoes').select('*')
    .eq('user_id', userId).eq('redacao_uuid', r.uuid).order('numero', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error('Não foi possível conferir a última versão.')
  if (ultima?.texto === r.texto && ultima?.imagem_path === r.imagem_path) return
  const { error: falha } = await sb.from('redacoes_versoes').insert({
    uuid: crypto.randomUUID(), user_id: userId, redacao_uuid: r.uuid,
    numero: (ultima?.numero ?? 0) + 1, texto: r.texto, imagem_path: r.imagem_path,
  })
  if (falha) throw new Error('Não foi possível preservar a versão. Atualize antes de tentar novamente.')
}

export async function adicionarAvaliacaoRedacao(input: Omit<AvaliacaoRedacao, 'user_id'>, dono: string) {
  const userId = await getUserId()
  if (!userId || userId !== dono) throw new Error('A conta mudou. Atualize a página.')
  const { error } = await sb.from('redacoes_avaliacoes').insert({ ...input, user_id: userId })
  if (error) throw new Error('Gravação não confirmada. Atualize o histórico antes de reenviar.')
}

export async function removerAvaliacaoRedacao(item: AvaliacaoRedacao) {
  const userId = await getUserId()
  if (!userId || userId !== item.user_id) throw new Error('A conta mudou. Atualize a página.')
  const { data, error } = await sb.from('redacoes_avaliacoes').update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId).eq('uuid', item.uuid).eq('deleted', false).select('uuid').single()
  if (error || !data) throw new Error('Remoção não confirmada. Atualize o histórico.')
}
