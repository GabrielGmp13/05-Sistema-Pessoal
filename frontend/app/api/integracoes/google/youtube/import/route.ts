import { NextRequest, NextResponse } from 'next/server'

import { googleApi, googleConfigured } from '@/lib/server/google'
import { getApiUser, getServiceSupabase } from '@/lib/server/supabase'
import {
  extrairYoutubePlaylistId,
  type YoutubePlaylistImport,
  YOUTUBE_PLAYLIST_ID_PATTERN,
} from '@/lib/youtube-playlists'

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

function parsePlaylist(value: unknown): YoutubePlaylistImport | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const youtubePlaylistId = typeof item.youtubePlaylistId === 'string' ? item.youtubePlaylistId : ''
  const nome = typeof item.nome === 'string' ? item.nome.trim() : ''
  const origem = item.origem
  const origemUrl = typeof item.origemUrl === 'string' ? item.origemUrl.trim() : ''
  if (
    !YOUTUBE_PLAYLIST_ID_PATTERN.test(youtubePlaylistId)
    || youtubePlaylistId === 'WL'
    || !nome
    || nome.length > 300
    || !['youtube_conta', 'youtube_link'].includes(String(origem))
    || extrairYoutubePlaylistId(origemUrl) !== youtubePlaylistId
  ) return null
  return { youtubePlaylistId, nome, origem: origem as YoutubePlaylistImport['origem'], origemUrl }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  if (!googleConfigured()) return NextResponse.json({ erro: 'Configure Google OAuth no servidor.' }, { status: 503 })
  const body = await request.json().catch(() => null) as { youtubeIds?: unknown; playlist?: unknown } | null
  const ids = Array.isArray(body?.youtubeIds)
    ? [...new Set(body.youtubeIds.filter((id): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id)))].slice(0, 50)
    : []
  if (ids.length === 0) return NextResponse.json({ erro: 'Selecione ao menos um vídeo válido.' }, { status: 400 })
  const playlist = body?.playlist === undefined ? null : parsePlaylist(body.playlist)
  if (body?.playlist !== undefined && !playlist) {
    return NextResponse.json({ erro: 'Dados da playlist são inválidos.' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ part: 'snippet,contentDetails', id: ids.join(',') })
    const data = await googleApi<VideosResponse>(user.id, 'youtube', `https://www.googleapis.com/youtube/v3/videos?${params}`)
    const admin = getServiceSupabase()
    const canonicalUrls = ids.map((id) => `https://www.youtube.com/watch?v=${id}`)
    const [{ data: existingById, error: idError }, { data: existingByUrl, error: urlError }] = await Promise.all([
      admin.from('videos').select('uuid,youtube_id,url').eq('user_id', user.id).eq('deleted', false).in('youtube_id', ids),
      admin.from('videos').select('uuid,youtube_id,url').eq('user_id', user.id).eq('deleted', false).in('url', canonicalUrls),
    ])
    if (idError || urlError) throw idError ?? urlError
    const existingVideos = [...(existingById ?? []), ...(existingByUrl ?? [])]
    const existingIds = new Set(existingVideos.map((item) =>
      item.youtube_id ?? item.url?.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] ?? null,
    ).filter((id): id is string => Boolean(id)))
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
    let inserted: Array<{ uuid: string; youtube_id: string | null }> = []
    if (rows.length > 0) {
      const { data: insertedData, error } = await admin.from('videos').insert(rows).select('uuid,youtube_id')
      if (error) throw error
      inserted = insertedData ?? []
    }

    let vinculados = 0
    if (playlist) {
      const timestamp = new Date().toISOString()
      const { data: existente, error: playlistLookupError } = await admin
        .from('videos_playlists')
        .select('uuid')
        .eq('user_id', user.id)
        .eq('youtube_playlist_id', playlist.youtubePlaylistId)
        .maybeSingle()
      if (playlistLookupError) throw playlistLookupError

      let playlistUuid = existente?.uuid
      if (playlistUuid) {
        const { error } = await admin.from('videos_playlists').update({
          nome: playlist.nome,
          origem: playlist.origem,
          origem_url: playlist.origemUrl,
          updated_at: timestamp,
          deleted: false,
        }).eq('uuid', playlistUuid).eq('user_id', user.id)
        if (error) throw error
      } else {
        playlistUuid = crypto.randomUUID()
        const { error } = await admin.from('videos_playlists').insert({
          uuid: playlistUuid,
          user_id: user.id,
          youtube_playlist_id: playlist.youtubePlaylistId,
          nome: playlist.nome,
          origem: playlist.origem,
          origem_url: playlist.origemUrl,
          importada_em: timestamp,
          updated_at: timestamp,
          deleted: false,
        })
        if (error) throw error
      }

      const videosPorYoutube = new Map<string, string>()
      for (const item of existingVideos) {
        const youtubeId = item.youtube_id ?? item.url?.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1]
        if (youtubeId) videosPorYoutube.set(youtubeId, item.uuid)
      }
      for (const item of inserted) if (item.youtube_id) videosPorYoutube.set(item.youtube_id, item.uuid)
      const videoUuids = ids.map((id) => videosPorYoutube.get(id)).filter((id): id is string => Boolean(id))
      const { data: itensExistentes, error: itensError } = await admin
        .from('videos_playlist_itens')
        .select('video_uuid,ordem')
        .eq('user_id', user.id)
        .eq('playlist_uuid', playlistUuid)
        .eq('deleted', false)
      if (itensError) throw itensError
      const jaVinculados = new Set((itensExistentes ?? []).map((item) => item.video_uuid))
      const proximaOrdem = Math.max(-1, ...(itensExistentes ?? []).map((item) => item.ordem)) + 1
      const novosVinculos = videoUuids.filter((uuid) => !jaVinculados.has(uuid)).map((videoUuid, index) => ({
        uuid: crypto.randomUUID(),
        user_id: user.id,
        playlist_uuid: playlistUuid,
        video_uuid: videoUuid,
        ordem: proximaOrdem + index,
        updated_at: timestamp,
        deleted: false,
      }))
      if (novosVinculos.length > 0) {
        const { error } = await admin.from('videos_playlist_itens').insert(novosVinculos)
        if (error) throw error
      }
      vinculados = videoUuids.length
    }
    const disponiveis = data.items?.length ?? 0
    return NextResponse.json({
      criados: rows.length,
      duplicados: Math.max(0, disponiveis - rows.length),
      indisponiveis: Math.max(0, ids.length - disponiveis),
      vinculados,
    })
  } catch (error) {
    console.error('[youtube/import] Falha ao importar vídeos.', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json({ erro: 'Não foi possível importar os vídeos agora. Tente novamente sem alterar a seleção.' }, { status: 502 })
  }
}
