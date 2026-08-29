'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { RightRail } from './RightRail'
import { cn } from '@/lib/utils'
import styles from './AppChrome.module.css'

const ROTAS_DE_FOCO = [
  '/login',
  '/revisao/sessao',
  '/estudos/enem/gabarito',
]

function deveUsarTelaInteira(pathname: string) {
  return ROTAS_DE_FOCO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const biblioteca = pathname === '/biblioteca' || pathname.startsWith('/biblioteca/')

  if (deveUsarTelaInteira(pathname)) {
    return <>{children}</>
  }

  return (
    <div className={cn(styles.shell, biblioteca && styles.shellBiblioteca)}>
      <div className={styles.ambiente} aria-hidden="true" />
      <RightRail recolhendo={biblioteca} />
      <div className={cn(styles.conteudo, biblioteca && styles.conteudoBiblioteca)}>{children}</div>
    </div>
  )
}
