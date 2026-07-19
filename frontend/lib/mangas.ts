import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Schema: 003_biblioteca.sql + 006_biblioteca_v2_base.sql + 011_biblioteca_v2_b4_mangas.sql
export type StatusManga = 'quero_ler' | 'lendo' | 'lido' | 'pausado' | 'abandonado';
export type StatusPublicacao = 'em_andamento' | 'concluida' | 'hiato' | 'cancelada';

export interface Manga {
  uuid: string;
  user_id: string;
  titulo: string;
  titulo_traduzido: string | null;
  autor: string | null;
  mal_id: string | null;
  capa_url: string | null;
  capa_path: string | null;
  capitulo_atual: number;
  status: StatusManga;
  nota: number | null;
  comentario: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  // campos comuns — DEC-023
  favorito: boolean;
  vezes_consumido: number | null;
  onde_consumi: string | null;
  valor_pago: number | null;
  banner_url: string | null;
  banner_path: string | null;
  link_mal: string | null;
  link_anilist: string | null;
  link_oficial: string | null;
  // publicação — B4 (011)
  editora: string | null;
  status_publicacao: StatusPublicacao;
  ano_inicio_publicacao: number | null;
  ano_fim_publicacao: number | null;
  updated_at: string;
  deleted: boolean;
}

export type MangaInput = Partial<
  Omit<Manga, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { titulo: string };

export async function listarMangas(): Promise<Manga[] | null> {
  const { data, error } = await sb
    .from('mangas')
    .select('*')
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, 'listarMangas');
    return null;
  }
  return data as Manga[];
}

export async function criarManga(dados: MangaInput): Promise<Manga | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarManga');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ler' as StatusManga,
    status_publicacao: 'em_andamento' as StatusPublicacao,
    favorito: false,
    capitulo_atual: 0,
    ...dados,
  };

  const { data, error } = await sb.from('mangas').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarManga');
    return null;
  }
  return data as Manga;
}

export async function atualizarManga(uuid: string, dados: MangaInput): Promise<Manga | null> {
  const { data, error } = await sb
    .from('mangas')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarManga(${uuid})`);
    return null;
  }
  return data as Manga;
}

export async function apagarManga(uuid: string): Promise<boolean> {
  const { error } = await softDelete('mangas', uuid);
  return !error;
}