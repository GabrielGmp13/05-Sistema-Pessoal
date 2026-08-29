'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, CalendarRange, ChevronDown, Code2, Dumbbell, FolderKanban, GraduationCap, Home, Languages, LogOut, Mail, NotebookTabs, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'

import { getSession, getSignedUrl, sb } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { useTema, type Decoracao } from './ThemeProvider'
import styles from './GlobalNav.module.css'

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

const particulas = Array.from({ length: 56 }, (_, indice) => {
  const progresso = ((indice * 37) % 101) / 100
  const esquerda = 3 + Math.pow(progresso, 1.7) * 94
  const proximidadeDoPerfil = 1 - esquerda / 140

  return {
    left: `${esquerda}%`,
    top: `${5 + ((indice * 43) % 82)}%`,
    width: `${7 + ((indice * 11) % 13)}px`,
    height: `${4 + ((indice * 7) % 8)}px`,
    opacity: Math.max(0.16, 0.6 * proximidadeDoPerfil),
    '--petala-rotacao': `${-68 + ((indice * 37) % 136)}deg`,
    '--petala-deslocamento': `${2 + (indice % 4)}px`,
    '--petala-atraso': `${-(indice % 9) * 0.31}s`,
  } as CSSProperties
})

const classesDecoracao: Record<Decoracao, string> = {
  primavera: styles.primavera,
  verao: styles.verao,
  outono: styles.outono,
  inverno: styles.inverno,
  nenhum: styles.nenhum,
}

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
  const { decoracao, corAmbiente, definirCorAmbiente } = useTema()
  const pathname = usePathname()
  const router = useRouter()
  const ocultarNavegacao = pathname === '/login'
  const biblioteca = pathname === '/biblioteca' || pathname.startsWith('/biblioteca/')
  const [saindo, setSaindo] = useState(false)
  const [painelAberto, setPainelAberto] = useState<'perfil' | 'tema' | null>(null)
  const perfilAreaRef = useRef<HTMLDivElement>(null)
  const perfilBotaoRef = useRef<HTMLButtonElement>(null)
  const navegacaoPendenteRef = useRef<{
    pathname: string
    concluir: () => void
    timeout: number
  } | null>(null)
  const [perfil, setPerfil] = useState<{
    nome: string
    descricao: string | null
    email: string | null
    avatarUrl: string | null
    backgroundUrl: string | null
  } | null>(null)

  useEffect(() => {
    if (!biblioteca) return

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
  }, [biblioteca])

  useEffect(() => {
    const timeout = window.setTimeout(() => setPainelAberto(null), 0)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    const pendente = navegacaoPendenteRef.current
    if (!pendente || pendente.pathname !== pathname) return
    window.clearTimeout(pendente.timeout)
    pendente.concluir()
    navegacaoPendenteRef.current = null
  }, [pathname])

  useEffect(() => () => {
    const pendente = navegacaoPendenteRef.current
    if (!pendente) return
    window.clearTimeout(pendente.timeout)
    pendente.concluir()
  }, [])

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

  function navegarComTransicao(event: ReactMouseEvent<HTMLAnchorElement>, destino: string) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || pathname === destino
    ) return

    const documento = document as Document & {
      startViewTransition?: (atualizar: () => Promise<void>) => { finished: Promise<void> }
    }
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!documento.startViewTransition || reduzirMovimento) return

    event.preventDefault()
    const anterior = navegacaoPendenteRef.current
    if (anterior) {
      window.clearTimeout(anterior.timeout)
      anterior.concluir()
    }

    let concluir!: () => void
    const paginaAtualizada = new Promise<void>((resolve) => { concluir = resolve })
    const timeout = window.setTimeout(concluir, 1800)
    navegacaoPendenteRef.current = { pathname: destino, concluir, timeout }

    try {
      documento.startViewTransition(async () => {
        router.push(destino)
        await paginaAtualizada
      })
    } catch {
      window.clearTimeout(timeout)
      navegacaoPendenteRef.current = null
      router.push(destino)
    }
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
      <div className={cn(styles.barra, biblioteca && styles.barraBiblioteca)}>
        {biblioteca ? (
          <span
            aria-hidden="true"
            className={cn(styles.perfilRastro, perfil?.backgroundUrl && styles.perfilRastroComImagem)}
          />
        ) : null}
        <span aria-hidden="true" className={cn(styles.fragmentos, classesDecoracao[decoracao])}>
          {particulas.map((style, indice) => <i key={indice} style={style} />)}
        </span>

        {biblioteca ? (
          <div ref={perfilAreaRef} className={styles.perfilArea}>
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

        <nav aria-label="Navegação principal" className={styles.navegacao}>
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
                onClick={(event) => navegarComTransicao(event, link.href)}
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
    </header>
  )
}
