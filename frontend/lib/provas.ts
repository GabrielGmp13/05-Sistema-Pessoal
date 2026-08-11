import { sb, getUserId, sbErr, softDelete } from './supabase';
import type { AreaEnem } from './materias';

export type TipoProva = 'escola' | 'enem_dia1' | 'enem_dia2' | 'curso' | 'outro';

export interface Prova {
  uuid: string;
  user_id: string;
  materia_uuid: string | null;
  tipo: TipoProva;
  conteudo_uuid: string | null;
  titulo: string | null;
  data: string;
  tempo_minutos: number | null;
  redacao_uuid: string | null;
  nota: number | null;
  feita: boolean;
  observacoes: string | null;
  updated_at: string;
  deleted: boolean;
}

export type ProvaInput = Omit<Prova, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;
export type ProvaUpdate = Partial<ProvaInput>;

/** Busca uma prova específica por uuid — usado pelo gabarito pra saber o dia (tipo). */
export async function buscarProva(uuid: string): Promise<Prova | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('provas')
    .select('*')
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .single();

  if (error) return sbErr(error, 'buscarProva');
  return data;
}

/** Próximas provas (não feitas, data futura ou hoje), ordenadas por data — alimenta o card "próximas provas". */
export async function listarProximasProvas(tipo?: TipoProva): Promise<Prova[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  let query = sb
    .from('provas')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('feita', false)
    .gte('data', new Date().toISOString().slice(0, 10))
    .order('data');

  if (tipo) query = query.eq('tipo', tipo);

  const { data, error } = await query;
  if (error) return sbErr(error, 'listarProximasProvas');
  return data;
}

export async function listarProvasPorMateria(materiaUuid: string): Promise<Prova[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('provas')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('data', { ascending: false });

  if (error) return sbErr(error, 'listarProvasPorMateria');
  return data;
}

/** Provas de um intervalo para a Agenda. A linha continua pertencendo a Estudos. */
export async function listarProvasNoPeriodo(inicio: string, fim: string): Promise<Prova[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('provas')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data');

  if (error) return sbErr(error, 'listarProvasNoPeriodo');
  return data;
}

export async function criarProva(input: ProvaInput): Promise<Prova | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('provas')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarProva');
  return data;
}

export async function atualizarProva(uuid: string, update: ProvaUpdate): Promise<Prova | null> {
  const { data, error } = await sb
    .from('provas')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, 'atualizarProva');
  return data;
}

export async function deletarProva(uuid: string): Promise<boolean> {
  return softDelete('provas', uuid);
}

// ============================================================================
// Estrutura oficial do ENEM (confirmada via Inep, 2026-08) — cada dia tem
// 90 questões numeradas 1-90 (reinicia a cada dia), divididas em 2 áreas de
// 45 questões cada:
//   Dia 1: 1-45 = Linguagens · 46-90 = Ciências Humanas
//   Dia 2: 1-45 = Ciências da Natureza · 46-90 = Matemática
// ============================================================================

export const AREAS_POR_DIA: Record<'enem_dia1' | 'enem_dia2', [AreaEnem, AreaEnem]> = {
  enem_dia1: ['linguagens', 'humanas'],
  enem_dia2: ['natureza', 'matematica'],
};

/** Deriva a área a partir do dia da prova + número da questão (1-90). Retorna null se o tipo não for ENEM. */
export function areaEnemDoNumero(tipo: TipoProva, numero: number): AreaEnem | null {
  if (tipo !== 'enem_dia1' && tipo !== 'enem_dia2') return null;
  const [primeira, segunda] = AREAS_POR_DIA[tipo];
  return numero <= 45 ? primeira : segunda;
}
