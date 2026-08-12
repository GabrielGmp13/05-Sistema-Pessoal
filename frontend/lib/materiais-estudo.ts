import { deleteFile, getSignedUrl, getUserId, sb, sbErr, softDelete, uploadFile } from './supabase';

export type TipoMaterialEstudo = 'link' | 'pdf' | 'video' | 'livro' | 'outro';

export interface MaterialEstudo {
  uuid: string;
  user_id: string;
  conteudo_uuid: string;
  tipo: TipoMaterialEstudo;
  titulo: string;
  url: string | null;
  arquivo_path: string | null;
  updated_at: string;
  deleted: boolean;
}

export type MaterialEstudoInput = Omit<
  MaterialEstudo,
  'uuid' | 'user_id' | 'updated_at' | 'deleted'
>;

export async function listarMateriaisPorConteudos(
  conteudoUuids: string[],
): Promise<MaterialEstudo[] | null> {
  if (conteudoUuids.length === 0) return [];

  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materiais_estudo')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('conteudo_uuid', conteudoUuids)
    .order('updated_at', { ascending: false });

  if (error) return sbErr(error, 'listarMateriaisPorConteudos');
  return data;
}

export async function criarMaterialEstudo(
  input: MaterialEstudoInput,
): Promise<MaterialEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('materiais_estudo')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId })
    .select()
    .single();

  if (error) return sbErr(error, 'criarMaterialEstudo');
  return data;
}

const BUCKET_DOCUMENTOS = 'documentos';

function nomeArquivoSeguro(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'documento';
}

export async function criarMaterialComArquivo(input: {
  conteudo_uuid: string;
  tipo: TipoMaterialEstudo;
  titulo: string;
  file: File;
}): Promise<MaterialEstudo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const path = `${userId}/materiais/${crypto.randomUUID()}-${nomeArquivoSeguro(input.file.name)}`;
  const arquivoPath = await uploadFile(BUCKET_DOCUMENTOS, path, input.file);
  if (!arquivoPath) return null;

  const material = await criarMaterialEstudo({
    conteudo_uuid: input.conteudo_uuid,
    tipo: input.tipo,
    titulo: input.titulo,
    url: null,
    arquivo_path: arquivoPath,
  });

  if (!material) {
    await deleteFile(BUCKET_DOCUMENTOS, arquivoPath);
    return null;
  }

  return material;
}

export async function getUrlArquivoMaterial(path: string): Promise<string | null> {
  return getSignedUrl(BUCKET_DOCUMENTOS, path);
}

export async function deletarMaterialEstudo(uuid: string): Promise<boolean> {
  return softDelete('materiais_estudo', uuid);
}
