import { sb, getUserId, sbErr, softDelete } from './supabase';

export interface Atividade {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  titulo: string;
  data_entrega: string | null;
  feita: boolean;
  entregue: boolean;
  observacoes: string | null;
  updated_at: string;
  deleted: boolean;
}

export type AtividadeInput = Omit<Atividade, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;
export type AtividadeUpdate = Partial<AtividadeInput>;

export async function listarAtividades(materiaUuid: string): Promise<Atividade[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('atividades')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('data_entrega', { nullsFirst: false });

  if (error) return sbErr(error, 'listarAtividades');
  return data;
}

/** Atividades pendentes (não feitas ou não entregues) de todas as matérias — para o dashboard. */
export async function listarAtividadesPendentes(): Promise<Atividade[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('atividades')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .or('feita.eq.false,entregue.eq.false')
    .order('data_entrega', { nullsFirst: false });

  if (error) return sbErr(error, 'listarAtividadesPendentes');
  return data;
}

export async function criarAtividade(input: AtividadeInput): Promise<Atividade | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('atividades')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarAtividade');
  return data;
}

export async function atualizarAtividade(uuid: string, update: AtividadeUpdate): Promise<Atividade | null> {
  const { data, error } = await sb
    .from('atividades')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, 'atualizarAtividade');
  return data;
}

export async function deletarAtividade(uuid: string): Promise<boolean> {
  return softDelete('atividades', uuid);
}