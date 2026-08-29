'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

function periodoAtual() {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  fim.setDate(fim.getDate() + (6 - fim.getDay()))
  const iso = (data: Date) => {
    const copia = new Date(data)
    copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset())
    return copia.toISOString().slice(0, 10)
  }
  return { inicio: iso(inicio), fim: iso(fim) }
}

export function CalendarAutoSync() {
  const pathname = usePathname()
  const [conectado, setConectado] = useState(false)
  const sincronizandoRef = useRef(false)

  useEffect(() => {
    let ativo = true
    void fetch('/api/integracoes/google/status', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((status: { conexoes?: { calendar?: { conectado?: boolean } } } | null) => {
        if (ativo) setConectado(Boolean(status?.conexoes?.calendar?.conectado))
      })
      .catch(() => { if (ativo) setConectado(false) })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!conectado || pathname === '/login') return

    async function sincronizar() {
      if (sincronizandoRef.current) return
      sincronizandoRef.current = true
      const periodo = periodoAtual()
      try {
        const consulta = await fetch('/api/integracoes/google/calendar/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(periodo),
        })
        const body = await consulta.json() as { eventos?: Array<{ id: string; acao: string }>; erro?: string }
        if (!consulta.ok) throw new Error(body.erro || 'Falha ao consultar o Google Calendar.')
        const aplicarIds = (body.eventos ?? [])
          .filter((evento) => ['novo', 'atualizar', 'cancelar'].includes(evento.acao))
          .map((evento) => evento.id)
        if (aplicarIds.length > 0) {
          const aplicacao = await fetch('/api/integracoes/google/calendar/import', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...periodo, aplicarIds }),
          })
          if (!aplicacao.ok) throw new Error('Falha ao aplicar mudanças do Google Calendar.')
          window.dispatchEvent(new Event('agenda-atualizada'))
        }
      } catch (error) {
        console.error('Sincronização automática do Google Calendar:', error)
      } finally {
        sincronizandoRef.current = false
      }
    }

    const inicio = window.setTimeout(() => void sincronizar(), 0)
    const intervalo = window.setInterval(() => void sincronizar(), 2 * 60 * 1000)
    const aoRetomar = () => {
      if (document.visibilityState === 'visible') void sincronizar()
    }
    document.addEventListener('visibilitychange', aoRetomar)
    return () => {
      window.clearTimeout(inicio)
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoRetomar)
    }
  }, [conectado, pathname])

  return null
}
