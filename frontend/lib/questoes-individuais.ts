import { sb, getUserId, sbErr } from './supabase';

export interface QuestaoIndividual {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  conteudo_uuid: string | null;
  acertou: boolean;
  data: string;
  prova_uuid: string | null;
  numero: number | null;
  motivo_erro: string | null;
  updated_at: string;
  deleted: boolean;
}

export type QuestaoInput = Omit<QuestaoIndividual, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;

/** Registra 1 questão avulsa (fora de gabarito de prova). */
export async function registrarQuestao(input: QuestaoInput): Promise<QuestaoIndividual | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('questoes_individuais')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'registrarQuestao');
  return data;
}

/**
 * Gabarito digital de uma prova: registra em lote as N questões de uma área
 * (ex: 45 questões de Matemática no dia 2 do ENEM). `respostas` é um array
 * já na ordem 1..N com se acertou e, se errou, conteúdo + motivo.
 */
export async function registrarGabaritoProva(
  provaUuid: string,
  materiaUuid: string,
  data: string,
  respostas: { numero: number; acertou: boolean; conteudo_uuid?: string; motivo_erro?: string }[]
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const linhas = respostas.map((r) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    materia_uuid: materiaUuid,
    conteudo_uuid: r.conteudo_uuid ?? null,
    acertou: r.acertou,
    data,
    prova_uuid: provaUuid,
    numero: r.numero,
    motivo_erro: r.acertou ? null : (r.motivo_erro ?? null),
  }));

  const { error } = await sb.from('questoes_individuais').insert(linhas);
  if (error) { sbErr(error, 'registrarGabaritoProva'); return false; }
  return true;
}

/** Busca o gabarito completo de uma prova, ordenado por número. */
export async function buscarGabaritoProva(provaUuid: string): Promise<QuestaoIndividual[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('questoes_individuais')
    .select('*')
    .eq('user_id', userId)
    .eq('prova_uuid', provaUuid)
    .eq('deleted', false)
    .order('numero');

  if (error) return sbErr(error, 'buscarGabaritoProva');
  return data;
}

/** Taxa de acerto recente (últimos N dias), geral ou por matéria — usa no dashboard. */
export async function taxaDeAcertoRecente(dias = 30, materiaUuid?: string): Promise<number | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  let query = sb
    .from('questoes_individuais')
    .select('acertou')
    .eq('user_id', userId)
    .eq('deleted', false)
    .gte('data', desde.toISOString().slice(0, 10));

  if (materiaUuid) query = query.eq('materia_uuid', materiaUuid);

  const { data, error } = await query;
  if (error) return sbErr(error, 'taxaDeAcertoRecente');
  if (!data || data.length === 0) return null;

  const acertos = data.filter((q) => q.acertou).length;
  return Math.round((acertos / data.length) * 1000) / 10; // 1 casa decimal
}