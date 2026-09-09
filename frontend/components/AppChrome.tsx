'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { RightRail } from './RightRail'
import { cn } from '@/lib/utils'
import { isUnauthenticatedPage } from '@/lib/route-access'
import { usePersonalRail } from './PersonalRailProvider'
import styles from './AppChrome.module.css'

const ROTAS_DE_FOCO = [
  '/login',
  '/revisao/sessao',
  '/estudos/enem/gabarito',
]

function deveUsarTelaInteira(pathname: string) {
  return isUnauthenticatedPage(pathname) || ROTAS_DE_FOCO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const biblioteca = pathname === '/biblioteca' || pathname.startsWith('/biblioteca/')
  const {
    aberto: painelMovelAberto,
    compacto: layoutCompacto,
    fechar: fecharPainelMovel,
  } = usePersonalRail()

  if (deveUsarTelaInteira(pathname)) {
    return <>{children}</>
  }

  return (
    <div className={cn(styles.shell, biblioteca && styles.shellBiblioteca)}>
      <div className={styles.ambiente} aria-hidden="true" />
      {painelMovelAberto ? (
        <button
          type="button"
          className={cn(styles.fundoPainelMovel, styles.fundoPainelMovelVisivel)}
          aria-label="Fechar coluna pessoal"
          onClick={fecharPainelMovel}
        />
      ) : null}
      <RightRail
        recolhendo={biblioteca && !painelMovelAberto}
        movelAberto={painelMovelAberto}
        ocultoAcessibilidade={layoutCompacto && !painelMovelAberto}
      />
      <div className={cn(styles.conteudo, biblioteca && styles.conteudoBiblioteca)}>{children}</div>
    </div>
  )
}
