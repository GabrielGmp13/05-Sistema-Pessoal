import { getUserId, sb, sbErr, softDelete } from './supabase';

export interface AnotacaoEstudo {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  conteudo_uuid: string | null;
  titulo: string | null;
  corpo: string;
  updated_at: string;
  deleted: boolean;
}

export type AnotacaoEstudoInput = Omit<
  AnotacaoEstudo,
  'uuid' | 'user_id' | 'updated_at' | 'deleted'
>;

export async function listarAnotacoesPorMateria(
  materiaUuid: string,
): Promise<AnotacaoEstudo[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('anotacoes_estudo')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('updated_at', { ascending: false });

  if (error) return sbErr(error, 'listarAnotacoesPorMateria');
  return data;
}

export async function criarAnotacaoEstudo(
  input: AnotacaoEstudoInput,
): Promise<AnotacaoEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('anotacoes_estudo')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarAnotacaoEstudo');
  return data;
}

export async function deletarAnotacaoEstudo(uuid: string): Promise<boolean> {
  return softDelete('anotacoes_estudo', uuid);
}
