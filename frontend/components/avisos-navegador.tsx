'use client'

import { useEffect, useRef, useState } from 'react'

interface AvisoNavegadorProps {
  chave: string
  titulo: string
  corpo: string
  pronto: boolean
  disparador: string | number | null
}

const CHAVE_STORAGE = 'sistema-pessoal:avisos-navegador:'

/**
 * Notificações são sempre opt-in e só podem ser emitidas enquanto esta aba
 * continuar aberta. O navegador pode suspender timers ou recusá-las.
 */
export function AvisoNavegador({ chave, titulo, corpo, pronto, disparador }: AvisoNavegadorProps) {
  const [ativo, setAtivo] = useState(false)
  const [erro, setErro] = useState('')
  const ultimoDisparo = useRef<string | number | null>(null)
  const storageKey = `${CHAVE_STORAGE}${chave}`

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const inicio = window.setTimeout(() => {
      setAtivo(window.localStorage.getItem(storageKey) === 'ativo' && Notification.permission === 'granted')
    }, 0)
    return () => window.clearTimeout(inicio)
  }, [storageKey])

  async function ativar() {
    if (typeof Notification === 'undefined') {
      setErro('Este navegador não oferece avisos do sistema.')
      return
    }
    const permissao = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
    if (permissao !== 'granted') {
      setErro('Permissão de aviso não concedida. O aviso na página continua disponível.')
      return
    }
    window.localStorage.setItem(storageKey, 'ativo')
    setErro('')
    setAtivo(true)
  }

  function desativar() {
    window.localStorage.removeItem(storageKey)
    setAtivo(false)
  }

  useEffect(() => {
    if (!ativo || !pronto || disparador === null || typeof Notification === 'undefined') return
    const avisarSePossivel = () => {
      if (document.visibilityState !== 'hidden' || Notification.permission !== 'granted' || ultimoDisparo.current === disparador) return
      ultimoDisparo.current = disparador
      new Notification(titulo, { body: corpo, tag: `sistema-pessoal-${chave}` })
    }
    avisarSePossivel()
    const intervalo = window.setInterval(avisarSePossivel, 15_000)
    document.addEventListener('visibilitychange', avisarSePossivel)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', avisarSePossivel)
    }
  }, [ativo, chave, corpo, disparador, pronto, titulo])

  return <div className="mt-3 text-xs text-muted-foreground">
    <button type="button" className="underline underline-offset-2" onClick={() => void (ativo ? desativar() : ativar())}>
      {ativo ? 'Desativar avisos do navegador' : 'Ativar avisos do navegador'}
    </button>
    <p className="mt-1">Funciona enquanto esta página estiver aberta e somente se o navegador permitir. Não garante som, fone ou comportamento igual em todos os celulares.</p>
    {erro ? <p role="status" className="mt-1">{erro}</p> : null}
  </div>
}
