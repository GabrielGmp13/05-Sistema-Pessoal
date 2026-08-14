'use client'

import { Moon, Sun } from 'lucide-react'
import { useTema } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { tema, alternarTema } = useTema()

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {tema === 'claro' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
