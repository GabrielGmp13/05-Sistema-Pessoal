import { getUserId, now, sb, sbErr, softDelete } from './supabase';

export interface Video {
  uuid: string;
  user_id: string;
  titulo: string;
  url: string;
  youtube_id: string | null;
  canal: string | null;
  duracao_segundos: number | null;
  capa_url: string | null;
  assistido: boolean;
  favorito: boolean;
  nota: number | null;
  comentario: string | null;
  updated_at: string;
  deleted: boolean;
}

export type VideoInput = Partial<Omit<Video, 'uuid' | 'user_id' | 'updated_at' | 'deleted'>> & {
  titulo: string;
  url: string;
};

export function extrairYoutubeId(valor: string): string | null {
  try {
    const url = new URL(valor);
    let id: string | null = null;

    if (url.hostname === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? null;
    else if (url.hostname.endsWith('youtube.com')) {
      id = url.searchParams.get('v');
      if (!id) {
        const partes = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(partes[0])) id = partes[1] ?? null;
      }
    }

    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function prepararDados(dados: VideoInput): VideoInput {
  const youtubeId = extrairYoutubeId(dados.url);
  const usaThumbnailYoutube = dados.capa_url?.startsWith('https://i.ytimg.com/vi/');
  const capaUrl = !dados.capa_url || usaThumbnailYoutube
    ? youtubeId
      ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
      : null
    : dados.capa_url;
  return {
    ...dados,
    youtube_id: youtubeId,
    capa_url: capaUrl,
  };
}

export async function listarVideos(): Promise<Video[] | null> {
  const { data, error } = await sb
    .from('videos')
    .select('*')
    .eq('deleted', false)
    .order('titulo');

  if (error) return sbErr(error, 'listarVideos');
  return data as Video[];
}

export async function criarVideo(dados: VideoInput): Promise<Video | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await sb
    .from('videos')
    .insert({
      ...prepararDados(dados),
      uuid: crypto.randomUUID(),
      user_id: userId,
      assistido: dados.assistido ?? false,
      favorito: dados.favorito ?? false,
    })
    .select()
    .single();

  if (error) return sbErr(error, 'criarVideo');
  return data as Video;
}

export async function atualizarVideo(uuid: string, dados: VideoInput): Promise<Video | null> {
  const { data, error } = await sb
    .from('videos')
    .update({ ...prepararDados(dados), updated_at: now() })
    .eq('uuid', uuid)
    .select()
    .single();

  if (error) return sbErr(error, `atualizarVideo(${uuid})`);
  return data as Video;
}

export async function apagarVideo(uuid: string): Promise<boolean> {
  return softDelete('videos', uuid);
}
