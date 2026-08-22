'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, ListVideo, Loader2, RefreshCw, Unplug } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GoogleStatus {
  configurado: boolean
  conectado: boolean
  email?: string | null
}

interface Playlist {
  id: string
  titulo: string
  descricao: string
  capaUrl: string | null
  quantidade: number
}

interface PlaylistVideo {
  youtubeId: string
  titulo: string
  canal: string | null
  capaUrl: string | null
}

export function GoogleConnections() {
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [videos, setVideos] = useState<PlaylistVideo[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [playlistAtiva, setPlaylistAtiva] = useState<string | null>(null)
  const [proximaPaginaPlaylists, setProximaPaginaPlaylists] = useState<string | null>(null)
  const [proximaPaginaVideos, setProximaPaginaVideos] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const carregarStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integracoes/google/status', { cache: 'no-store' })
      const body = await response.json() as GoogleStatus & { erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível consultar a conexão.')
      setStatus(body)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível consultar a conexão.')
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarStatus()
      const oauth = new URLSearchParams(window.location.search).get('google')
      const messages: Record<string, string> = {
        conectado: 'Conta Google conectada com sucesso.',
        configuracao: 'Configure as variáveis Google no servidor antes de conectar.',
        'estado-invalido': 'A tentativa OAuth expirou ou falhou na validação de segurança.',
        erro: 'O Google não concluiu a conexão. Tente novamente.',
      }
      if (oauth && messages[oauth]) setMensagem(messages[oauth])
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarStatus])

  async function carregarPlaylists(pageToken?: string) {
    setProcessando(true)
    setErro('')
    try {
      const query = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ''
      const response = await fetch(`/api/integracoes/google/youtube/playlists${query}`, { cache: 'no-store' })
      const body = await response.json() as { playlists?: Playlist[]; proximaPagina?: string | null; erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível listar playlists.')
      setPlaylists((atuais) => pageToken ? [...atuais, ...(body.playlists ?? [])] : body.playlists ?? [])
      setProximaPaginaPlaylists(body.proximaPagina ?? null)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível listar playlists.')
    } finally {
      setProcessando(false)
    }
  }

  async function carregarVideos(playlistId: string, pageToken?: string) {
    setPlaylistAtiva(playlistId)
    if (!pageToken) { setVideos([]); setSelecionados(new Set()) }
    setProcessando(true)
    setErro('')
    try {
      const query = new URLSearchParams({ playlistId })
      if (pageToken) query.set('pageToken', pageToken)
      const response = await fetch(`/api/integracoes/google/youtube/playlist-videos?${query}`, { cache: 'no-store' })
      const body = await response.json() as { videos?: PlaylistVideo[]; proximaPagina?: string | null; erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível listar vídeos.')
      setVideos((atuais) => pageToken ? [...atuais, ...(body.videos ?? [])] : body.videos ?? [])
      setProximaPaginaVideos(body.proximaPagina ?? null)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível listar vídeos.')
    } finally {
      setProcessando(false)
    }
  }

  function alternarVideo(id: string) {
    setSelecionados((atuais) => {
      const next = new Set(atuais)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function importarVideos() {
    if (selecionados.size === 0) return
    setProcessando(true)
    setErro('')
    setMensagem('')
    try {
      const ids = [...selecionados]
      let criados = 0
      let duplicados = 0
      for (let inicio = 0; inicio < ids.length; inicio += 50) {
        const response = await fetch('/api/integracoes/google/youtube/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeIds: ids.slice(inicio, inicio + 50) }),
        })
        const body = await response.json() as { criados?: number; duplicados?: number; erro?: string }
        if (!response.ok) throw new Error(body.erro || 'Não foi possível importar os vídeos.')
        criados += body.criados ?? 0
        duplicados += body.duplicados ?? 0
      }
      setMensagem(`${criados} vídeo(s) importado(s); ${duplicados} duplicado(s) ignorado(s).`)
      setSelecionados(new Set())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível importar os vídeos.')
    } finally {
      setProcessando(false)
    }
  }

  async function desconectar() {
    setProcessando(true)
    setErro('')
    try {
      const response = await fetch('/api/integracoes/google/disconnect', { method: 'POST' })
      const body = await response.json() as { erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível desconectar.')
      setPlaylists([])
      setVideos([])
      setProximaPaginaPlaylists(null)
      setProximaPaginaVideos(null)
      setMensagem('Conta Google desconectada localmente e revogação solicitada ao provedor.')
      await carregarStatus()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível desconectar.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <Card className="mt-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Integrações</p>
          <h2 className="mt-1 text-xl font-semibold">Google</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Conexão server-side para playlists do YouTube e exportação unilateral da Agenda. Tokens nunca são enviados ao navegador.</p>
        </div>
        {!status ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : status.conectado ? (
          <Button type="button" variant="outline" onClick={() => void desconectar()} disabled={processando}><Unplug />Desconectar</Button>
        ) : status.configurado ? (
          <a href="/api/integracoes/google/connect" className={cn(buttonVariants())}>Conectar Google</a>
        ) : <Button type="button" disabled>Conectar Google</Button>}
      </div>

      {status ? <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        {status.conectado ? <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />Conectado{status.email ? ` como ${status.email}` : ''}.</p> : status.configurado ? <p>Credenciais configuradas; autorização da conta ainda pendente.</p> : <p>Configuração server-side ausente. Consulte <code>docs/INTEGRACOES_EXTERNAS.md</code>.</p>}
      </div> : null}
      {mensagem ? <p role="status" className="mt-3 text-sm text-success-foreground">{mensagem}</p> : null}
      {erro ? <p role="alert" className="mt-3 text-sm text-destructive">{erro}</p> : null}

      {status?.conectado ? <div className="mt-6 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-semibold"><ListVideo className="size-4" />Playlists do YouTube</h3><p className="mt-1 text-xs text-muted-foreground">Importa os vídeos selecionados e ignora IDs já presentes na Biblioteca.</p></div><Button type="button" variant="outline" size="sm" disabled={processando} onClick={() => void carregarPlaylists()}><RefreshCw className={processando ? 'animate-spin' : ''} />Listar playlists</Button></div>
        {playlists.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{playlists.map((playlist) => <button key={playlist.id} type="button" onClick={() => void carregarVideos(playlist.id)} className={`rounded-lg border p-3 text-left hover:bg-muted/50 ${playlistAtiva === playlist.id ? 'border-primary bg-primary/5' : 'border-border'}`}><strong className="block truncate text-sm">{playlist.titulo}</strong><span className="mt-1 block text-xs text-muted-foreground">{playlist.quantidade} vídeo(s)</span></button>)}</div> : null}
        {proximaPaginaPlaylists ? <Button type="button" className="mt-3" variant="ghost" size="sm" disabled={processando} onClick={() => void carregarPlaylists(proximaPaginaPlaylists)}>Carregar mais playlists</Button> : null}
        {playlistAtiva && videos.length === 0 && !processando ? <p className="mt-4 text-sm text-muted-foreground">Nenhum vídeo importável nesta playlist.</p> : null}
        {videos.length > 0 ? <div className="mt-4"><div className="max-h-80 space-y-2 overflow-y-auto pr-1">{videos.map((video) => <label key={video.youtubeId} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"><input type="checkbox" className="mt-1 size-4" checked={selecionados.has(video.youtubeId)} onChange={() => alternarVideo(video.youtubeId)} /><span className="min-w-0"><strong className="block truncate text-sm">{video.titulo}</strong><span className="text-xs text-muted-foreground">{video.canal || video.youtubeId}</span></span></label>)}</div><div className="mt-3 flex flex-wrap gap-2">{proximaPaginaVideos && playlistAtiva ? <Button type="button" variant="outline" disabled={processando} onClick={() => void carregarVideos(playlistAtiva, proximaPaginaVideos)}>Carregar mais vídeos</Button> : null}<Button type="button" disabled={processando || selecionados.size === 0} onClick={() => void importarVideos()}>Importar {selecionados.size || ''} vídeo(s)</Button></div></div> : null}
        <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground"><CalendarDays className="mt-0.5 size-3.5 shrink-0" />A exportação para o Google Calendar aparece em cada compromisso manual da Agenda. Provas de Estudos não são exportadas.</p>
      </div> : null}
    </Card>
  )
}
