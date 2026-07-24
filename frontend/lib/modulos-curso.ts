import { sb, getUserId, sbErr, softDelete } from './supabase';

export interface ModuloCurso {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  nome: string;
  ordem: number;
  updated_at: string;
  deleted: boolean;
}

export type ModuloCursoInput = Omit<ModuloCurso, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;

export async function listarModulosCurso(materiaUuid: string): Promise<ModuloCurso[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('modulos_curso')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('ordem');

  if (error) return sbErr(error, 'listarModulosCurso');
  return data;
}

export async function criarModuloCurso(input: ModuloCursoInput): Promise<ModuloCurso | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('modulos_curso')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarModuloCurso');
  return data;
}

export async function deletarModuloCurso(uuid: string): Promise<boolean> {
  return softDelete('modulos_curso', uuid);
}