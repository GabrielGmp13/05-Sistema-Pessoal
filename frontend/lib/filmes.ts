import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Tipos alinhados ao schema real — ver DATABASE.md
// (003_biblioteca.sql + 006_biblioteca_v2_base.sql + 008_biblioteca_v2_b2.sql)
export type StatusFilme = 'quero_ver' | 'assistido' | 'abandonado';

export interface Filme {
  uuid: string;
  user_id: string;
  titulo: string;
  diretor: string | null;
  tmdb_id: string | null;
  capa_url: string | null;
  capa_path: string | null;
  status: StatusFilme;
  nota: number | null; // NUMERIC(2,1), 1-5 com meia estrela — DEC-023
  comentario: string | null;
  data_inicio: string | null; // DATE (YYYY-MM-DD)
  data_fim: string | null;
  // campos comuns — DEC-023
  favorito: boolean;
  vezes_consumido: number | null;
  onde_consumi: string | null;
  valor_pago: number | null;
  banner_url: string | null;
  banner_path: string | null;
  classificacao_indicativa: string | null;
  duracao_minutos: number | null;
  link_imdb: string | null;
  link_mal: string | null;
  link_anilist: string | null;
  link_oficial: string | null;
  // produção — DEC-024 (008), tecnologias removida — DEC-026 (010)
  roteirista: string | null;
  produtores: string | null;
  estudio: string | null;
  distribuidora: string | null;
  orcamento: number | null;
  bilheteria: number | null;
  ano_lancamento: number | null;
  // complementos de anime — DEC-025 (009), nulos por padrão fora do fluxo de Animes
  anime_uuid: string | null;
  tipo_complemento: string | null;
  updated_at: string;
  deleted: boolean;
}

// Campos que o formulário de criação/edição pode enviar.
export type FilmeInput = Partial<
  Omit<Filme, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { titulo: string };

export async function listarFilmes(): Promise<Filme[] | null> {
  const { data, error } = await sb
    .from('filmes')
    .select('*')
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, 'listarFilmes');
    return null;
  }
  return data as Filme[];
}

export async function criarFilme(dados: FilmeInput): Promise<Filme | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarFilme');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ver' as StatusFilme,
    favorito: false,
    ...dados,
  };

  const { data, error } = await sb.from('filmes').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarFilme');
    return null;
  }
  return data as Filme;
}

export async function atualizarFilme(uuid: string, dados: FilmeInput): Promise<Filme | null> {
  const { data, error } = await sb
    .from('filmes')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarFilme(${uuid})`);
    return null;
  }
  return data as Filme;
}

export async function apagarFilme(uuid: string): Promise<boolean> {
  return await softDelete('filmes', uuid);
}

// Complementos de anime (filme/OVA/ONA/Special) — DEC-025 (009).
// São linhas reais em `filmes`, filtradas por anime_uuid.
export async function listarComplementosDoAnime(animeUuid: string): Promise<Filme[] | null> {
  const { data, error } = await sb
    .from('filmes')
    .select('*')
    .eq('anime_uuid', animeUuid)
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, `listarComplementosDoAnime(${animeUuid})`);
    return null;
  }
  return data as Filme[];
}