import { sb, getUserId, sbErr } from './supabase';

export type TipoMateria = 'enem' | 'escola' | 'olimpiada' | 'concurso' | 'curso' | 'outro';
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
  // Área do ENEM — nullable, só usada quando tipo === 'enem'.
  // Ver migration 017_estudos_gabarito_enem_redacao.sql
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

// ============================================================================
// Seed — matérias fixas de Escola e ENEM
// ============================================================================
// Mesmo padrão de seedModulosSeNecessario() do Treino (DEC-022): roda uma vez
// no primeiro carregamento (chamado no Hub de Estudos), popula só o que
// ainda não existe (checa por nome+tipo, seguro rodar várias vezes).
//
// Modelo confirmado com o usuário (2026-08): matérias que existem em Escola
// E ENEM viram DUAS linhas separadas (uma por tipo). Área é campo da matéria
// ENEM (area_enem); matéria de Escola nunca tem area_enem preenchida.
//
// Exceção conhecida: Filosofia só existe no ENEM (sem par na Escola).

interface SeedMateria {
  nome: string;
  tipo: TipoMateria;
  area_enem: AreaEnem | null;
}

const MATERIAS_ESCOLA_ONLY: SeedMateria[] = [
  { nome: 'Web', tipo: 'escola', area_enem: null },
  { nome: 'Engenharia de Software', tipo: 'escola', area_enem: null },
  { nome: 'Letramento Linguístico', tipo: 'escola', area_enem: null },
  { nome: 'Java', tipo: 'escola', area_enem: null },
  { nome: 'PTS', tipo: 'escola', area_enem: null },
  { nome: 'Lógica Matemática', tipo: 'escola', area_enem: null },
  { nome: 'Eletiva', tipo: 'escola', area_enem: null },
  { nome: 'Mobile', tipo: 'escola', area_enem: null },
  { nome: 'Estudos Orientados', tipo: 'escola', area_enem: null },
  { nome: 'AO', tipo: 'escola', area_enem: null },
];

// Matérias que existem nos dois módulos — cada uma gera 2 linhas (escola + enem)
const MATERIAS_COMPARTILHADAS: { nome: string; area_enem: AreaEnem }[] = [
  { nome: 'Matemática', area_enem: 'matematica' },
  { nome: 'Inglês', area_enem: 'linguagens' },
  { nome: 'Português', area_enem: 'linguagens' },
  { nome: 'Artes', area_enem: 'linguagens' },
  { nome: 'Educação Física', area_enem: 'linguagens' },
  { nome: 'História', area_enem: 'humanas' },
  { nome: 'Geografia', area_enem: 'humanas' },
  { nome: 'Sociologia', area_enem: 'humanas' },
  { nome: 'Química', area_enem: 'natureza' },
  { nome: 'Biologia', area_enem: 'natureza' },
  { nome: 'Física', area_enem: 'natureza' },
];

// Só existe no ENEM (sem par na Escola)
const MATERIAS_ENEM_ONLY: SeedMateria[] = [
  { nome: 'Filosofia', tipo: 'enem', area_enem: 'humanas' },
];

function materiaInputPadrao(nome: string, tipo: TipoMateria, area_enem: AreaEnem | null): MateriaInput {
  return {
    nome,
    tipo,
    cor: null,
    area_enem,
    plataforma: null,
    carga_horaria_total_horas: null,
    horas_dedicadas: 0,
    certificado_path: null,
    concluido: false,
    data_conclusao: null,
  };
}

export async function seedMateriasEnemEscolaSeNecessario(): Promise<void> {
  const existentes = await listarMaterias();
  if (existentes === null) return; // sem sessão ou erro — não tenta seed

  const existe = (nome: string, tipo: TipoMateria) =>
    existentes.some((m) => m.nome === nome && m.tipo === tipo);

  const paraCriar: MateriaInput[] = [];

  for (const m of MATERIAS_ESCOLA_ONLY) {
    if (!existe(m.nome, m.tipo)) paraCriar.push(materiaInputPadrao(m.nome, m.tipo, m.area_enem));
  }

  for (const m of MATERIAS_ENEM_ONLY) {
    if (!existe(m.nome, m.tipo)) paraCriar.push(materiaInputPadrao(m.nome, m.tipo, m.area_enem));
  }

  for (const m of MATERIAS_COMPARTILHADAS) {
    if (!existe(m.nome, 'escola')) {
      paraCriar.push(materiaInputPadrao(m.nome, 'escola', null));
    }
    if (!existe(m.nome, 'enem')) {
      paraCriar.push(materiaInputPadrao(m.nome, 'enem', m.area_enem));
    }
  }

  if (paraCriar.length === 0) return;

  for (const input of paraCriar) {
    await criarMateria(input);
  }
}