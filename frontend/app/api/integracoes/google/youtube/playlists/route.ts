import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser } from '@/lib/server/supabase'

interface PlaylistsResponse {
  nextPageToken?: string
  items?: Array<{
    id?: string
    snippet?: { title?: string; description?: string; thumbnails?: { medium?: { url?: string } } }
    contentDetails?: { itemCount?: number }
  }>
}

export async function GET(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const pageToken = request.nextUrl.searchParams.get('pageToken') ?? ''
  if (pageToken && !/^[A-Za-z0-9_-]{1,300}$/.test(pageToken)) return NextResponse.json({ erro: 'Página inválida.' }, { status: 400 })

  try {
    const params = new URLSearchParams({ part: 'snippet,contentDetails', mine: 'true', maxResults: '50' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await googleApi<PlaylistsResponse>(user.id, `https://www.googleapis.com/youtube/v3/playlists?${params}`)
    return NextResponse.json({
      playlists: (data.items ?? []).filter((item) => item.id).map((item) => ({
        id: item.id,
        titulo: item.snippet?.title ?? 'Playlist sem título',
        descricao: item.snippet?.description ?? '',
        capaUrl: item.snippet?.thumbnails?.medium?.url ?? null,
        quantidade: item.contentDetails?.itemCount ?? 0,
      })),
      proximaPagina: data.nextPageToken ?? null,
    })
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível listar playlists.' }, { status: 502 })
  }
}
