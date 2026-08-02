import { sb, getUserId, sbErr, softDelete } from './supabase';

export interface Redacao {
  uuid: string;
  user_id: string;
  tema: string;
  texto: string | null; // opcional agora — pode registrar só a foto
  nota: number | null;
  comentario: string | null; // observação / correção do professor
  data: string;
  competencia_1: number | null;
  competencia_2: number | null;
  competencia_3: number | null;
  competencia_4: number | null;
  competencia_5: number | null;
  imagem_path: string | null; // path no bucket 'redacoes', formato {user_id}/arquivo.ext
  updated_at: string;
  deleted: boolean;
}

export type RedacaoInput = Omit<Redacao, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>;
export type RedacaoUpdate = Partial<RedacaoInput>;

const BUCKET_REDACOES = 'redacoes';

export async function listarRedacoes(): Promise<Redacao[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('redacoes')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('data', { ascending: false });

  if (error) return sbErr(error, 'listarRedacoes');
  return data;
}

export async function criarRedacao(input: RedacaoInput): Promise<Redacao | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('redacoes')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarRedacao');
  return data;
}

export async function atualizarRedacao(uuid: string, update: RedacaoUpdate): Promise<Redacao | null> {
  const { data, error } = await sb
    .from('redacoes')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, 'atualizarRedacao');
  return data;
}

/** Soma as 5 competências — útil quando o usuário preenche por competência em vez de nota geral direto. */
export function somaCompetencias(r: Pick<Redacao, 'competencia_1' | 'competencia_2' | 'competencia_3' | 'competencia_4' | 'competencia_5'>): number | null {
  const valores = [r.competencia_1, r.competencia_2, r.competencia_3, r.competencia_4, r.competencia_5];
  if (valores.some((v) => v === null || v === undefined)) return null;
  return valores.reduce((acc, v) => acc! + v!, 0);
}

export async function deletarRedacao(uuid: string): Promise<boolean> {
  return softDelete('redacoes', uuid);
}

// ============================================================================
// Imagem da redação (foto da folha manuscrita) — bucket 'redacoes', privado.
//
// NOTA TÉCNICA: usa a API do supabase-js diretamente (sb.storage.from(...))
// em vez de um wrapper do projeto, porque lib/supabase.ts não foi fornecido
// nesta leva — se o projeto já tem uploadFile()/getSignedUrl()/deleteFile()
// (mencionados em ARCHITECTURE.md), troque estas 3 funções por chamadas a
// eles para manter consistência com os outros buckets (shape, documentos,
// capas, exercicios). Mesma convenção de path: {user_id}/arquivo.ext.
// ============================================================================

/** Faz upload da foto da redação e já salva o path na linha (atualiza imagem_path). */
export async function uploadImagemRedacao(uuid: string, file: File): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const extensao = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${uuid}.${extensao}`;

  const { error: erroUpload } = await sb.storage
    .from(BUCKET_REDACOES)
    .upload(path, file, { upsert: true });

  if (erroUpload) { sbErr(erroUpload, 'uploadImagemRedacao'); return null; }

  const atualizado = await atualizarRedacao(uuid, { imagem_path: path });
  if (!atualizado) return null;

  return path;
}

/** Gera uma signed URL (1h) pra exibir a imagem — bucket é privado, nunca getPublicUrl. */
export async function getUrlImagemRedacao(path: string): Promise<string | null> {
  const { data, error } = await sb.storage
    .from(BUCKET_REDACOES)
    .createSignedUrl(path, 3600);

  if (error) { sbErr(error, 'getUrlImagemRedacao'); return null; }
  return data?.signedUrl ?? null;
}

/** Remove a imagem do storage e limpa imagem_path na linha. */
export async function removerImagemRedacao(uuid: string, path: string): Promise<boolean> {
  const { error: erroRemocao } = await sb.storage.from(BUCKET_REDACOES).remove([path]);
  if (erroRemocao) { sbErr(erroRemocao, 'removerImagemRedacao'); return false; }

  const atualizado = await atualizarRedacao(uuid, { imagem_path: null });
  return !!atualizado;
}