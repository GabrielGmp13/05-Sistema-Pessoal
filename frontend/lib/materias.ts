import { sb, getUserId, sbErr } from './supabase';

export type TipoMateria = 'enem' | 'escola' | 'olimpiada' | 'concurso' | 'curso' | 'outro';

export interface Materia {
  uuid: string;
  user_id: string;
  nome: string;
  tipo: TipoMateria;
  cor: string | null;
  // campos de Curso (uso exclusivo quando tipo === 'curso')
  plataforma: string | null;
  carga_horaria_total_horas: number | null;
  horas_dedicadas: number;
  certificado_path: string | null;
  concluido: boolean;
  data_conclusao: string | null;
  updated_at: string;
  deleted: boolean;
}

export type MateriaInput = Omit<Materia, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;
export type MateriaUpdate = Partial<MateriaInput>;

export async function listarMaterias(tipo?: TipoMateria): Promise<Materia[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  let query = sb.from('materias').select('*').eq('user_id', userId).eq('deleted', false);
  if (tipo) query = query.eq('tipo', tipo);

  const { data, error } = await query.order('nome');
  if (error) return sbErr(error, 'listarMaterias');
  return data;
}

export async function criarMateria(input: MateriaInput): Promise<Materia | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materias')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarMateria');
  return data;
}

export async function atualizarMateria(uuid: string, update: MateriaUpdate): Promise<Materia | null> {
  const { data, error } = await sb
    .from('materias')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, 'atualizarMateria');
  return data;
}