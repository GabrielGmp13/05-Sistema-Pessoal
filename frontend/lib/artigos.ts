import { getUserId, now, sb, sbErr, softDelete } from './supabase';

export interface Artigo {
  uuid: string;
  user_id: string;
  titulo: string;
  url: string;
  autor: string | null;
  site_origem: string | null;
  capa_url: string | null;
  capa_path: string | null;
  data_leitura: string | null;
  tempo_leitura_minutos: number | null;
  favorito: boolean;
  comentario: string | null;
  updated_at: string;
  deleted: boolean;
}

export type ArtigoInput = Partial<Omit<Artigo, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>> & {
  titulo: string;
  url: string;
};

export async function listarArtigos(): Promise<Artigo[] | null> {
  const { data, error } = await sb
    .from('artigos')
    .select('*')
    .eq('deleted', false)
    .order('titulo');

  if (error) return sbErr(error, 'listarArtigos');
  return data as Artigo[];
}

export async function criarArtigo(dados: ArtigoInput): Promise<Artigo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('artigos')
    .insert({
      ...dados,
      uuid: crypto.randomUUID(),
      user_id: userId,
      favorito: dados.favorito ?? false,
    })
    .select()
    .single();

  if (error) return sbErr(error, 'criarArtigo');
  return data as Artigo;
}

export async function atualizarArtigo(uuid: string, dados: ArtigoInput): Promise<Artigo | null> {
  const { data, error } = await sb
    .from('artigos')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, `atualizarArtigo(${uuid})`);
  return data as Artigo;
}

export async function apagarArtigo(uuid: string): Promise<boolean> {
  return softDelete('artigos', uuid);
}
