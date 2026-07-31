import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Tabela polimórfica — DEC-024 (008_biblioteca_v2_b2.sql)
export type TipoObraTrilha = 'filme' | 'serie';

export interface TrilhaSonoraItem {
  uuid: string;
  user_id: string;
  tipo_obra: TipoObraTrilha;
  obra_uuid: string;
  nome: string;
  artista: string | null;
  duracao_segundos: number | null;
  link_spotify: string | null;
  link_youtube_music: string | null;
  ordem: number;
  updated_at: string;
  deleted: boolean;
}

export type TrilhaSonoraInput = Partial<
  Omit<TrilhaSonoraItem, 'uuid' | 'user_id' | 'tipo_obra' | 'obra_uuid' | 'updated_at' | 'deleted'>
> & { nome: string };

export async function listarTrilhaSonora(
  tipoObra: TipoObraTrilha,
  obraUuid: string
): Promise<TrilhaSonoraItem[] | null> {
  const { data, error } = await sb
    .from('trilha_sonora')
    .select('*')
    .eq('tipo_obra', tipoObra)
    .eq('obra_uuid', obraUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true });

  if (error) {
    sbErr(error, `listarTrilhaSonora(${tipoObra}, ${obraUuid})`);
    return null;
  }
  return data as TrilhaSonoraItem[];
}

export async function criarTrilhaSonora(
  tipoObra: TipoObraTrilha,
  obraUuid: string,
  dados: TrilhaSonoraInput
): Promise<TrilhaSonoraItem | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarTrilhaSonora');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    tipo_obra: tipoObra,
    obra_uuid: obraUuid,
    ordem: 0,
    ...dados,
  };

  const { data, error } = await sb.from('trilha_sonora').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarTrilhaSonora');
    return null;
  }
  return data as TrilhaSonoraItem;
}

export async function atualizarTrilhaSonora(
  uuid: string,
  dados: TrilhaSonoraInput
): Promise<TrilhaSonoraItem | null> {
  const { data, error } = await sb
    .from('trilha_sonora')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarTrilhaSonora(${uuid})`);
    return null;
  }
  return data as TrilhaSonoraItem;
}

export async function apagarTrilhaSonora(uuid: string): Promise<boolean> {
  return await softDelete('trilha_sonora', uuid);
}
