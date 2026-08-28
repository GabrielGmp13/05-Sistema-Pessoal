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
  { nome: 'Animação', descricao: null },
  { nome: 'Western', descricao: null },
  { nome: 'Policial', descricao: null },
  { nome: 'Aventura histórica', descricao: null },
  { nome: 'Comédia romântica', descricao: null },
  { nome: 'Drama psicológico', descricao: null },
  { nome: 'Fantasia urbana', descricao: null },
  { nome: 'Ficção distópica', descricao: null },
  { nome: 'Ficção jovem adulta', descricao: null },
  { nome: 'Literatura clássica', descricao: null },
  { nome: 'Contos', descricao: null },
  { nome: 'Poesia', descricao: null },
  { nome: 'Crônica', descricao: null },
  { nome: 'Ensaio', descricao: null },
  { nome: 'Autobiografia', descricao: null },
  { nome: 'Memórias', descricao: null },
  { nome: 'Autoajuda', descricao: null },
  { nome: 'Desenvolvimento pessoal', descricao: null },
  { nome: 'Filosofia', descricao: null },
  { nome: 'Psicologia', descricao: null },
  { nome: 'Sociologia', descricao: null },
  { nome: 'Ciência', descricao: null },
  { nome: 'Tecnologia', descricao: null },
  { nome: 'Negócios', descricao: null },
  { nome: 'Economia', descricao: null },
  { nome: 'Política', descricao: null },
  { nome: 'Religião', descricao: null },
  { nome: 'Espiritualidade', descricao: null },
  { nome: 'Esportes', descricao: null },
  { nome: 'Culinária', descricao: null },
  { nome: 'Viagem', descricao: null },
  { nome: 'Educação', descricao: null },
  { nome: 'Notícias', descricao: null },
  { nome: 'True crime', descricao: null },
  { nome: 'Entrevista', descricao: null },
  { nome: 'Slice of life', descricao: 'Histórias do cotidiano, sem grandes conflitos centrais — foco na vivência dos personagens.' },

  // Japoneses (classificação por público-alvo, não por tema)
  { nome: 'Shounen', descricao: 'Voltado a público jovem masculino. Foco em ação, superação e amizade — ex: Naruto, One Piece.' },
  { nome: 'Shoujo', descricao: 'Voltado a público jovem feminino. Foco em romance e relações interpessoais — ex: Sailor Moon.' },
  { nome: 'Seinen', descricao: 'Voltado a público adulto masculino. Temas mais maduros e complexos — ex: Berserk, Attack on Titan.' },
  { nome: 'Josei', descricao: 'Voltado a público adulto feminino. Romance e drama com abordagem realista — ex: Nana.' },
  { nome: 'Isekai', descricao: 'Personagem transportado para outro mundo (fantasia, jogo, dimensão paralela).' },
  { nome: 'Mecha', descricao: 'Foco em robôs gigantes pilotados — ex: Gundam, Evangelion.' },
  { nome: 'Mahou shoujo', descricao: 'Histórias de garotas mágicas, transformação e fantasia.' },
  { nome: 'Esportes (anime)', descricao: 'Narrativas centradas em treinamento e competição esportiva.' },
  { nome: 'Sobrenatural', descricao: null },
  { nome: 'Artes marciais', descricao: null },
  { nome: 'Gastronomia', descricao: null },
  { nome: 'Ecchi', descricao: 'Conteúdo com apelo sexual leve, sem ser explícito.' },
  { nome: 'Yaoi', descricao: 'Romance entre personagens masculinos, voltado a público feminino.' },
  { nome: 'Yuri', descricao: 'Romance entre personagens femininas.' },
]

