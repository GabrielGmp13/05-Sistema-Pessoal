import { sb, getUserId, now, sbErr, softDelete } from './supabase';

export type StatusSerie = 'quero_ver' | 'assistindo' | 'assistido' | 'pausado' | 'abandonado';

export interface Serie {
  uuid: string;
  user_id: string;
  titulo: string;
  diretor: string | null; // reaproveita direção/criação, ver DATABASE.md
  tmdb_id: string | null;
  capa_url: string | null;
  capa_path: string | null;
  temporada_atual: number;
  episodio_atual: number;
  status: StatusSerie;
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
  classificacao_indicativa: string | null;
  duracao_minutos: number | null;
  link_imdb: string | null;
  link_mal: string | null;
  link_anilist: string | null;
  link_oficial: string | null;
  // produção — DEC-024 (008)
  roteirista: string | null;
  produtores: string | null;
  estudio: string | null;
  distribuidora: string | null;
  ano_lancamento: number | null;
  ano_termino: number | null; // nullable: série em andamento
  updated_at: string;
  deleted: boolean;
}

export type SerieInput = Partial<
  Omit<Serie, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { titulo: string };

export async function listarSeries(): Promise<Serie[] | null> {
  const { data, error } = await sb
    .from('series')
    .select('*')
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, 'listarSeries');
    return null;
  }
  return data as Serie[];
}

export async function criarSerie(dados: SerieInput): Promise<Serie | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarSerie');
    return null;
  }

  const nova = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ver' as StatusSerie,
    favorito: false,
    temporada_atual: 1,
    episodio_atual: 0,
    ...dados,
  };

  const { data, error } = await sb.from('series').insert(nova).select().single();
  if (error) {
    sbErr(error, 'criarSerie');
    return null;
  }
  return data as Serie;
}

export async function atualizarSerie(uuid: string, dados: SerieInput): Promise<Serie | null> {
  const { data, error } = await sb
    .from('series')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarSerie(${uuid})`);
    return null;
  }
  return data as Serie;
}

export async function apagarSerie(uuid: string): Promise<boolean> {
  const { error } = await softDelete('series', uuid);
  return !error;
}