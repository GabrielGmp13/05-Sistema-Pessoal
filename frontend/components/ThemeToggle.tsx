'use client'

import { Moon, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTema } from './ThemeProvider'

export function ThemeToggle() {
  const pathname = usePathname()
  const { tema, alternarTema } = useTema()

  // Biblioteca fica de fora do toggle — tema fixo (DEC-039)
  if (pathname?.startsWith('/biblioteca')) return null

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      className="fixed bottom-4 right-4 z-50 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent"
    >
      {tema === 'claro' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}