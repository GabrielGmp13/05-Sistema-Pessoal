import { sb, getUserId, sbErr, softDelete } from './supabase';

export interface Conteudo {
  uuid: string;
  user_id: string;
  nome: string;
  // "Domínio" não é mais um número solto — é calculado a partir de dois
  // sinais: dominado_manual (você decide que já domina) OU
  // revisao_espacada.repeticoes >= 5 (o SM-2 já conta repetições
  // bem-sucedidas, ver lib/revisao.ts). Sem coluna de contagem redundante.
  teoria_vista: boolean; // primeiro contato (aula/leitura), separado de revisão
  dominado_manual: boolean;
  revisao_uuid: string | null;
  modulo_curso_uuid: string | null; // só usado quando o conteúdo é aula de curso
  video_uuid: string | null;
  video?: {
    uuid: string;
    titulo: string;
    url: string;
    youtube_id: string | null;
    capa_url: string | null;
  } | null;
  updated_at: string;
  deleted: boolean;
}

export type ConteudoInput = Omit<Conteudo, 'uuid' | 'user_id' | 'updated_at' | 'deleted' | 'video' | 'video_uuid'> & {
  video_uuid?: string | null;
};
export type ConteudoUpdate = Partial<ConteudoInput>;

/** Cria um conteúdo já vinculado a 1+ matérias (via conteudos_materias). */
export async function criarConteudo(
  input: ConteudoInput,
  materiaUuids: string[]
): Promise<Conteudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const uuid = crypto.randomUUID();
  const { data, error } = await sb
    .from('conteudos')
    .insert({ ...input, uuid, user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarConteudo');

  const vinculos = materiaUuids.map((materia_uuid) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    conteudo_uuid: uuid,
    materia_uuid,
  }));

  const { error: errVinculo } = await sb.from('conteudos_materias').insert(vinculos);
  if (errVinculo) return sbErr(errVinculo, 'criarConteudo:vinculos');

  return data;
}

/** Lista conteúdos vinculados a uma matéria específica (join via conteudos_materias). */
export async function listarConteudosPorMateria(materiaUuid: string): Promise<Conteudo[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('conteudos_materias')
    .select('conteudos(*)')
    .eq('user_id', userId)
    .eq('materia_uuid', materiaUuid)
    .eq('deleted', false);

  if (error) return sbErr(error, 'listarConteudosPorMateria');
  return (data ?? []).map((row: any) => row.conteudos).filter((c: any) => c && !c.deleted);
}

/** Lista conteúdos de um módulo de curso específico. */
export async function listarConteudosPorModuloCurso(moduloCursoUuid: string): Promise<Conteudo[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('conteudos')
    .select('*, video:videos(uuid, titulo, url, youtube_id, capa_url)')
    .eq('user_id', userId)
    .eq('modulo_curso_uuid', moduloCursoUuid)
    .eq('deleted', false)
    .order('nome');

  if (error) return sbErr(error, 'listarConteudosPorModuloCurso');
  return data;
}

/** Evita criar duas aulas para o mesmo vídeo dentro do mesmo curso. */
export async function buscarConteudoDeVideoNoCurso(
  videoUuid: string,
  materiaUuid: string
): Promise<Conteudo | null | undefined> {
  const conteudos = await listarConteudosPorMateria(materiaUuid);
  if (conteudos === null) return undefined;
  return conteudos.find((conteudo) => conteudo.video_uuid === videoUuid) ?? null;
}

export async function atualizarConteudo(uuid: string, update: ConteudoUpdate): Promise<Conteudo | null> {
  const { data, error } = await sb
    .from('conteudos')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, 'atualizarConteudo');
  return data;
}

/** Adiciona um vínculo extra (ex: conteúdo que já existia no ENEM passa a valer pra Escola também). */
export async function vincularConteudoAMateria(
  conteudoUuid: string,
  materiaUuid: string
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await sb.from('conteudos_materias').insert({
    uuid: crypto.randomUUID(),
    user_id: userId,
    conteudo_uuid: conteudoUuid,
    materia_uuid: materiaUuid,
  });

  if (error) { sbErr(error, 'vincularConteudoAMateria'); return false; }
  return true;
}

export async function deletarConteudo(uuid: string): Promise<boolean> {
  return softDelete('conteudos', uuid);
}
