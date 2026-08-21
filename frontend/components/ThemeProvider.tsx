'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'claro' | 'suave' | 'nublado' | 'estrelado' | 'escuro'
export type Decoracao = 'primavera' | 'verao' | 'outono' | 'inverno' | 'noite' | 'nenhum'

interface TemaContextValue {
  tema: Tema
  definirTema: (tema: Tema) => void
  decoracao: Decoracao
  definirDecoracao: (decoracao: Decoracao) => void
  corAmbiente: string | null
  definirCorAmbiente: (cor: string | null) => void
}

const TemaContext = createContext<TemaContextValue | null>(null)
const CHAVE_STORAGE = 'sistema-pessoal:tema'
const CHAVE_DECORACAO = 'sistema-pessoal:decoracao'
const CHAVE_COR_AMBIENTE = 'sistema-pessoal:cor-ambiente'
const COR_HEX = /^#[0-9a-f]{6}$/i

function isDecoracao(valor: string | null): valor is Decoracao {
  return valor === 'primavera' || valor === 'verao' || valor === 'outono' ||
    valor === 'inverno' || valor === 'noite' || valor === 'nenhum'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>('claro')
  const [decoracao, setDecoracao] = useState<Decoracao>('primavera')
  const [corAmbiente, setCorAmbiente] = useState<string | null>(null)

  useEffect(() => {
    const valorSalvo = localStorage.getItem(CHAVE_STORAGE)
    const salvo = valorSalvo === 'claro' || valorSalvo === 'suave' ||
      valorSalvo === 'nublado' || valorSalvo === 'estrelado' || valorSalvo === 'escuro'
      ? valorSalvo
      : null
    const preferencia =
      salvo ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')
    // Reconcilia o estado React com a classe aplicada pelo script anti-flash.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTema(preferencia)

    const decoracaoSalva = localStorage.getItem(CHAVE_DECORACAO)
    const corSalva = localStorage.getItem(CHAVE_COR_AMBIENTE)
    // Reconcilia as preferências locais com o script anti-flash.
    setDecoracao(isDecoracao(decoracaoSalva) ? decoracaoSalva : 'primavera')
    setCorAmbiente(corSalva && COR_HEX.test(corSalva) ? corSalva : null)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro' || tema === 'estrelado')
    document.documentElement.classList.toggle('soft', tema === 'suave')
    document.documentElement.classList.toggle('cloudy', tema === 'nublado')
    document.documentElement.classList.toggle('starry', tema === 'estrelado')
  }, [tema])

  useEffect(() => {
    document.documentElement.dataset.decoracao = decoracao
  }, [decoracao])

  useEffect(() => {
    if (corAmbiente) document.documentElement.style.setProperty('--ambient-color', corAmbiente)
    else document.documentElement.style.removeProperty('--ambient-color')
  }, [corAmbiente])

  function definirTema(proximo: Tema) {
    localStorage.setItem(CHAVE_STORAGE, proximo)
    setTema(proximo)
  }

  function definirDecoracao(proxima: Decoracao) {
    localStorage.setItem(CHAVE_DECORACAO, proxima)
    setDecoracao(proxima)
  }

  function definirCorAmbiente(proxima: string | null) {
    const normalizada = proxima?.trim() || null
    if (normalizada && !COR_HEX.test(normalizada)) return
    if (normalizada) localStorage.setItem(CHAVE_COR_AMBIENTE, normalizada)
    else localStorage.removeItem(CHAVE_COR_AMBIENTE)
    setCorAmbiente(normalizada)
  }

  return (
    <TemaContext.Provider value={{
      tema,
      definirTema,
      decoracao,
      definirDecoracao,
      corAmbiente,
      definirCorAmbiente,
    }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <ThemeProvider>')
  return ctx
}
