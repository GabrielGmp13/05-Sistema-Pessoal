'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Dumbbell, GraduationCap, Home, LogOut } from 'lucide-react'
import { useState } from 'react'

import { sb } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/treino', label: 'Treino', icon: Dumbbell },
  { href: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/estudos', label: 'Estudos', icon: GraduationCap },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  if (pathname === '/login') return null

  async function handleLogout() {
    setSaindo(true)
    const { error } = await sb.auth.signOut()
    if (error) {
      console.error('Erro ao sair:', error)
    }
    router.replace('/login')
    router.refresh()
  }

  const biblioteca = pathname.startsWith('/biblioteca')

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text)] backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/85',
        biblioteca && 'bibliotecaTheme',
      )}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--text)] outline-none transition-colors hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/30"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-wash)] text-[var(--accent)]">
            <Home className="size-4" />
          </span>
          <span className="hidden sm:inline">Sistema Pessoal</span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
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
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-[var(--texto-secundario)] outline-none transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/30',
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
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] px-2.5 text-sm font-medium text-[var(--texto-secundario)] outline-none transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-4" />
          <span>{saindo ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </header>
  )
}
