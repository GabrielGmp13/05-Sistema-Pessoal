import { getUserId, sb, sbErr, softDelete } from './supabase';

export type TipoMaterialEstudo = 'link' | 'pdf' | 'video' | 'livro' | 'outro';

export interface MaterialEstudo {
  uuid: string;
  user_id: string;
  conteudo_uuid: string;
  tipo: TipoMaterialEstudo;
  titulo: string;
  url: string | null;
  arquivo_path: string | null;
  updated_at: string;
  deleted: boolean;
}

export type MaterialEstudoInput = Omit<
  MaterialEstudo,
  'uuid' | 'user_id' | 'updated_at' | 'deleted'
>;

export async function listarMateriaisPorConteudos(
  conteudoUuids: string[],
): Promise<MaterialEstudo[] | null> {
  if (conteudoUuids.length === 0) return [];

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materiais_estudo')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('conteudo_uuid', conteudoUuids)
    .order('updated_at', { ascending: false });

  if (error) return sbErr(error, 'listarMateriaisPorConteudos');
  return data;
}

export async function criarMaterialEstudo(
  input: MaterialEstudoInput,
): Promise<MaterialEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materiais_estudo')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarMaterialEstudo');
  return data;
}

export async function deletarMaterialEstudo(uuid: string): Promise<boolean> {
  return softDelete('materiais_estudo', uuid);
}
