import { sb, getUserId, sbErr } from './supabase';
import { avaliarCard } from './revisao'; // já existe, integração SM-2 — ver ARCHITECTURE.md

export interface Simulado {
  uuid: string;
  user_id: string;
  materia_uuid: string | null;
  data: string;
  total_questoes: number;
  total_acertos: number;
  tempo_minutos: number | null;
  observacoes: string | null;
  conteudo_uuid: string | null;
  redacao_uuid: string | null;
  arquivo_path: string | null;
  updated_at: string;
  deleted: boolean;
}

export type SimuladoInput = Omit<Simulado, 'uuid' | 'user_id' | 'arquivo_path' | 'updated_at' | 'deleted'> & { arquivo_path?: string | null };

/**
 * Registra um simulado. Se `conteudo_uuid` estiver preenchido, dispara o
 * cálculo de SM-2 daquele conteúdo (regra de negócio DEC-036) — a
 * "qualidade" enviada ao SM-2 é derivada do % de acerto:
 * 0-40% -> 0-1 | 40-60% -> 2 | 60-80% -> 3-4 | 80-100% -> 5
 */
export async function registrarSimulado(input: SimuladoInput): Promise<Simulado | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('simulados')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'registrarSimulado');

  if (data && data.conteudo_uuid) {
    const percentual = data.total_questoes > 0 ? data.total_acertos / data.total_questoes : 0;
    const qualidade = percentualParaQualidadeSM2(percentual);

    // busca (ou cria, se ainda não existir) o card de revisão do conteúdo
    const { data: conteudo } = await sb
      .from('conteudos')
      .select('revisao_uuid, nome')
      .eq('uuid', data.conteudo_uuid)
      .single();

    if (conteudo?.revisao_uuid) {
      await avaliarCard(conteudo.revisao_uuid, qualidade);
    }
  }

  return data;
}

function percentualParaQualidadeSM2(percentual: number): number {
  if (percentual < 0.4) return percentual < 0.2 ? 0 : 1;
  if (percentual < 0.6) return 2;
  if (percentual < 0.8) return percentual < 0.7 ? 3 : 4;
  return 5;
}

export async function listarSimuladosPorMateria(materiaUuid: string): Promise<Simulado[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('simulados')
    .select('*')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false)
    .order('data', { ascending: false });

  if (error) return sbErr(error, 'listarSimuladosPorMateria');
  return data;
}

export async function listarUltimosSimulados(limite = 5): Promise<Simulado[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('simulados')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('data', { ascending: false })
    .limit(limite);

  if (error) return sbErr(error, 'listarUltimosSimulados');
  return data;
}

export async function atualizarArquivoSimulado(uuid: string, arquivoPath: string): Promise<Simulado | null> {
  const { data, error } = await sb
    .from('simulados')
    .update({ arquivo_path: arquivoPath, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();
  if (error) return sbErr(error, 'atualizarArquivoSimulado');
  return data;
}
