import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Tabela polimórfica — DEC-024 (008), estendida em DEC-025 (009) com
// dublador_original/dublador_br para uso em animes.
export type TipoObraElenco = 'filme' | 'serie' | 'anime';

export interface ElencoItem {
  uuid: string;
  user_id: string;
  tipo_obra: TipoObraElenco;
  obra_uuid: string;
  ator: string | null;              // filme/série usam este campo
  dublador_original: string | null; // anime usa estes dois em vez de 'ator'
  dublador_br: string | null;
  personagem: string | null;        // compartilhado entre todos os tipos
  foto_url: string | null;          // compartilhado entre todos os tipos
  ordem: number;
  updated_at: string;
  deleted: boolean;
}

export type ElencoInput = Partial<
  Omit<ElencoItem, 'uuid' | 'user_id' | 'tipo_obra' | 'obra_uuid' | 'updated_at' | 'deleted'>
>;

export async function listarElenco(
  tipoObra: TipoObraElenco,
  obraUuid: string
): Promise<ElencoItem[] | null> {
  const { data, error } = await sb
    .from('elenco')
    .select('*')
    .eq('tipo_obra', tipoObra)
    .eq('obra_uuid', obraUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true });

  if (error) {
    sbErr(error, `listarElenco(${tipoObra}, ${obraUuid})`);
    return null;
  }
  return data as ElencoItem[];
}

export async function criarElenco(
  tipoObra: TipoObraElenco,
  obraUuid: string,
  dados: ElencoInput
): Promise<ElencoItem | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarElenco');
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

  const { data, error } = await sb.from('elenco').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarElenco');
    return null;
  }
  return data as ElencoItem;
}

export async function atualizarElenco(
  uuid: string,
  dados: ElencoInput
): Promise<ElencoItem | null> {
  const { data, error } = await sb
    .from('elenco')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarElenco(${uuid})`);
    return null;
  }
  return data as ElencoItem;
}

export async function apagarElenco(uuid: string): Promise<boolean> {
  return await softDelete('elenco', uuid);
}
