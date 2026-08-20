'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'claro' | 'suave' | 'escuro'

interface TemaContextValue {
  tema: Tema
  definirTema: (tema: Tema) => void
}

const TemaContext = createContext<TemaContextValue | null>(null)
const CHAVE_STORAGE = 'sistema-pessoal:tema'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('claro')

  useEffect(() => {
    const valorSalvo = localStorage.getItem(CHAVE_STORAGE)
    const salvo = valorSalvo === 'claro' || valorSalvo === 'suave' || valorSalvo === 'escuro'
      ? valorSalvo
      : null
    const preferencia =
      salvo ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')
    setTema(preferencia)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    document.documentElement.classList.toggle('soft', tema === 'suave')
  }, [tema])

  function definirTema(proximo: Tema) {
    localStorage.setItem(CHAVE_STORAGE, proximo)
    setTema(proximo)
  }

  return <TemaContext.Provider value={{ tema, definirTema }}>{children}</TemaContext.Provider>
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <ThemeProvider>')
  return ctx
}
