import { sb, getUserId, sbErr, softDelete } from './supabase';

// livros_anotacoes — 012_biblioteca_v2_b5_livros.sql
export type TipoAnotacaoLivro = 'anotacao' | 'citacao';

export interface LivroAnotacao {
  uuid: string;
  user_id: string;
  livro_uuid: string;
  tipo: TipoAnotacaoLivro;
  pagina: number | null;
  texto: string;
  favorito: boolean;
  updated_at: string;
  deleted: boolean;
}

export type LivroAnotacaoInput = Partial<
  Omit<LivroAnotacao, 'uuid' | 'user_id' | 'livro_uuid' | 'updated_at' | 'deleted'>
> & { texto: string };

export async function listarAnotacoesLivro(livroUuid: string): Promise<LivroAnotacao[] | null> {
  const { data, error } = await sb
    .from('livros_anotacoes')
    .select('*')
    .eq('livro_uuid', livroUuid)
    .eq('deleted', false)
    .order('updated_at', { ascending: false });

  if (error) {
    sbErr(error, `listarAnotacoesLivro(${livroUuid})`);
    return null;
  }
  return data as LivroAnotacao[];
}

export async function criarAnotacaoLivro(
  livroUuid: string,
  dados: LivroAnotacaoInput
): Promise<LivroAnotacao | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarAnotacaoLivro');
    return null;
  }

  const nova = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    livro_uuid: livroUuid,
    tipo: 'anotacao' as TipoAnotacaoLivro,
    favorito: false,
    ...dados,
  };

  const { data, error } = await sb.from('livros_anotacoes').insert(nova).select().single();
  if (error) {
    sbErr(error, 'criarAnotacaoLivro');
    return null;
  }
  return data as LivroAnotacao;
}

export async function apagarAnotacaoLivro(uuid: string): Promise<boolean> {
  return await softDelete('livros_anotacoes', uuid);
}
