import { getUserId, sb, sbErr, softDelete } from './supabase';

export interface SessaoEstudo {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  conteudo_uuid: string | null;
  inicio: string;
  fim: string | null;
  duracao_minutos: number | null;
  observacoes: string | null;
  updated_at: string;
  deleted: boolean;
}

export type SessaoEstudoInput = Omit<
  SessaoEstudo,
  'uuid' | 'user_id' | 'updated_at' | 'deleted'
>;

export async function listarSessoesPorMateria(
  materiaUuid: string,
): Promise<SessaoEstudo[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('sessoes_estudo')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('inicio', { ascending: false });

  if (error) return sbErr(error, 'listarSessoesPorMateria');
  return data;
}

export async function criarSessaoEstudo(
  input: SessaoEstudoInput,
): Promise<SessaoEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('sessoes_estudo')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarSessaoEstudo');
  return data;
}

export async function deletarSessaoEstudo(uuid: string): Promise<boolean> {
  return softDelete('sessoes_estudo', uuid);
}
