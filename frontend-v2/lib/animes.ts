import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Schema — 009_biblioteca_v2_b3.sql (DEC-025)
export type StatusAnime = 'quero_ver' | 'assistindo' | 'assistido' | 'pausado' | 'abandonado';

export interface Anime {
  uuid: string;
  user_id: string;
  nome_original: string;
  nome_traduzido: string | null;
  capa_url: string | null;
  capa_path: string | null;
  banner_url: string | null;
  banner_path: string | null;
  sinopse: string | null;
  ano_lancamento: number | null;
  ano_termino: number | null;
  classificacao_indicativa: string | null;
  duracao_minutos: number | null; // duração média por episódio
  mal_id: string | null;
  anilist_id: string | null;
  link_imdb: string | null;
  link_mal: string | null;
  link_anilist: string | null;
  link_oficial: string | null;
  diretor: string | null;
  roteirista: string | null;
  produtores: string | null;
  estudio: string | null;
  distribuidora: string | null;
  character_designer: string | null;
  animador_chefe: string | null;
  compositor: string | null;
  status: StatusAnime;
  nota: number | null;
  comentario: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  favorito: boolean;
  vezes_consumido: number;
  onde_consumi: string | null;
  valor_pago: number | null;
  updated_at: string;
  deleted: boolean;
}

export type AnimeInput = Partial<
  Omit<Anime, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { nome_original: string };

export async function listarAnimes(): Promise<Anime[] | null> {
  const { data, error } = await sb
    .from('animes')
    .select('*')
    .eq('deleted', false)
    .order('nome_original', { ascending: true });

  if (error) {
    sbErr(error, 'listarAnimes');
    return null;
  }
  return data as Anime[];
}

export async function criarAnime(dados: AnimeInput): Promise<Anime | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarAnime');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ver' as StatusAnime,
    favorito: false,
    vezes_consumido: 0,
    ...dados,
  };

  const { data, error } = await sb.from('animes').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarAnime');
    return null;
  }
  return data as Anime;
}

export async function atualizarAnime(uuid: string, dados: AnimeInput): Promise<Anime | null> {
  const { data, error } = await sb
    .from('animes')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarAnime(${uuid})`);
    return null;
  }
  return data as Anime;
}

export async function apagarAnime(uuid: string): Promise<boolean> {
  const { error } = await softDelete('animes', uuid);
  return !error;
}