export async function seedGenerosSeNecessario(sb: SB, userId: string): Promise<void> {
  const { data: existentes, error: erroContagem } = await sb
    .from('generos')
    .select('nome')
    .eq('user_id', userId)
    .eq('deleted', false)

  if (erroContagem) {
    console.error('[seedGenerosSeNecessario] erro ao contar:', erroContagem)
    return
  }
  const nomes = new Set((existentes ?? []).map((item: { nome: string }) => item.nome.trim().toLocaleLowerCase('pt-BR')))
  const faltantes = GENEROS_PADRAO.filter((genero) => !nomes.has(genero.nome.toLocaleLowerCase('pt-BR')))
  if (faltantes.length === 0) return

  const linhas = faltantes.map((g) => ({
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

export type TipoMidia = 'livros' | 'filmes' | 'series' | 'animes' | 'mangas' | 'podcasts'

const JUNCAO: Record<TipoMidia, { tabela: string; coluna: string }> = {
  livros:   { tabela: 'livros_generos',   coluna: 'livro_uuid' },
  filmes:   { tabela: 'filmes_generos',   coluna: 'filme_uuid' },
  series:   { tabela: 'series_generos',   coluna: 'serie_uuid' },
  animes:   { tabela: 'animes_generos',   coluna: 'anime_uuid' },
  mangas:   { tabela: 'mangas_generos',   coluna: 'manga_uuid' },
  podcasts: { tabela: 'podcasts_generos', coluna: 'podcast_uuid' },
}

/** Busca as juncoes de varios itens em uma unica consulta. */
export async function getMapaGenerosDosItens(
  sb: SB,
  userId: string,
  tipo: TipoMidia,
  itemUuids: string[],
): Promise<Record<string, string[]>> {
  if (itemUuids.length === 0) return {}

  const { tabela, coluna } = JUNCAO[tipo]
  const { data, error } = await sb
    .from(tabela)
    .select(`${coluna}, genero_uuid`)
    .eq('user_id', userId)
    .eq('deleted', false)
    .in(coluna, itemUuids)

  if (error) {
    console.error('[getMapaGenerosDosItens]', error)
    return {}
  }

  const mapa: Record<string, string[]> = {}
  const linhas = (data ?? []) as unknown as Array<Record<string, string>>
  for (const linha of linhas) {
    const itemUuid = linha[coluna]
    if (!itemUuid) continue
    mapa[itemUuid] = [...(mapa[itemUuid] ?? []), linha.genero_uuid]
  }
  return mapa
}

const GENEROS_EXTERNOS: Record<string, string> = {
  action: 'Ação', adventure: 'Aventura', animation: 'Animação', comedy: 'Comédia', crime: 'Crime',
  documentary: 'Documentário', drama: 'Drama', family: 'Família', fantasy: 'Fantasia', history: 'Histórico',
  horror: 'Terror', music: 'Musical', mystery: 'Mistério', romance: 'Romance', science: 'Ciência',
  'science fiction': 'Ficção científica', thriller: 'Suspense', war: 'Guerra', western: 'Western',
  biography: 'Biografia', philosophy: 'Filosofia', psychology: 'Psicologia', technology: 'Tecnologia',
  business: 'Negócios', education: 'Educação', sports: 'Esportes', supernatural: 'Sobrenatural',
  'slice of life': 'Slice of life', shounen: 'Shounen', shoujo: 'Shoujo', seinen: 'Seinen', josei: 'Josei',
  isekai: 'Isekai', mecha: 'Mecha', ecchi: 'Ecchi', boys: 'Yaoi', girls: 'Yuri',
}

function nomeGeneroExterno(nome: string) {
  const limpo = nome.split('/')[0].trim()
  const chave = limpo.toLocaleLowerCase('en-US')
  const aproximado = Object.entries(GENEROS_EXTERNOS).find(([origem]) => chave === origem || chave.includes(origem))?.[1]
  return aproximado ?? limpo
}

/** Garante que gêneros retornados pelas APIs existam e devolve seus UUIDs. */
export async function garantirGenerosExternos(
  sb: SB,
  userId: string,
  nomesExternos: string[],
): Promise<{ generos: Genero[]; selecionados: string[] }> {
  const nomes = [...new Set(nomesExternos.map(nomeGeneroExterno).filter(Boolean))].slice(0, 12)
  let existentes = await getGeneros(sb, userId)
  const chaves = new Set(existentes.map((genero) => genero.nome.toLocaleLowerCase('pt-BR')))
  const faltantes = nomes.filter((nome) => !chaves.has(nome.toLocaleLowerCase('pt-BR')))
  if (faltantes.length > 0) {
    const { error } = await sb.from('generos').insert(faltantes.map((nome) => ({
      uuid: crypto.randomUUID(), user_id: userId, nome, descricao: null,
    })))
    if (!error) existentes = await getGeneros(sb, userId)
  }
  const desejados = new Set(nomes.map((nome) => nome.toLocaleLowerCase('pt-BR')))
  return { generos: existentes, selecionados: existentes.filter((genero) => desejados.has(genero.nome.toLocaleLowerCase('pt-BR'))).map((genero) => genero.uuid) }
}

// Sincroniza por diferenca. Novas associacoes entram antes da remocao das
// antigas para que uma falha parcial nunca deixe o item sem generos validos.
export async function salvarGenerosDoItem(
  sb: SB, userId: string, tipo: TipoMidia, itemUuid: string, generoUuids: string[]
): Promise<{ error: string | null }> {
  const { tabela, coluna } = JUNCAO[tipo]
  const desejados = [...new Set(generoUuids)]

  const { data: dataAtuais, error: erroBusca } = await sb
    .from(tabela)
    .select('uuid, genero_uuid')
    .eq('user_id', userId)
    .eq(coluna, itemUuid)
    .eq('deleted', false)

  if (erroBusca) {
    console.error('[salvarGenerosDoItem] busca', erroBusca)
    return { error: erroBusca.message }
  }

  const atuais = (dataAtuais ?? []) as Array<{ uuid: string; genero_uuid: string }>
  const desejadosSet = new Set(desejados)
  const mantidos = new Set<string>()
  const uuidsParaRemover: string[] = []

  for (const atual of atuais) {
    if (!desejadosSet.has(atual.genero_uuid) || mantidos.has(atual.genero_uuid)) {
      uuidsParaRemover.push(atual.uuid)
    } else {
      mantidos.add(atual.genero_uuid)
    }
  }

  const faltantes = desejados.filter((generoUuid) => !mantidos.has(generoUuid))

  if (faltantes.length > 0) {
    const linhas = faltantes.map((generoUuid) => ({
      uuid: crypto.randomUUID(),
      user_id: userId,
      [coluna]: itemUuid,
      genero_uuid: generoUuid,
    }))

    const { error: erroInsert } = await sb.from(tabela).insert(linhas)
    if (erroInsert) {
      console.error('[salvarGenerosDoItem] insert', erroInsert)
      return { error: erroInsert.message }
    }
  }

  if (uuidsParaRemover.length > 0) {
    const { error: erroDelete } = await sb
      .from(tabela)
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('uuid', uuidsParaRemover)

    if (erroDelete) {
      console.error('[salvarGenerosDoItem] delete', erroDelete)
      return { error: erroDelete.message }
    }
  }

  return { error: null }
}
