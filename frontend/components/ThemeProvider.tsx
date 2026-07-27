'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'

interface TemaContextValue {
  tema: Tema
  alternarTema: () => void
}

const TemaContext = createContext<TemaContextValue | null>(null)
const CHAVE_STORAGE = 'sistema-pessoal:tema'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('claro')

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_STORAGE) as Tema | null
    const preferencia =
      salvo ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')
    setTema(preferencia)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
  }, [tema])

  function alternarTema() {
    setTema((atual) => {
      const proximo = atual === 'claro' ? 'escuro' : 'claro'
      localStorage.setItem(CHAVE_STORAGE, proximo)
      return proximo
    })
  }

  return <TemaContext.Provider value={{ tema, alternarTema }}>{children}</TemaContext.Provider>
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <ThemeProvider>')
  return ctx
}