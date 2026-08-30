import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// animes_temporadas — 009_biblioteca_v2_b3.sql
// Mesma forma de series_temporadas, mas ligada a animes_uuid.
// Diferente de series_temporadas: aqui existe granularidade por episódio
// em tabela separada (animes_episodios), com marcação de filler.

export interface AnimeTemporada {
  uuid: string;
  user_id: string;
  anime_uuid: string;
  numero: number;
  numero_episodios: number | null;
  nota_imdb: number | null;
  minha_nota: number | null;
  data_assisti: string | null;
  nome_original: string | null;
  nome_traduzido: string | null;
  capa_url: string | null;
  sinopse: string | null;
  ano_lancamento: number | null;
  ano_termino: number | null;
  duracao_minutos: number | null;
  anilist_id: string | null;
  mal_id: string | null;
  link_anilist: string | null;
  link_mal: string | null;
  formato: string | null;
  tipo_relacao: string | null;
  diretor: string | null;
  roteirista: string | null;
  produtores: string | null;
  estudio: string | null;
  character_designer: string | null;
  animador_chefe: string | null;
  compositor: string | null;
  updated_at: string;
  deleted: boolean;
}

export type AnimeTemporadaInput = Partial<
  Omit<AnimeTemporada, 'uuid' | 'user_id' | 'anime_uuid' | 'updated_at' | 'deleted'>
> & { numero: number };

export async function listarTemporadasAnime(animeUuid: string): Promise<AnimeTemporada[] | null> {
  const { data, error } = await sb
    .from('animes_temporadas')
    .select('*')
    .eq('anime_uuid', animeUuid)
    .eq('deleted', false)
    .order('numero', { ascending: true });

  if (error) {
    sbErr(error, `listarTemporadasAnime(${animeUuid})`);
    return null;
  }
  return data as AnimeTemporada[];
}

export async function criarTemporadaAnime(
  animeUuid: string,
  dados: AnimeTemporadaInput
): Promise<AnimeTemporada | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarTemporadaAnime');
    return null;
  }

  const nova = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    anime_uuid: animeUuid,
    ...dados,
  };

  const { data, error } = await sb.from('animes_temporadas').insert(nova).select().single();
  if (error) {
    sbErr(error, 'criarTemporadaAnime');
    return null;
  }
  return data as AnimeTemporada;
}

export async function atualizarTemporadaAnime(
  uuid: string,
  dados: AnimeTemporadaInput
): Promise<AnimeTemporada | null> {
  const { data, error } = await sb
    .from('animes_temporadas')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarTemporadaAnime(${uuid})`);
    return null;
  }
  return data as AnimeTemporada;
}

export async function apagarTemporadaAnime(uuid: string): Promise<boolean> {
  return await softDelete('animes_temporadas', uuid);
}
