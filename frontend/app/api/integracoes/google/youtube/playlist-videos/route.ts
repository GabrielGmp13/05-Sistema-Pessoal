import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'

interface PlaylistItemsResponse {
  nextPageToken?: string
  items?: Array<{ snippet?: { title?: string; channelTitle?: string; resourceId?: { videoId?: string }; thumbnails?: { medium?: { url?: string } } } }>
}

export async function GET(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const playlistId = request.nextUrl.searchParams.get('playlistId') ?? ''
  const pageToken = request.nextUrl.searchParams.get('pageToken') ?? ''
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(playlistId)) return NextResponse.json({ erro: 'Playlist inválida.' }, { status: 400 })
  if (pageToken && !/^[A-Za-z0-9_-]{1,300}$/.test(pageToken)) return NextResponse.json({ erro: 'Página inválida.' }, { status: 400 })

  try {
    const params = new URLSearchParams({ part: 'snippet', playlistId, maxResults: '50' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await googleApi<PlaylistItemsResponse>(user.id, `https://www.googleapis.com/youtube/v3/playlistItems?${params}`)
    return NextResponse.json({
      videos: (data.items ?? []).map((item) => ({
        youtubeId: item.snippet?.resourceId?.videoId,
        titulo: item.snippet?.title ?? 'Vídeo sem título',
        canal: item.snippet?.channelTitle ?? null,
        capaUrl: item.snippet?.thumbnails?.medium?.url ?? null,
      })).filter((item) => item.youtubeId && item.titulo !== 'Private video' && item.titulo !== 'Deleted video'),
      proximaPagina: data.nextPageToken ?? null,
    })
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível listar vídeos.' }, { status: 502 })
  }
}
