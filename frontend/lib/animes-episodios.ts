import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// animes_episodios — 009_biblioteca_v2_b3.sql
// Granularidade por episódio, exclusiva de Animes (série comum só guarda
// contagem em series_temporadas.numero_episodios). % de filler é calculada
// no frontend a partir desta lista, não persistida — ver DEC-025.

export interface AnimeEpisodio {
  uuid: string;
  user_id: string;
  temporada_uuid: string;
  numero: number;
  titulo: string | null;
  arco: string | null;
  filler: boolean;
  assistido: boolean;
  updated_at: string;
  deleted: boolean;
}

export type AnimeEpisodioInput = Partial<
  Omit<AnimeEpisodio, 'uuid' | 'user_id' | 'temporada_uuid' | 'updated_at' | 'deleted'>
> & { numero: number };

export type AnimeEpisodioUpdate = Partial<
  Omit<AnimeEpisodio, 'uuid' | 'user_id' | 'temporada_uuid' | 'updated_at' | 'deleted'>
>;

export async function listarEpisodios(temporadaUuid: string): Promise<AnimeEpisodio[] | null> {
  const { data, error } = await sb
    .from('animes_episodios')
    .select('*')
    .eq('temporada_uuid', temporadaUuid)
    .eq('deleted', false)
    .order('numero', { ascending: true });

  if (error) {
    sbErr(error, `listarEpisodios(${temporadaUuid})`);
    return null;
  }
  return data as AnimeEpisodio[];
}

export async function criarEpisodio(
  temporadaUuid: string,
  dados: AnimeEpisodioInput
): Promise<AnimeEpisodio | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarEpisodio');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    temporada_uuid: temporadaUuid,
    filler: false,
    assistido: false,
    ...dados,
  };

  const { data, error } = await sb.from('animes_episodios').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarEpisodio');
    return null;
  }
  return data as AnimeEpisodio;
}

export async function atualizarEpisodio(
  uuid: string,
  dados: AnimeEpisodioUpdate
): Promise<AnimeEpisodio | null> {
  const { data, error } = await sb
    .from('animes_episodios')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarEpisodio(${uuid})`);
    return null;
  }
  return data as AnimeEpisodio;
}

export async function apagarEpisodio(uuid: string): Promise<boolean> {
  const { error } = await softDelete('animes_episodios', uuid);
  return !error;
}

// Utilitário puro — % de filler, calculada no frontend (não persistida).
export function calcularPercentualFiller(episodios: AnimeEpisodio[]): number {
  if (episodios.length === 0) return 0;
  const fillers = episodios.filter((e) => e.filler).length;
  return Math.round((fillers / episodios.length) * 100);
}