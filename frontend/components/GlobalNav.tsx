'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, CalendarRange, ChevronDown, Code2, Dumbbell, FolderKanban, GraduationCap, Home, Languages, LogOut, Mail, NotebookTabs, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { getSession, sb } from '@/lib/supabase'
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

const rotasDiario = ['/diario', '/saude', '/financas', '/lugares', '/receitas']

const particulas = Array.from({ length: 52 }, (_, indice) => {
  const esquerda = 7 + ((indice * 71) % 91)
  const proximidadeDoPerfil = 1 - esquerda / 140

  return {
    left: `${esquerda}%`,
    top: `${5 + ((indice * 43) % 82)}%`,
    width: `${7 + ((indice * 11) % 13)}px`,
    height: `${4 + ((indice * 7) % 8)}px`,
    opacity: Math.max(0.17, 0.62 * proximidadeDoPerfil),
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
  noite: styles.noite,
  nenhum: styles.nenhum,
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/diario') {
    return rotasDiario.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function GlobalNav() {
  const { decoracao, corAmbiente, definirCorAmbiente } = useTema()
  const pathname = usePathname()
  const router = useRouter()
  const ocultarNavegacao = pathname === '/login'
  const [saindo, setSaindo] = useState(false)
  const [painelAberto, setPainelAberto] = useState<'perfil' | 'tema' | null>(null)
  const perfilAreaRef = useRef<HTMLDivElement>(null)
  const perfilBotaoRef = useRef<HTMLButtonElement>(null)
  const [perfil, setPerfil] = useState<{
    nome: string
    descricao: string | null
    email: string | null
    avatarUrl: string | null
    backgroundUrl: string | null
  } | null>(null)

  useEffect(() => {
    if (ocultarNavegacao) return

    let ativo = true
    async function carregarPerfil() {
      const session = await getSession()
      if (!ativo) return
      const meta = session?.user.user_metadata
      setPerfil({
        nome: meta?.full_name || meta?.name || session?.user.email?.split('@')[0] || 'Usuário',
        descricao: meta?.subtitle || null,
        email: session?.user.email || null,
        avatarUrl: meta?.avatar_url || null,
        backgroundUrl: meta?.background_url || null,
      })
    }
    void carregarPerfil()

    window.addEventListener('perfil-atualizado', carregarPerfil)

    return () => {
      ativo = false
      window.removeEventListener('perfil-atualizado', carregarPerfil)
    }
  }, [ocultarNavegacao])

  useEffect(() => {
    const timeout = window.setTimeout(() => setPainelAberto(null), 0)
    return () => window.clearTimeout(timeout)
  }, [pathname])

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

  const inicial = perfil?.nome.charAt(0).toUpperCase() || 'U'
  const estiloAtmosfera = {
    '--cor-ambiente': corAmbiente || 'var(--ambient-fallback)',
  } as CSSProperties
  return (
    <header className={styles.header}>
      <div className={styles.barra} style={estiloAtmosfera}>
        <span
          aria-hidden="true"
          className={cn(styles.perfilRastro, perfil?.backgroundUrl && styles.perfilRastroComImagem)}
        />
        <span
          aria-hidden="true"
          className={cn(styles.fragmentos, classesDecoracao[decoracao], perfil?.backgroundUrl && styles.fragmentosComImagem)}
        >
          {particulas.map((style, indice) => <i key={indice} style={style} />)}
        </span>
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
                <img src={perfil.avatarUrl} alt="" className={styles.avatarImagem} />
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
                  {perfil?.avatarUrl ? <img src={perfil.avatarUrl} alt="" className={styles.avatarImagem} /> : <span aria-hidden="true">{inicial}</span>}
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
                    {corAmbiente ? (
                      <button type="button" onClick={() => definirCorAmbiente(null)}>Restaurar</button>
                    ) : null}
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

        <nav
          aria-label="Navegação principal"
          className={styles.navegacao}
        >
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
                className={cn(
                  styles.link,
                  active && styles.linkAtivo,
                )}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.acoes}>
          <ThemeToggle
            className={styles.tema}
            open={painelAberto === 'tema'}
            onOpenChange={(open) => setPainelAberto(open ? 'tema' : null)}
          />
          <button
            type="button"
            onClick={handleLogout}
            disabled={saindo}
            className={styles.sair}
          >
            <LogOut className="size-4" />
            <span>{saindo ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
