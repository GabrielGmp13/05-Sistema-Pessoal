import { sb, getUserId, sbErr, softDelete } from './supabase';

export type TipoMateria = 'academica' | 'olimpiada' | 'vestibular' | 'concurso' | 'curso' | 'outro';
export type AreaEnem = 'linguagens' | 'humanas' | 'natureza' | 'matematica';

export const AREA_ENEM_LABELS: Record<AreaEnem, string> = {
  linguagens: 'Linguagens e Códigos',
  humanas: 'Ciências Humanas',
  natureza: 'Ciências da Natureza',
  matematica: 'Matemática',
};

// Ordem oficial de exibição (bate com a ordem dos dias do ENEM)
export const ORDEM_AREAS_ENEM: AreaEnem[] = ['linguagens', 'humanas', 'natureza', 'matematica'];

export interface Materia {
  uuid: string;
  user_id: string;
  nome: string;
  tipo: TipoMateria;
  cor: string | null;
  // Matéria é uma linha única, compartilhada entre Escola e ENEM — estas
  // duas flags controlam em qual(is) tela(s) ela aparece. Não são
  // mutuamente exclusivas: uma matéria pode aparecer nas duas.
  mostra_escola: boolean;
  mostra_enem: boolean;
  // Área do ENEM — só significativa quando mostra_enem = true.
  area_enem: AreaEnem | null;
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

/** Matérias visíveis na tela Escola (tipo acadêmica + mostra_escola). */
export async function listarMateriasEscola(): Promise<Materia[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materias')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('tipo', 'academica')
    .eq('mostra_escola', true)
    .order('nome');

  if (error) return sbErr(error, 'listarMateriasEscola');
  return data;
}

/** Todas as matérias visíveis no ENEM (tipo acadêmica + mostra_enem), qualquer área. */
export async function listarTodasMateriasEnem(): Promise<Materia[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materias')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('tipo', 'academica')
    .eq('mostra_enem', true)
    .order('nome');

  if (error) return sbErr(error, 'listarTodasMateriasEnem');
  return data;
}

/** Matérias de uma área específica do ENEM. */
export async function listarMateriasPorAreaEnem(area: AreaEnem): Promise<Materia[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materias')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .eq('tipo', 'academica')
    .eq('mostra_enem', true)
    .eq('area_enem', area)
    .order('nome');

  if (error) return sbErr(error, 'listarMateriasPorAreaEnem');
  return data;
}

export async function buscarMateria(uuid: string): Promise<Materia | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materias')
    .select('*')
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .single();

  if (error) return sbErr(error, 'buscarMateria');
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

export async function deletarMateria(uuid: string): Promise<boolean> {
  return softDelete('materias', uuid);
}

// ============================================================================
// Seed — matérias fixas (Escola + ENEM), UMA linha por matéria
// ============================================================================
// Mesmo padrão de seedModulosSeNecessario() do Treino (DEC-022): roda uma vez
// no primeiro carregamento (chamado no Hub de Estudos), popula só o que
// ainda não existe (checa por nome, seguro rodar várias vezes).
//
// Modelo corrigido (2026-08): matéria é ÚNICA — mostra_escola/mostra_enem
// decidem onde ela aparece. Nada de duas linhas pra mesma matéria.

interface SeedMateria {
  nome: string;
  mostra_escola: boolean;
  mostra_enem: boolean;
  area_enem: AreaEnem | null;
}

const MATERIAS_ESCOLA_ONLY: SeedMateria[] = [
  { nome: 'Web', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Engenharia de Software', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Letramento Linguístico', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Java', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'PTS', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Lógica Matemática', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Eletiva', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Mobile', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'Estudos Orientados', mostra_escola: true, mostra_enem: false, area_enem: null },
  { nome: 'AO', mostra_escola: true, mostra_enem: false, area_enem: null },
];

// Matérias que aparecem nos dois contextos — UMA linha, duas flags true
const MATERIAS_COMPARTILHADAS: SeedMateria[] = [
  { nome: 'Matemática', mostra_escola: true, mostra_enem: true, area_enem: 'matematica' },
  { nome: 'Inglês', mostra_escola: true, mostra_enem: true, area_enem: 'linguagens' },
  { nome: 'Português', mostra_escola: true, mostra_enem: true, area_enem: 'linguagens' },
  { nome: 'Artes', mostra_escola: true, mostra_enem: true, area_enem: 'linguagens' },
  { nome: 'Educação Física', mostra_escola: true, mostra_enem: true, area_enem: 'linguagens' },
  { nome: 'História', mostra_escola: true, mostra_enem: true, area_enem: 'humanas' },
  { nome: 'Geografia', mostra_escola: true, mostra_enem: true, area_enem: 'humanas' },
  { nome: 'Sociologia', mostra_escola: true, mostra_enem: true, area_enem: 'humanas' },
  { nome: 'Química', mostra_escola: true, mostra_enem: true, area_enem: 'natureza' },
  { nome: 'Biologia', mostra_escola: true, mostra_enem: true, area_enem: 'natureza' },
  { nome: 'Física', mostra_escola: true, mostra_enem: true, area_enem: 'natureza' },
];

// Só existe no ENEM (sem uso na Escola, conforme lista fornecida)
const MATERIAS_ENEM_ONLY: SeedMateria[] = [
  { nome: 'Filosofia', mostra_escola: false, mostra_enem: true, area_enem: 'humanas' },
];

const TODAS_SEED: SeedMateria[] = [
  ...MATERIAS_ESCOLA_ONLY,
  ...MATERIAS_COMPARTILHADAS,
  ...MATERIAS_ENEM_ONLY,
];

function materiaInputPadrao(s: SeedMateria): MateriaInput {
  return {
    nome: s.nome,
    tipo: 'academica',
    cor: null,
    mostra_escola: s.mostra_escola,
    mostra_enem: s.mostra_enem,
    area_enem: s.area_enem,
    plataforma: null,
    carga_horaria_total_horas: null,
    horas_dedicadas: 0,
    certificado_path: null,
    concluido: false,
    data_conclusao: null,
  };
}

export async function seedMateriasEnemEscolaSeNecessario(): Promise<void> {
  const existentes = await listarMaterias('academica');
  if (existentes === null) return; // sem sessão ou erro — não tenta seed

  const nomesExistentes = new Set(existentes.map((m) => m.nome));
  const paraCriar = TODAS_SEED.filter((s) => !nomesExistentes.has(s.nome));

  if (paraCriar.length === 0) return;

  for (const s of paraCriar) {
    await criarMateria(materiaInputPadrao(s));
  }
}
