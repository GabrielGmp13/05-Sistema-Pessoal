'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Brain, CalendarDays, Dumbbell, FolderKanban, GraduationCap, Home, LogOut, NotebookTabs } from 'lucide-react'
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
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/diario', label: 'Diário', icon: NotebookTabs },
]

const rotasDiario = ['/diario', '/saude', '/financas', '/lugares', '/receitas']

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/diario') {
    return rotasDiario.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  }
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

    window.addEventListener('perfil-atualizado', carregarPerfil)

    return () => {
      ativo = false
      window.removeEventListener('perfil-atualizado', carregarPerfil)
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
    <header className={styles.header}>
      <div className={styles.barra}>
        <span aria-hidden="true" className={styles.perfilRastro} />
        <span aria-hidden="true" className={styles.fragmentos}>
          {Array.from({ length: 15 }, (_, indice) => <i key={indice} />)}
        </span>
        <Link
          href="/configuracoes"
          className={styles.perfil}
          aria-label={`Abrir configurações do perfil de ${perfil?.nome || 'usuário'}`}
          title="Configurações do perfil"
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
        </Link>

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
    </header>
  )
}
