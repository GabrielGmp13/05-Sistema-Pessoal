import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// openings_endings — 009_biblioteca_v2_b3.sql
// Equivalente à trilha_sonora de filme/série, mas exclusivo de anime
// (openings/endings são um conceito próprio do formato, não reaproveitado).

export type TipoOpeningEnding = 'opening' | 'ending' | 'trilha_sonora';

export interface OpeningEnding {
  uuid: string;
  user_id: string;
  anime_uuid: string;
  tipo: TipoOpeningEnding;
  nome: string;
  artista: string | null;
  link_video: string | null;
  minha_nota: number | null;
  ordem: number;
  updated_at: string;
  deleted: boolean;
}

export type OpeningEndingInput = Partial<
  Omit<OpeningEnding, 'uuid' | 'user_id' | 'anime_uuid' | 'updated_at' | 'deleted'>
> & { tipo: TipoOpeningEnding; nome: string };

export async function listarOpeningsEndings(animeUuid: string): Promise<OpeningEnding[] | null> {
  const { data, error } = await sb
    .from('openings_endings')
    .select('*')
    .eq('anime_uuid', animeUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true });

  if (error) {
    sbErr(error, `listarOpeningsEndings(${animeUuid})`);
    return null;
  }
  return data as OpeningEnding[];
}

export async function criarOpeningEnding(
  animeUuid: string,
  dados: OpeningEndingInput
): Promise<OpeningEnding | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarOpeningEnding');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    anime_uuid: animeUuid,
    ordem: 0,
    ...dados,
  };

  const { data, error } = await sb.from('openings_endings').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarOpeningEnding');
    return null;
  }
  return data as OpeningEnding;
}

export async function atualizarOpeningEnding(
  uuid: string,
  dados: OpeningEndingInput
): Promise<OpeningEnding | null> {
  const { data, error } = await sb
    .from('openings_endings')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarOpeningEnding(${uuid})`);
    return null;
  }
  return data as OpeningEnding;
}

export async function apagarOpeningEnding(uuid: string): Promise<boolean> {
  return await softDelete('openings_endings', uuid);
}
