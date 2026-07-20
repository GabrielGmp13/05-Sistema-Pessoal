import { createBrowserClient } from '@supabase/ssr'

type SB = ReturnType<typeof createBrowserClient>

export interface Genero {
  uuid: string
  nome: string
  descricao: string | null
}

// Seed inicial — gêneros gerais (autoexplicativos, descrição opcional)
// + gêneros japoneses (descrição obrigatória, usuário confirmou que precisa
// do tooltip pra esses). Ver DEC-023.
const GENEROS_PADRAO: Omit<Genero, 'uuid'>[] = [
  // Gerais
  { nome: 'Ação', descricao: null },
  { nome: 'Aventura', descricao: null },
  { nome: 'Comédia', descricao: null },
  { nome: 'Drama', descricao: null },
  { nome: 'Terror', descricao: null },
  { nome: 'Suspense', descricao: null },
  { nome: 'Romance', descricao: null },
  { nome: 'Ficção científica', descricao: null },
  { nome: 'Fantasia', descricao: null },
  { nome: 'Mistério', descricao: null },
  { nome: 'Documentário', descricao: null },
  { nome: 'Biografia', descricao: null },
  { nome: 'Histórico', descricao: null },
  { nome: 'Musical', descricao: null },
  { nome: 'Guerra', descricao: null },
  { nome: 'Crime', descricao: null },
  { nome: 'Família', descricao: null },
  { nome: 'Slice of life', descricao: 'Histórias do cotidiano, sem grandes conflitos centrais — foco na vivência dos personagens.' },

  // Japoneses (classificação por público-alvo, não por tema)
  { nome: 'Shounen', descricao: 'Voltado a público jovem masculino. Foco em ação, superação e amizade — ex: Naruto, One Piece.' },
  { nome: 'Shoujo', descricao: 'Voltado a público jovem feminino. Foco em romance e relações interpessoais — ex: Sailor Moon.' },
  { nome: 'Seinen', descricao: 'Voltado a público adulto masculino. Temas mais maduros e complexos — ex: Berserk, Attack on Titan.' },
  { nome: 'Josei', descricao: 'Voltado a público adulto feminino. Romance e drama com abordagem realista — ex: Nana.' },
  { nome: 'Isekai', descricao: 'Personagem transportado para outro mundo (fantasia, jogo, dimensão paralela).' },
  { nome: 'Mecha', descricao: 'Foco em robôs gigantes pilotados — ex: Gundam, Evangelion.' },
  { nome: 'Ecchi', descricao: 'Conteúdo com apelo sexual leve, sem ser explícito.' },
  { nome: 'Yaoi', descricao: 'Romance entre personagens masculinos, voltado a público feminino.' },
  { nome: 'Yuri', descricao: 'Romance entre personagens femininas.' },
]

export async function seedGenerosSeNecessario(sb: SB, userId: string): Promise<void> {
  const { count, error: erroContagem } = await sb
    .from('generos')
    .select('uuid', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('deleted', false)

  if (erroContagem) {
    console.error('[seedGenerosSeNecessario] erro ao contar:', erroContagem)
    return
  }
  if (count && count > 0) return

  const linhas = GENEROS_PADRAO.map((g) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    nome: g.nome,
    descricao: g.descricao,
  }))

  const { error } = await sb.from('generos').insert(linhas)
  if (error) console.error('[seedGenerosSeNecessario] erro ao inserir seed:', error)
}

export async function getGeneros(sb: SB, userId: string): Promise<Genero[]> {
  const { data, error } = await sb
    .from('generos')
    .select('uuid, nome, descricao')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('nome', { ascending: true })

  if (error) {
    console.error('[getGeneros]', error)
    return []
  }
  const lista: Genero[] = data ?? []
  return lista
}

export async function criarGenero(
  sb: SB, userId: string, nome: string, descricao: string
): Promise<{ error: string | null }> {
  const { error } = await sb.from('generos').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    nome: nome.trim(),
    descricao: descricao.trim() || null,
  })
  if (error) console.error('[criarGenero]', error)
  return { error: error?.message ?? null }
}

export async function atualizarGenero(
  sb: SB, uuid: string, nome: string, descricao: string
): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('generos')
    .update({ nome: nome.trim(), descricao: descricao.trim() || null, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
  if (error) console.error('[atualizarGenero]', error)
  return { error: error?.message ?? null }
}

export async function softDeleteGenero(sb: SB, uuid: string): Promise<{ error: string | null }> {
  const { error } = await sb
    .from('generos')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
  if (error) console.error('[softDeleteGenero]', error)
  return { error: error?.message ?? null }
}

// ---------- Junções por tipo (usado pela B2 em diante) ----------
// Nome da tabela de junção e da coluna FK do item variam por tipo — ver DATABASE.md.

type TipoMidia = 'livros' | 'filmes' | 'series' | 'animes' | 'mangas' | 'podcasts'

const JUNCAO: Record<TipoMidia, { tabela: string; coluna: string }> = {
  livros:   { tabela: 'livros_generos',   coluna: 'livro_uuid' },
  filmes:   { tabela: 'filmes_generos',   coluna: 'filme_uuid' },
  series:   { tabela: 'series_generos',   coluna: 'serie_uuid' },
  animes:   { tabela: 'animes_generos',   coluna: 'anime_uuid' },
  mangas:   { tabela: 'mangas_generos',   coluna: 'manga_uuid' },
  podcasts: { tabela: 'podcasts_generos', coluna: 'podcast_uuid' },
}

export async function getGenerosDoItem(
  sb: SB, userId: string, tipo: TipoMidia, itemUuid: string
): Promise<string[]> {
  const { tabela, coluna } = JUNCAO[tipo]
  const { data, error } = await sb
    .from(tabela)
    .select('genero_uuid')
    .eq('user_id', userId)
    .eq(coluna, itemUuid)
    .eq('deleted', false)

  if (error) {
    console.error('[getGenerosDoItem]', error)
    return []
  }
  return (data ?? []).map((l: { genero_uuid: string }) => l.genero_uuid)
}

// Substitui a lista completa de gêneros de um item (apaga os antigos, insere os novos).
// Mais simples que fazer diff — volume de dados por item é pequeno.
export async function salvarGenerosDoItem(
  sb: SB, userId: string, tipo: TipoMidia, itemUuid: string, generoUuids: string[]
): Promise<{ error: string | null }> {
  const { tabela, coluna } = JUNCAO[tipo]

  const { error: erroDelete } = await sb
    .from(tabela)
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq(coluna, itemUuid)

  if (erroDelete) {
    console.error('[salvarGenerosDoItem] delete', erroDelete)
    return { error: erroDelete.message }
  }

  if (generoUuids.length === 0) return { error: null }

  const linhas = generoUuids.map((generoUuid) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    [coluna]: itemUuid,
    genero_uuid: generoUuid,
  }))

  const { error: erroInsert } = await sb.from(tabela).insert(linhas)
  if (erroInsert) console.error('[salvarGenerosDoItem] insert', erroInsert)
  return { error: erroInsert?.message ?? null }
}