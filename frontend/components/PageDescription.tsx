'use client'

import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { chaveDescricao } from '@/lib/page-descriptions'
import { cn } from '@/lib/utils'

export function PageDescription({ children, className, textClassName }: {
  children: React.ReactNode
  className?: string
  textClassName?: string
}) {
  const pathname = usePathname()
  return <StoredPageDescription pathname={pathname} className={className} textClassName={textClassName}>{children}</StoredPageDescription>
}

function observarDescricoes(onChange: () => void) {
  window.addEventListener('descricoes-alteradas', onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener('descricoes-alteradas', onChange)
    window.removeEventListener('storage', onChange)
  }
}

function StoredPageDescription({ pathname, children, className, textClassName }: {
  pathname: string
  children: React.ReactNode
  className?: string
  textClassName?: string
}) {
  const oculta = useSyncExternalStore(observarDescricoes, () => {
    try {
      return window.localStorage.getItem(chaveDescricao(pathname)) === '1'
    } catch {
      return false
    }
  }, () => null)

  if (oculta !== false) return null

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      <p className={cn('max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground', textClassName)}>{children}</p>
      <button type="button" className="shrink-0 rounded-sm text-xs font-medium text-primary underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
        try { window.localStorage.setItem(chaveDescricao(pathname), '1') } catch { /* Sem armazenamento, vale até sair da página. */ }
        window.dispatchEvent(new Event('descricoes-alteradas'))
      }}>Não mostrar novamente</button>
    </div>
  )
}
