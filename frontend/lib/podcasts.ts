import { sb, getUserId, now, sbErr, softDelete } from './supabase';

// Schema: 003_biblioteca.sql + 004_podcasts_itunes.sql + 006_biblioteca_v2_base.sql
// + 013_biblioteca_v2_b6_podcasts.sql
export type StatusPodcast = 'quero_ouvir' | 'ouvindo' | 'concluido' | 'pausado' | 'abandonado';

export interface Podcast {
  uuid: string;
  user_id: string;
  titulo: string;
  itunes_id: string | null;
  capa_url: string | null;
  capa_path: string | null;
  episodio_atual: number;
  status: StatusPodcast;
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
  link_oficial: string | null;
  // B6 (013) — sai do comentario prefixado, ganha campo próprio
  produtora: string | null;
  updated_at: string;
  deleted: boolean;
}

export type PodcastInput = Partial<
  Omit<Podcast, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>
> & { titulo: string };

export async function listarPodcasts(): Promise<Podcast[] | null> {
  const { data, error } = await sb
    .from('podcasts')
    .select('*')
    .eq('deleted', false)
    .order('titulo', { ascending: true });

  if (error) {
    sbErr(error, 'listarPodcasts');
    return null;
  }
  return data as Podcast[];
}

export async function criarPodcast(dados: PodcastInput): Promise<Podcast | null> {
  const userId = await getUserId();
  if (!userId) {
    sbErr('sem sessão ativa', 'criarPodcast');
    return null;
  }

  const novo = {
    uuid: crypto.randomUUID(),
    user_id: userId,
    status: 'quero_ouvir' as StatusPodcast,
    favorito: false,
    episodio_atual: 0,
    ...dados,
  };

  const { data, error } = await sb.from('podcasts').insert(novo).select().single();
  if (error) {
    sbErr(error, 'criarPodcast');
    return null;
  }
  return data as Podcast;
}

export async function atualizarPodcast(
  uuid: string,
  dados: PodcastInput
): Promise<Podcast | null> {
  const { data, error } = await sb
    .from('podcasts')
    .update({ ...dados, updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) {
    sbErr(error, `atualizarPodcast(${uuid})`);
    return null;
  }
  return data as Podcast;
}

export async function apagarPodcast(uuid: string): Promise<boolean> {
  return await softDelete('podcasts', uuid);
}
