'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type PersonalRailContextValue = {
  aberto: boolean
  fechar: () => void
  alternar: () => void
}

const PersonalRailContext = createContext<PersonalRailContextValue | null>(null)

export function PersonalRailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setAberto(false), 0)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    const telaCompacta = window.matchMedia('(max-width: 1480px)')
    const fecharAoAmpliar = () => {
      if (!telaCompacta.matches) setAberto(false)
    }
    telaCompacta.addEventListener('change', fecharAoAmpliar)
    return () => telaCompacta.removeEventListener('change', fecharAoAmpliar)
  }, [])

  useEffect(() => {
    if (!aberto) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto])

  const valor = useMemo(() => ({
    aberto,
    fechar: () => setAberto(false),
    alternar: () => setAberto((atual) => !atual),
  }), [aberto])

  return <PersonalRailContext.Provider value={valor}>{children}</PersonalRailContext.Provider>
}

export function usePersonalRail() {
  const contexto = useContext(PersonalRailContext)
  if (!contexto) throw new Error('usePersonalRail deve ser usado dentro de PersonalRailProvider')
  return contexto
}
