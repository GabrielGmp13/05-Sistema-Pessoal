'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, CalendarRange, Code2, Dumbbell, FolderKanban, GraduationCap, Home, Languages, NotebookTabs } from 'lucide-react'
import type { CSSProperties } from 'react'

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
  const { decoracao, corAmbiente } = useTema()
  const pathname = usePathname()
  const ocultarNavegacao = pathname === '/login'

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

  return (
    <header
      className={cn(styles.header, usaTelaInteira(pathname) && styles.headerTelaInteira)}
      style={estiloAtmosfera}
    >
      <div className={styles.barra}>
        <span aria-hidden="true" className={cn(styles.fragmentos, classesDecoracao[decoracao])}>
          {particulas.map((style, indice) => <i key={indice} style={style} />)}
        </span>

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
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
