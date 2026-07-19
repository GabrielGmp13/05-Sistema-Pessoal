import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// series_temporadas — 008_biblioteca_v2_b2.sql (DEC-024)
// Só guarda contagem de episódios, não granularidade por episódio
// (isso é exclusivo de Animes/B3 — animes_episodios).

export interface SerieTemporada {
  uuid: string;
  user_id: string;
  serie_uuid: string;
  numero: number;
  numero_episodios: number | null;
  nota_imdb: number | null; // NUMERIC(3,1)
  minha_nota: number | null; // NUMERIC(2,1)
  data_assisti: string | null; // DATE
  updated_at: string;
  deleted: boolean;
}

export type SerieTemporadaInput = Partial<
  Omit<SerieTemporada, 'uuid' | 'user_id' | 'serie_uuid' | 'updated_at' | 'deleted'>
> & { numero: number };

export async function listarTemporadas(serieUuid: string): Promise<SerieTemporada[] | null> {
  const { data, error } = await sb
    .from('series_temporadas')
    .select('*')
    .eq('serie_uuid', serieUuid)
    .eq('deleted', false)
    .order('numero', { ascending: true });

  if (error) {
    sbErr(error, `listarTemporadas(${serieUuid})`);
    return null;
  }
  return data as SerieTemporada[];
}

export async function criarTemporada(
  serieUuid: string,
  dados: SerieTemporadaInput
): Promise<SerieTemporada | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarTemporada');
    return null;
  }

  const nova = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    serie_uuid: serieUuid,
    ...dados,
  };

  const { data, error } = await sb.from('series_temporadas').insert(nova).select().single();
  if (error) {
    sbErr(error, 'criarTemporada');
    return null;
  }
  return data as SerieTemporada;
}

export async function atualizarTemporada(
  uuid: string,
  dados: SerieTemporadaInput
): Promise<SerieTemporada | null> {
  const { data, error } = await sb
    .from('series_temporadas')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarTemporada(${uuid})`);
    return null;
  }
  return data as SerieTemporada;
}

export async function apagarTemporada(uuid: string): Promise<boolean> {
  const { error } = await softDelete('series_temporadas', uuid);
  return !error;
}