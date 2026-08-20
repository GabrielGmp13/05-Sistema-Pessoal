'use client'

import { CloudSun, Moon, Sun } from 'lucide-react'
import { useTema, type Tema } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { tema, definirTema } = useTema()
  const temas: Array<{ valor: Tema; label: string; icon: typeof Sun }> = [
    { valor: 'claro', label: 'Claro', icon: Sun },
    { valor: 'suave', label: 'Suave', icon: CloudSun },
    { valor: 'escuro', label: 'Escuro', icon: Moon },
  ]

  return (
    <div
      role="group"
      aria-label="Escolher tema"
      className={cn(
        'flex shrink-0 items-center rounded-lg border border-border bg-card p-0.5 text-foreground shadow-sm',
        className,
      )}
    >
      {temas.map(({ valor, label, icon: Icon }) => (
        <button
          key={valor}
          type="button"
          onClick={() => definirTema(valor)}
          aria-label={`Ativar tema ${label.toLowerCase()}`}
          aria-pressed={tema === valor}
          title={`Tema ${label}`}
          className={cn(
            'flex size-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tema === valor ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
