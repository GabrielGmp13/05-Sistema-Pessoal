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

export interface ResumoTempoEstudo {
  hojeMinutos: number;
  semanaMinutos: number;
  mesMinutos: number;
}

function inicioDoDia(data: Date): Date {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

/** Agrega as sessoes atuais no fuso local do dispositivo, sem buscar o historico inteiro. */
export async function buscarResumoTempoEstudo(): Promise<ResumoTempoEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const agora = new Date();
  const inicioHoje = inicioDoDia(agora);
  const inicioSemana = inicioDoDia(agora);
  const diasDesdeSegunda = (inicioSemana.getDay() + 6) % 7;
  inicioSemana.setDate(inicioSemana.getDate() - diasDesdeSegunda);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioConsulta = new Date(
    Math.min(inicioHoje.getTime(), inicioSemana.getTime(), inicioMes.getTime()),
  );

  const { data, error } = await sb
    .from('sessoes_estudo')
    .select('inicio, duracao_minutos')
    .eq('user_id', userId)
    .eq('deleted', false)
    .gte('inicio', inicioConsulta.toISOString())
    .lte('inicio', agora.toISOString());

  if (error) return sbErr(error, 'buscarResumoTempoEstudo');

  return (data ?? []).reduce<ResumoTempoEstudo>(
    (resumo, sessao) => {
      const inicio = new Date(sessao.inicio).getTime();
      const duracao = sessao.duracao_minutos ?? 0;

      if (inicio >= inicioHoje.getTime()) resumo.hojeMinutos += duracao;
      if (inicio >= inicioSemana.getTime()) resumo.semanaMinutos += duracao;
      if (inicio >= inicioMes.getTime()) resumo.mesMinutos += duracao;
      return resumo;
    },
    { hojeMinutos: 0, semanaMinutos: 0, mesMinutos: 0 },
  );
}

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
