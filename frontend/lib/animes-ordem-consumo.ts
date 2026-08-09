import { sb, getUserId, sbErr, softDelete } from './supabase';

// animes_ordem_consumo — 009_biblioteca_v2_b3.sql
// FK polimórfica: referencia_uuid aponta pra animes_temporadas.uuid (quando
// tipo_referencia = 'temporada') ou filmes.uuid (quando 'complemento').
// Mesmo padrão de exceção de elenco/trilha_sonora (DEC-024).

export type TipoReferenciaOrdem = 'temporada' | 'complemento';

export interface OrdemConsumoItem {
  uuid: string;
  user_id: string;
  anime_uuid: string;
  ordem: number;
  tipo_referencia: TipoReferenciaOrdem;
  referencia_uuid: string;
  rotulo: string; // ex: "Temporada 1", "Filme: O Início"
  updated_at: string;
  deleted: boolean;
}

export type OrdemConsumoInput = Partial<
  Omit<OrdemConsumoItem, 'uuid' | 'user_id' | 'anime_uuid' | 'updated_at' | 'deleted'>
> & { tipo_referencia: TipoReferenciaOrdem; referencia_uuid: string; rotulo: string };

export async function listarOrdemConsumo(animeUuid: string): Promise<OrdemConsumoItem[] | null> {
  const { data, error } = await sb
    .from('animes_ordem_consumo')
    .select('*')
    .eq('anime_uuid', animeUuid)
    .eq('deleted', false)
    .order('ordem', { ascending: true });

  if (error) {
    sbErr(error, `listarOrdemConsumo(${animeUuid})`);
    return null;
  }
  return data as OrdemConsumoItem[];
}

export async function criarItemOrdemConsumo(
  animeUuid: string,
  dados: OrdemConsumoInput
): Promise<OrdemConsumoItem | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarItemOrdemConsumo');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    anime_uuid: animeUuid,
    ordem: 0,
    ...dados,
  };

  const { data, error } = await sb.from('animes_ordem_consumo').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarItemOrdemConsumo');
    return null;
  }
  return data as OrdemConsumoItem;
}

export async function apagarItemOrdemConsumo(uuid: string): Promise<boolean> {
  return await softDelete('animes_ordem_consumo', uuid);
}
