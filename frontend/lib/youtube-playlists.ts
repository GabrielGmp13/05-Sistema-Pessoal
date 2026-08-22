export const YOUTUBE_PLAYLIST_ID_PATTERN = /^(?:WL|[A-Za-z0-9_-]{10,100})$/

export type YoutubePlaylistOrigin = 'youtube_conta' | 'youtube_link'

export interface YoutubePlaylistImport {
  youtubePlaylistId: string
  nome: string
  origem: YoutubePlaylistOrigin
  origemUrl: string
}

export function extrairYoutubePlaylistId(valor: string): string | null {
  try {
    const url = new URL(valor.trim())
    const host = url.hostname.toLowerCase()
    const youtubeHost = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be'
    if (!youtubeHost || !['http:', 'https:'].includes(url.protocol)) return null
    const playlistId = url.searchParams.get('list')
    return playlistId && YOUTUBE_PLAYLIST_ID_PATTERN.test(playlistId) ? playlistId : null
  } catch {
    return null
  }
}

export function urlCanonicaPlaylist(playlistId: string) {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`
}

export function mensagemPlaylistInacessivel(playlistId?: string) {
  if (playlistId === 'WL') {
    return '“Assistir mais tarde” não pode ser importada pela API oficial do YouTube. Isso é uma limitação do provedor, não um bug do site.'
  }
  return 'A playlist não pôde ser acessada. Ela pode ser privada, bloqueada, removida ou indisponível para a conta conectada na API oficial do YouTube.'
}
