'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, Dumbbell, GraduationCap, Home, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getSession, sb } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import styles from './GlobalNav.module.css'

const links = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/treino', label: 'Treino', icon: Dumbbell },
  { href: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/estudos', label: 'Estudos', icon: GraduationCap },
  { href: '/revisao', label: 'Revisão', icon: Brain },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const ocultarNavegacao = pathname === '/login'
  const [saindo, setSaindo] = useState(false)
  const [perfil, setPerfil] = useState<{
    nome: string
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
        avatarUrl: meta?.avatar_url || null,
        backgroundUrl: meta?.background_url || null,
      })
    }
    void carregarPerfil()
    return () => {
      ativo = false
    }
  }, [ocultarNavegacao])

  if (ocultarNavegacao) return null

  async function handleLogout() {
    setSaindo(true)
    const { error } = await sb.auth.signOut()
    if (error) {
      console.error('Erro ao sair:', error)
    }
    router.replace('/login')
    router.refresh()
  }

  const inicial = perfil?.nome.charAt(0).toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text)] backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/85">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 lg:flex-nowrap lg:py-0">
        <div className={styles.perfil} aria-label={`Perfil de ${perfil?.nome || 'usuário'}`}>
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
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--texto-secundario)] outline-none transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/30 sm:shrink-0 sm:px-2.5',
                  active && 'bg-[var(--accent-wash)] text-[var(--text)]',
                )}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={saindo}
          className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 text-sm font-medium text-[var(--texto-secundario)] outline-none transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-4" />
          <span>{saindo ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </header>
  )
}
