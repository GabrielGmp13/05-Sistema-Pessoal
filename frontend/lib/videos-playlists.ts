import { getUserId, sb, sbErr } from './supabase'
import type { Video } from './videos'
import type { YoutubePlaylistOrigin } from './youtube-playlists'

export interface VideoPlaylist {
  uuid: string
  user_id: string
  youtube_playlist_id: string
  nome: string
  origem: YoutubePlaylistOrigin
  origem_url: string
  importada_em: string
  updated_at: string
  deleted: boolean
  quantidade_videos: number
}

type PlaylistRow = Omit<VideoPlaylist, 'quantidade_videos'>

export async function listarPlaylistsVideos(): Promise<VideoPlaylist[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data: playlists, error } = await sb
    .from('videos_playlists')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('updated_at', { ascending: false })
  if (error) return sbErr(error, 'listarPlaylistsVideos')
  const rows = (playlists ?? []) as PlaylistRow[]
  if (rows.length === 0) return []

  const { data: itens, error: itensError } = await sb
    .from('videos_playlist_itens')
    .select('playlist_uuid')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('playlist_uuid', rows.map((playlist) => playlist.uuid))
  if (itensError) return sbErr(itensError, 'listarPlaylistsVideos(itens)')
  const contagens = new Map<string, number>()
  for (const item of itens ?? []) contagens.set(item.playlist_uuid, (contagens.get(item.playlist_uuid) ?? 0) + 1)
  return rows.map((playlist) => ({ ...playlist, quantidade_videos: contagens.get(playlist.uuid) ?? 0 }))
}

export async function listarVideosDaPlaylist(playlistUuid: string): Promise<Video[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data: itens, error } = await sb
    .from('videos_playlist_itens')
    .select('video_uuid,ordem')
    .eq('user_id', userId)
    .eq('playlist_uuid', playlistUuid)
    .eq('deleted', false)
    .order('ordem')
  if (error) return sbErr(error, 'listarVideosDaPlaylist(itens)')
  const videoUuids = (itens ?? []).map((item) => item.video_uuid)
  if (videoUuids.length === 0) return []
  const { data: videos, error: videosError } = await sb
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .in('uuid', videoUuids)
  if (videosError) return sbErr(videosError, 'listarVideosDaPlaylist(videos)')
  const porUuid = new Map((videos ?? []).map((video) => [video.uuid, video as Video]))
  return videoUuids.map((uuid) => porUuid.get(uuid)).filter((video): video is Video => Boolean(video))
}
