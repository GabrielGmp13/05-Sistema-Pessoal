import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// mangas_volumes — 011_biblioteca_v2_b4_mangas.sql
// Cada linha é um volume, agrupado por arco. `cor` (hex) identifica o arco
// visualmente na listagem.

export interface MangaVolume {
  uuid: string;
  user_id: string;
  manga_uuid: string;
  numero: number;
  arco: string | null;
  cor: string | null;
  lido: boolean;
  data_leitura: string | null;
  updated_at: string;
  deleted: boolean;
}

export type MangaVolumeInput = Partial<
  Omit<MangaVolume, 'uuid' | 'user_id' | 'manga_uuid' | 'updated_at' | 'deleted'>
> & { numero: number };

export type MangaVolumeUpdate = Partial<
  Omit<MangaVolume, 'uuid' | 'user_id' | 'manga_uuid' | 'updated_at' | 'deleted'>
>;

export async function listarVolumes(mangaUuid: string): Promise<MangaVolume[] | null> {
  const { data, error } = await sb
    .from('mangas_volumes')
    .select('*')
    .eq('manga_uuid', mangaUuid)
    .eq('deleted', false)
    .order('numero', { ascending: true });

  if (error) {
    sbErr(error, `listarVolumes(${mangaUuid})`);
    return null;
  }
  return data as MangaVolume[];
}

export async function criarVolume(
  mangaUuid: string,
  dados: MangaVolumeInput
): Promise<MangaVolume | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarVolume');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    manga_uuid: mangaUuid,
    lido: false,
    ...dados,
  };

  const { data, error } = await sb.from('mangas_volumes').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarVolume');
    return null;
  }
  return data as MangaVolume;
}

export async function atualizarVolume(
  uuid: string,
  dados: MangaVolumeUpdate
): Promise<MangaVolume | null> {
  const { data, error } = await sb
    .from('mangas_volumes')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarVolume(${uuid})`);
    return null;
  }
  return data as MangaVolume;
}

export async function apagarVolume(uuid: string): Promise<boolean> {
  return await softDelete('mangas_volumes', uuid);
}
