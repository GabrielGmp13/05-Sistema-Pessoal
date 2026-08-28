'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { RightRail } from './RightRail'
import styles from './AppChrome.module.css'

const ROTAS_FOCO = [
  '/login',
  '/revisao/sessao',
  '/estudos/enem/gabarito',
]

function deveUsarTelaInteira(pathname: string) {
  return ROTAS_FOCO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (deveUsarTelaInteira(pathname)) {
    return <>{children}</>
  }

  return (
    <div className={styles.shell}>
      <div className={styles.ambiente} aria-hidden="true" />
      <RightRail />
      <div className={styles.conteudo}>{children}</div>
    </div>
  )
}
