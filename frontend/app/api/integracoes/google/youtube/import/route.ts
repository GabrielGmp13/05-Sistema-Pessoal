import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'

interface VideosResponse {
  items?: Array<{
    id: string
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } }
    contentDetails?: { duration?: string }
  }>
}

function durationSeconds(value?: string) {
  const match = value?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  return match ? Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) : null
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { youtubeIds?: unknown } | null
  const ids = Array.isArray(body?.youtubeIds)
    ? [...new Set(body.youtubeIds.filter((id): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id)))].slice(0, 50)
    : []
  if (ids.length === 0) return NextResponse.json({ erro: 'Selecione ao menos um vídeo válido.' }, { status: 400 })

  try {
    const params = new URLSearchParams({ part: 'snippet,contentDetails', id: ids.join(',') })
    const data = await googleApi<VideosResponse>(user.id, 'youtube', `https://www.googleapis.com/youtube/v3/videos?${params}`)
    const admin = getServiceSupabase()
    const canonicalUrls = ids.map((id) => `https://www.youtube.com/watch?v=${id}`)
    const [{ data: existingById, error: idError }, { data: existingByUrl, error: urlError }] = await Promise.all([
      admin.from('videos').select('youtube_id').eq('user_id', user.id).eq('deleted', false).in('youtube_id', ids),
      admin.from('videos').select('url').eq('user_id', user.id).eq('deleted', false).in('url', canonicalUrls),
    ])
    if (idError || urlError) throw idError ?? urlError
    const existingIds = new Set([
      ...(existingById ?? []).map((item) => item.youtube_id),
      ...(existingByUrl ?? []).map((item) => item.url?.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] ?? null),
    ].filter((id): id is string => Boolean(id)))
    const rows = (data.items ?? []).filter((item) => !existingIds.has(item.id)).map((item) => ({
      uuid: crypto.randomUUID(),
      user_id: user.id,
      titulo: item.snippet?.title ?? 'Vídeo sem título',
      url: `https://www.youtube.com/watch?v=${item.id}`,
      youtube_id: item.id,
      canal: item.snippet?.channelTitle ?? null,
      duracao_segundos: durationSeconds(item.contentDetails?.duration),
      capa_url: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? null,
      assistido: false,
      favorito: false,
      deleted: false,
    }))
    if (rows.length > 0) {
      const { error } = await admin.from('videos').insert(rows)
      if (error) throw error
    }
    return NextResponse.json({ criados: rows.length, duplicados: ids.length - rows.length })
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível importar os vídeos.' }, { status: 502 })
  }
}
