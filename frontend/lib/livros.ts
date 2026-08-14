import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Schema: 003_biblioteca.sql + 006_biblioteca_v2_base.sql + 012_biblioteca_v2_b5_livros.sql
export type StatusLivro = 'quero_ler' | 'lendo' | 'lido' | 'pausado' | 'abandonado';
export type FormatoLivro = 'fisico' | 'ebook' | 'audiobook';

export interface Livro {
  uuid: string;
  user_id: string;
  titulo: string;
  autor: string | null;
  isbn: string | null;
  google_books_id: string | null;
  capa_url: string | null;
  capa_path: string | null;
  paginas_total: number | null;
  pagina_atual: number;
  status: StatusLivro;
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
  duracao_minutos: number | null;
  link_oficial: string | null;
  // bibliográficos/leitura — B5 (012)
  editora: string | null;
  idioma: string | null;
  formato: FormatoLivro;
  ano_publicacao: number | null;
  updated_at: string;
  deleted: boolean;
}

export type LivroInput = Partial<
  Omit<Livro, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { titulo: string };

export async function listarLivros(): Promise<Livro[] | null> {
  const { data, error } = await sb
    .from('livros')
    .select('*')
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, 'listarLivros');
    return null;
  }
  return data as Livro[];
}

export async function criarLivro(dados: LivroInput): Promise<Livro | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarLivro');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ler' as StatusLivro,
    formato: 'fisico' as FormatoLivro,
    favorito: false,
    pagina_atual: 0,
    ...dados,
  };

  const { data, error } = await sb.from('livros').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarLivro');
    return null;
  }
  return data as Livro;
}

export async function atualizarLivro(uuid: string, dados: LivroInput): Promise<Livro | null> {
  const { data, error } = await sb
    .from('livros')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarLivro(${uuid})`);
    return null;
  }
  return data as Livro;
}

export async function apagarLivro(uuid: string): Promise<boolean> {
  return await softDelete('livros', uuid);
}
