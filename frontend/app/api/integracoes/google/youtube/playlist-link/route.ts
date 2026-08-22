import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'
import {
  extrairYoutubePlaylistId,
  mensagemPlaylistInacessivel,
  urlCanonicaPlaylist,
} from '@/lib/youtube-playlists'

interface PlaylistResponse {
  items?: Array<{
    id?: string
    snippet?: { title?: string; description?: string; thumbnails?: { medium?: { url?: string } } }
    contentDetails?: { itemCount?: number }
  }>
}

interface PlaylistItemsResponse {
  nextPageToken?: string
  items?: Array<{
    snippet?: {
      title?: string
      channelTitle?: string
      videoOwnerChannelTitle?: string
      resourceId?: { videoId?: string }
      thumbnails?: { medium?: { url?: string } }
    }
  }>
}

export async function GET(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })

  const playlistId = extrairYoutubePlaylistId(request.nextUrl.searchParams.get('url') ?? '')
  if (!playlistId) return NextResponse.json({ erro: 'Informe um link válido do YouTube contendo list=.' }, { status: 400 })
  if (playlistId === 'WL') return NextResponse.json({ erro: mensagemPlaylistInacessivel(playlistId), limitacaoOficial: true }, { status: 422 })

  try {
    const playlistParams = new URLSearchParams({ part: 'snippet,contentDetails', id: playlistId, maxResults: '1' })
    const itemParams = new URLSearchParams({ part: 'snippet', playlistId, maxResults: '50' })
    const [playlistData, itemsData] = await Promise.all([
      googleApi<PlaylistResponse>(user.id, 'youtube', `https://www.googleapis.com/youtube/v3/playlists?${playlistParams}`),
      googleApi<PlaylistItemsResponse>(user.id, 'youtube', `https://www.googleapis.com/youtube/v3/playlistItems?${itemParams}`),
    ])
    const playlist = playlistData.items?.[0]
    if (!playlist?.id) {
      return NextResponse.json({ erro: mensagemPlaylistInacessivel(playlistId), limitacaoOficial: true }, { status: 404 })
    }

    return NextResponse.json({
      playlist: {
        id: playlistId,
        titulo: playlist.snippet?.title ?? 'Playlist sem título',
        descricao: playlist.snippet?.description ?? '',
        capaUrl: playlist.snippet?.thumbnails?.medium?.url ?? null,
        quantidade: playlist.contentDetails?.itemCount ?? 0,
        origemUrl: urlCanonicaPlaylist(playlistId),
      },
      videos: (itemsData.items ?? []).map((item) => ({
        youtubeId: item.snippet?.resourceId?.videoId,
        titulo: item.snippet?.title ?? 'Vídeo sem título',
        canal: item.snippet?.videoOwnerChannelTitle ?? item.snippet?.channelTitle ?? null,
        capaUrl: item.snippet?.thumbnails?.medium?.url ?? null,
      })).filter((item) => item.youtubeId && item.titulo !== 'Private video' && item.titulo !== 'Deleted video'),
      proximaPagina: itemsData.nextPageToken ?? null,
    })
  } catch (error) {
    console.error('[youtube/playlist-link] Falha ao consultar playlist.', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json({ erro: mensagemPlaylistInacessivel(playlistId), limitacaoOficial: true }, { status: 502 })
  }
}
