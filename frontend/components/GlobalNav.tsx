'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, CalendarRange, ChevronDown, Code2, Dumbbell, FolderKanban, GraduationCap, Home, Languages, LogOut, Mail, NotebookTabs, Pencil } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'

import { getSession, getSignedUrl, sb } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { SeasonalDecor } from './SeasonalDecor'
import { useTema } from './ThemeProvider'
import styles from './GlobalNav.module.css'

type CaixaPerfil = {
  left: number
  top: number
  width: number
  height: number
}

type VooPerfil = {
  origem: CaixaPerfil
  destino: CaixaPerfil
  final: 'compacto' | 'amplo'
  iniciou: boolean
  finalizando: boolean
}

const links = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/treino', label: 'Treino', icon: Dumbbell },
  { href: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/estudos', label: 'Estudos', icon: GraduationCap },
  { href: '/idiomas', label: 'Idiomas', icon: Languages },
  { href: '/revisao', label: 'Revisão', icon: Brain },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/historico', label: 'Histórico', icon: CalendarRange },
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/programacao', label: 'Programação', icon: Code2 },
  { href: '/diario', label: 'Diário', icon: NotebookTabs },
]

const ROTAS_DIARIO = ['/diario', '/saude', '/financas', '/lugares', '/receitas']
const ROTAS_TELA_INTEIRA = ['/revisao/sessao', '/estudos/enem/gabarito']

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/diario') {
    return ROTAS_DIARIO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function usaTelaInteira(pathname: string) {
  return ROTAS_TELA_INTEIRA.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export function GlobalNav() {
  const { corAmbiente, definirCorAmbiente } = useTema()
  const pathname = usePathname()
  const router = useRouter()
  const ocultarNavegacao = pathname === '/login'
  const biblioteca = pathname === '/biblioteca' || pathname.startsWith('/biblioteca/')
  const [saindo, setSaindo] = useState(false)
  const [painelAberto, setPainelAberto] = useState<'perfil' | 'tema' | null>(null)
  const [rotaTransicao, setRotaTransicao] = useState<'entrando-biblioteca' | 'saindo-biblioteca' | null>(null)
  const [vooPerfil, setVooPerfil] = useState<VooPerfil | null>(null)
  const perfilAreaRef = useRef<HTMLDivElement>(null)
  const perfilBotaoRef = useRef<HTMLButtonElement>(null)
  const navegacaoRef = useRef<HTMLElement>(null)
  const rotaTimeoutRef = useRef<number | null>(null)
  const destinoTransicaoRef = useRef<string | null>(null)
  const destinoPaginaRef = useRef<string | null>(null)
  const entradaPaginaRef = useRef<'esquerda' | 'direita'>('direita')
  const saidaPaginaTimeoutRef = useRef<number | null>(null)
  const navegacaoPaginaTimeoutRef = useRef<number | null>(null)
  const limpezaPaginaTimeoutRef = useRef<number | null>(null)
  const [perfil, setPerfil] = useState<{
    nome: string
    descricao: string | null
    email: string | null
    avatarUrl: string | null
    backgroundUrl: string | null
  } | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregarPerfil() {
      try {
        const session = await getSession()
        const meta = session?.user.user_metadata
        const [avatarResultado, backgroundResultado] = await Promise.allSettled([
          meta?.avatar_path ? getSignedUrl('midias-pessoais', meta.avatar_path) : null,
          meta?.background_path ? getSignedUrl('midias-pessoais', meta.background_path) : null,
        ])
        if (!ativo) return
        const avatarSigned = avatarResultado.status === 'fulfilled' ? avatarResultado.value : null
        const backgroundSigned = backgroundResultado.status === 'fulfilled' ? backgroundResultado.value : null
        setPerfil({
          nome: meta?.full_name || meta?.name || session?.user.email?.split('@')[0] || 'Usuário',
          descricao: meta?.subtitle || null,
          email: session?.user.email || null,
          avatarUrl: avatarSigned || meta?.avatar_url || null,
          backgroundUrl: backgroundSigned || meta?.background_url || null,
        })
      } catch (error) {
        console.error('Erro ao carregar perfil compacto da Biblioteca:', error)
      }
    }
    void carregarPerfil()
    window.addEventListener('perfil-atualizado', carregarPerfil)
    return () => {
      ativo = false
      window.removeEventListener('perfil-atualizado', carregarPerfil)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => setPainelAberto(null), 0)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => () => {
    if (rotaTimeoutRef.current !== null) window.clearTimeout(rotaTimeoutRef.current)
    if (saidaPaginaTimeoutRef.current !== null) window.clearTimeout(saidaPaginaTimeoutRef.current)
    if (navegacaoPaginaTimeoutRef.current !== null) window.clearTimeout(navegacaoPaginaTimeoutRef.current)
    if (limpezaPaginaTimeoutRef.current !== null) window.clearTimeout(limpezaPaginaTimeoutRef.current)
    delete document.documentElement.dataset.paginaSaida
    delete document.documentElement.dataset.paginaEntrada
    delete document.documentElement.dataset.paginaEntradaPronta
  }, [])

  useLayoutEffect(() => {
    if (pathname !== destinoPaginaRef.current) return

    if (saidaPaginaTimeoutRef.current !== null) {
      window.clearTimeout(saidaPaginaTimeoutRef.current)
      saidaPaginaTimeoutRef.current = null
    }
    document.documentElement.dataset.paginaEntrada = entradaPaginaRef.current
    delete document.documentElement.dataset.paginaSaida
    delete document.documentElement.dataset.paginaEntradaPronta

    const frame = window.requestAnimationFrame(() => {
      document.documentElement.dataset.paginaEntradaPronta = 'true'
    })
    limpezaPaginaTimeoutRef.current = window.setTimeout(() => {
      delete document.documentElement.dataset.paginaEntrada
      delete document.documentElement.dataset.paginaEntradaPronta
      destinoPaginaRef.current = null
      navegacaoPaginaTimeoutRef.current = null
      limpezaPaginaTimeoutRef.current = null
    }, 540)
    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  useLayoutEffect(() => {
    if (!rotaTransicao || pathname !== destinoTransicaoRef.current) return

    setRotaTransicao(null)
    setVooPerfil((atual) => atual ? { ...atual, finalizando: true } : null)
    destinoTransicaoRef.current = null
    rotaTimeoutRef.current = window.setTimeout(() => {
      setVooPerfil(null)
      rotaTimeoutRef.current = null
    }, 260)
  }, [pathname, rotaTransicao])

  useLayoutEffect(() => {
    if (!rotaTransicao) return
    document.documentElement.dataset.rotaTransicao = rotaTransicao
    return () => { delete document.documentElement.dataset.rotaTransicao }
  }, [rotaTransicao])

  useLayoutEffect(() => {
    if (!vooPerfil || vooPerfil.iniciou) return
    let segundoFrame = 0
    const primeiroFrame = window.requestAnimationFrame(() => {
      segundoFrame = window.requestAnimationFrame(() => {
        setVooPerfil((atual) => atual ? { ...atual, iniciou: true } : null)
      })
    })
    return () => {
      window.cancelAnimationFrame(primeiroFrame)
      window.cancelAnimationFrame(segundoFrame)
    }
  }, [vooPerfil])

  useLayoutEffect(() => {
    const navegacao = navegacaoRef.current
    const ativo = navegacao?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!navegacao || !ativo) return

    navegacao.style.setProperty('--indicador-x', `${ativo.offsetLeft}px`)
    navegacao.style.setProperty('--indicador-largura', `${ativo.offsetWidth}px`)
    navegacao.style.setProperty('--indicador-opacidade', '1')

    const frame = window.requestAnimationFrame(() => {
      navegacao.dataset.indicadorPronto = 'true'
      ativo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, biblioteca])

  useEffect(() => {
    if (painelAberto !== 'perfil') return

    function fecharAoClicarFora(event: PointerEvent) {
      if (!perfilAreaRef.current?.contains(event.target as Node)) setPainelAberto(null)
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setPainelAberto(null)
      perfilBotaoRef.current?.focus()
    }

    document.addEventListener('pointerdown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [painelAberto])

  if (ocultarNavegacao) {
    return (
      <div className={styles.temaLogin}>
        <ThemeToggle />
      </div>
    )
  }

  const estiloAtmosfera = {
    '--cor-ambiente': corAmbiente || 'var(--ambient-fallback)',
  } as CSSProperties

  async function handleLogout() {
    if (saindo) return
    setSaindo(true)
    try {
      const { error } = await sb.auth.signOut()
      if (error) {
        console.error('Erro ao sair:', error)
        return
      }
      router.replace('/login')
      router.refresh()
    } finally {
      setSaindo(false)
    }
  }

  function prepararMovimentoPagina(destino: string, atrasoSaida = 0) {
    const indiceAtual = links.findIndex((link) => isActive(pathname, link.href))
    const indiceDestino = links.findIndex((link) => link.href === destino)
    if (indiceAtual < 0 || indiceDestino < 0 || indiceAtual === indiceDestino) return false

    const destinoFicaADireita = indiceDestino > indiceAtual
    const iniciarSaida = () => {
      document.documentElement.dataset.paginaSaida = destinoFicaADireita ? 'esquerda' : 'direita'
    }

    destinoPaginaRef.current = destino
    entradaPaginaRef.current = destinoFicaADireita ? 'direita' : 'esquerda'
    if (atrasoSaida > 0) {
      saidaPaginaTimeoutRef.current = window.setTimeout(iniciarSaida, atrasoSaida)
    } else {
      iniciarSaida()
    }
    return true
  }

  function navegarEntreBiblioteca(event: ReactMouseEvent<HTMLAnchorElement>, destino: string) {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return

    const entrando = !biblioteca && destino === '/biblioteca'
    const saindoDaBiblioteca = biblioteca && destino !== '/biblioteca'
    if (!entrando && !saindoDaBiblioteca) {
      if (destinoPaginaRef.current !== null) {
        event.preventDefault()
        return
      }
      if (!prepararMovimentoPagina(destino)) return
      event.preventDefault()
      navegacaoPaginaTimeoutRef.current = window.setTimeout(() => router.push(destino), 360)
      return
    }
    const coluna = document.querySelector<HTMLElement>('[aria-label="Painel lateral pessoal"]')
    if (!coluna || window.getComputedStyle(coluna).display === 'none') return

    if (rotaTimeoutRef.current !== null) return

    const perfilAmplo = coluna.querySelector<HTMLElement>('[data-perfil-amplo]')
    const perfilCompacto = perfilAreaRef.current
    if (!perfilAmplo || (saindoDaBiblioteca && !perfilCompacto)) return
    event.preventDefault()

    const caixaPerfilAmplo = perfilAmplo.getBoundingClientRect()
    const caixaAmpla = {
      left: caixaPerfilAmplo.left,
      top: caixaPerfilAmplo.top,
      width: caixaPerfilAmplo.width,
      height: caixaPerfilAmplo.height,
    }
    const caixaCompacta = entrando
      ? {
          left: Math.max(12, (window.innerWidth - 1920) / 2 + 12),
          top: 6,
          width: 168,
          height: 44,
        }
      : (() => {
          const caixa = perfilCompacto!.getBoundingClientRect()
          return { left: caixa.left, top: caixa.top, width: caixa.width, height: caixa.height }
        })()

    setVooPerfil({
      origem: entrando ? caixaAmpla : caixaCompacta,
      destino: entrando ? caixaCompacta : caixaAmpla,
      final: entrando ? 'compacto' : 'amplo',
      iniciou: false,
      finalizando: false,
    })
    setRotaTransicao(entrando ? 'entrando-biblioteca' : 'saindo-biblioteca')
    destinoTransicaoRef.current = destino
    prepararMovimentoPagina(destino, 1880)

    rotaTimeoutRef.current = window.setTimeout(() => {
      router.push(destino)
    }, 2450)
  }

  const inicial = perfil?.nome.charAt(0).toUpperCase() || 'U'

  return (
    <header
      className={cn(
        styles.header,
        (usaTelaInteira(pathname) || biblioteca) && styles.headerTelaInteira,
        biblioteca && styles.headerBiblioteca,
      )}
      style={estiloAtmosfera}
    >
      <SeasonalDecor variante="topo" />
      <div className={cn(styles.barra, biblioteca && styles.barraBiblioteca)}>
        {biblioteca ? (
          <div ref={perfilAreaRef} className={styles.perfilArea} data-perfil-compacto>
            <button
              ref={perfilBotaoRef}
              type="button"
              className={styles.perfil}
              aria-label={`Abrir resumo do perfil de ${perfil?.nome || 'usuário'}`}
              aria-expanded={painelAberto === 'perfil'}
              aria-haspopup="dialog"
              onClick={() => setPainelAberto((atual) => atual === 'perfil' ? null : 'perfil')}
            >
              <span aria-hidden="true" className={styles.perfilFundo} />
              {perfil?.backgroundUrl ? (
                <span
                  aria-hidden="true"
                  className={styles.perfilImagem}
                  style={{ backgroundImage: `url(${perfil.backgroundUrl})` }}
                />
              ) : null}
              <span className={styles.avatar}>
                {perfil?.avatarUrl ? (
                  <span aria-hidden="true" className={styles.avatarImagem} style={{ backgroundImage: `url(${perfil.avatarUrl})` }} />
                ) : (
                  <span aria-hidden="true">{inicial}</span>
                )}
              </span>
              <span className={styles.perfilNome}>{perfil?.nome || 'Perfil'}</span>
              <ChevronDown aria-hidden="true" className={cn(styles.perfilSeta, painelAberto === 'perfil' && styles.perfilSetaAberta)} />
            </button>

            {painelAberto === 'perfil' ? (
              <div role="dialog" aria-label="Resumo do perfil" className={styles.perfilPainel}>
                <div className={styles.perfilCapa}>
                  {perfil?.backgroundUrl ? <span aria-hidden="true" style={{ backgroundImage: `url(${perfil.backgroundUrl})` }} /> : null}
                </div>
                <div className={styles.perfilPainelCorpo}>
                  <span className={cn(styles.avatar, styles.avatarPainel)}>
                    {perfil?.avatarUrl ? (
                      <span aria-hidden="true" className={styles.avatarImagem} style={{ backgroundImage: `url(${perfil.avatarUrl})` }} />
                    ) : (
                      <span aria-hidden="true">{inicial}</span>
                    )}
                  </span>
                  <strong>{perfil?.nome || 'Perfil'}</strong>
                  {perfil?.descricao ? <p>{perfil.descricao}</p> : null}
                  {perfil?.email ? <span className={styles.perfilEmail}><Mail aria-hidden="true" />{perfil.email}</span> : null}
                  <div className={styles.corAmbiente}>
                    <label htmlFor="cor-ambiente">Cor ambiente</label>
                    <div>
                      <input
                        id="cor-ambiente"
                        type="color"
                        value={corAmbiente || '#78927b'}
                        onChange={(event) => definirCorAmbiente(event.target.value)}
                        aria-label="Escolher cor dos detalhes decorativos"
                      />
                      <span>{corAmbiente ? corAmbiente.toUpperCase() : 'Cor do tema'}</span>
                      {corAmbiente ? <button type="button" onClick={() => definirCorAmbiente(null)}>Restaurar</button> : null}
                    </div>
                    <small>Usada apenas nos detalhes e partículas do topo.</small>
                  </div>
                  <Link href="/configuracoes" className={styles.editarPerfil} onClick={() => setPainelAberto(null)}>
                    <Pencil aria-hidden="true" />
                    Editar perfil
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <nav ref={navegacaoRef} aria-label="Navegação principal" className={styles.navegacao}>
          <span aria-hidden="true" className={styles.indicadorAtivo} />
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(pathname, link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={active ? 'page' : undefined}
                title={link.label}
                className={cn(styles.link, active && styles.linkAtivo)}
                onClick={(event) => navegarEntreBiblioteca(event, link.href)}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {biblioteca ? (
          <div className={styles.acoes}>
            <ThemeToggle
              className={styles.tema}
              open={painelAberto === 'tema'}
              onOpenChange={(open) => setPainelAberto(open ? 'tema' : null)}
            />
            <button type="button" onClick={handleLogout} disabled={saindo} className={styles.sair}>
              <LogOut className="size-4" />
              <span>{saindo ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        ) : null}
      </div>

      {vooPerfil ? createPortal(
        <div
          aria-hidden="true"
          className={cn(
            styles.perfilViajante,
            vooPerfil.final === 'compacto' ? styles.perfilViajanteCompactando : styles.perfilViajanteExpandindo,
            vooPerfil.iniciou && styles.perfilViajanteEmCurso,
            vooPerfil.finalizando && styles.perfilViajanteFinalizando,
          )}
          style={{
            left: vooPerfil.iniciou ? vooPerfil.destino.left : vooPerfil.origem.left,
            top: vooPerfil.iniciou ? vooPerfil.destino.top : vooPerfil.origem.top,
            width: vooPerfil.iniciou ? vooPerfil.destino.width : vooPerfil.origem.width,
            height: vooPerfil.iniciou ? vooPerfil.destino.height : vooPerfil.origem.height,
          }}
        >
          <span className={styles.perfilViajanteFundo}>
            {perfil?.backgroundUrl ? <span style={{ backgroundImage: `url(${perfil.backgroundUrl})` }} /> : null}
          </span>
          <span className={styles.perfilViajanteAvatar}>
            {perfil?.avatarUrl
              ? <span style={{ backgroundImage: `url(${perfil.avatarUrl})` }} />
              : <span>{inicial}</span>}
          </span>
          <span className={styles.perfilViajanteTexto}>
            <small>Perfil</small>
            <strong>{perfil?.nome || 'Perfil'}</strong>
            {perfil?.descricao ? <em>{perfil.descricao}</em> : null}
          </span>
        </div>,
        document.body,
      ) : null}
    </header>
  )
}
