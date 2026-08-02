import { sb, getUserId, sbErr } from './supabase';

export type Letra = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestaoIndividual {
  uuid: string;
  user_id: string;
  materia_uuid: string;
  conteudo_uuid: string | null;
  // NULL = ainda não corrigida (gabarito recém-lançado) OU questão perdida
  // (ficou em branco no fim do tempo — nem certo nem errado). Ver
  // `letra_correta` pra distinguir os dois casos: `letra_correta === null`
  // → ainda não corrigida; `letra_correta` preenchida + `acertou === null`
  // → perdida de verdade (não respondida a tempo).
  acertou: boolean | null;
  data: string;
  prova_uuid: string | null;
  numero: number | null;
  motivo_erro: string | null;
  // Letra marcada durante a prova (fase "lançar"). NULL = ficou em branco.
  letra_marcada: Letra | null;
  // Letra correta, preenchida na fase "corrigir". NULL = correção pendente.
  letra_correta: Letra | null;
  updated_at: string;
  deleted: boolean;
}

export type QuestaoInput = Omit<QuestaoIndividual, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;

/** Registra 1 questão avulsa (fora de gabarito de prova) — fluxo antigo, sem fase de correção separada: já entra com acertou definido. */
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

// ============================================================================
// Gabarito ENEM — Fase 1: LANÇAR (durante ou logo após a prova)
// ============================================================================
// Registra em lote as respostas de uma área (até 45 questões). Cada questão
// já escolhe sua matéria (dentro da área) e a letra marcada — sem noção de
// acerto/erro ainda, isso só existe depois da correção.

export interface RespostaLancamento {
  numero: number; // posição dentro do dia (1-90)
  materia_uuid: string;
  letra_marcada: Letra | null; // null = ficou em branco
}

export async function lancarRespostasGabarito(
  provaUuid: string,
  data: string,
  respostas: RespostaLancamento[]
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const linhas = respostas.map((r) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    materia_uuid: r.materia_uuid,
    conteudo_uuid: null,
    acertou: null,
    data,
    prova_uuid: provaUuid,
    numero: r.numero,
    motivo_erro: null,
    letra_marcada: r.letra_marcada,
    letra_correta: null,
  }));

  const { error } = await sb.from('questoes_individuais').insert(linhas);
  if (error) { sbErr(error, 'lancarRespostasGabarito'); return false; }
  return true;
}

// ============================================================================
// Gabarito ENEM — Fase 2: CORRIGIR (depois, com calma)
// ============================================================================
// Preenche a letra_correta de uma questão já lançada. `acertou` é derivado
// automaticamente: letra_marcada null → permanece null (perdida); senão,
// compara letra_marcada com letra_correta.

export interface CorrecaoQuestao {
  letra_correta: Letra;
  conteudo_uuid?: string; // só faz sentido preencher quando a questão foi errada
  motivo_erro?: string;
}

export async function corrigirQuestaoGabarito(
  uuid: string,
  correcao: CorrecaoQuestao
): Promise<QuestaoIndividual | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data: questao, error: erroBusca } = await sb
    .from('questoes_individuais')
    .select('*')
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .single();

  if (erroBusca || !questao) return sbErr(erroBusca, 'corrigirQuestaoGabarito');

  const acertou: boolean | null =
    questao.letra_marcada === null ? null : questao.letra_marcada === correcao.letra_correta;

  const { data, error } = await sb
    .from('questoes_individuais')
    .update({
      letra_correta: correcao.letra_correta,
      acertou,
      conteudo_uuid: acertou === false ? (correcao.conteudo_uuid ?? null) : null,
      motivo_erro: acertou === false ? (correcao.motivo_erro ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return sbErr(error, 'corrigirQuestaoGabarito');
  return data;
}

/** Corrige várias questões de uma vez (mesma lógica de corrigirQuestaoGabarito, em lote). */
export async function corrigirGabaritoEmLote(
  correcoes: { uuid: string; letra_marcada: Letra | null; correcao: CorrecaoQuestao }[]
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  let algumErro = false;

  for (const { uuid, letra_marcada, correcao } of correcoes) {
    const acertou: boolean | null =
      letra_marcada === null ? null : letra_marcada === correcao.letra_correta;

    const { error } = await sb
      .from('questoes_individuais')
      .update({
        letra_correta: correcao.letra_correta,
        acertou,
        conteudo_uuid: acertou === false ? (correcao.conteudo_uuid ?? null) : null,
        motivo_erro: acertou === false ? (correcao.motivo_erro ?? null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', uuid)
      .eq('user_id', userId);

    if (error) { sbErr(error, 'corrigirGabaritoEmLote'); algumErro = true; }
  }

  return !algumErro;
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

/**
 * Taxa de acerto recente (últimos N dias), geral ou por matéria — usa no
 * dashboard. Ignora questões com acertou = NULL (correção pendente ou
 * perdida) tanto no numerador quanto no denominador.
 */
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
    .not('acertou', 'is', null)
    .gte('data', desde.toISOString().slice(0, 10));

  if (materiaUuid) query = query.eq('materia_uuid', materiaUuid);

  const { data, error } = await query;
  if (error) return sbErr(error, 'taxaDeAcertoRecente');
  if (!data || data.length === 0) return null;

  const acertos = data.filter((q) => q.acertou).length;
  return Math.round((acertos / data.length) * 1000) / 10; // 1 casa decimal
}