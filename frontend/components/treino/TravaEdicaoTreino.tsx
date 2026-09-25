'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { getUserId, sb } from '@/lib/supabase'

/** Mantém exclusão mútua antes de montar a tela que lê/grava o rascunho. */
export function TravaEdicaoTreino({ treinoUuid, children }: { treinoUuid: string; children: ReactNode }) {
  const [estado, setEstado] = useState<{ chave: string; liberado: boolean; mensagem: string }>({ chave: '', liberado: false, mensagem: 'Conferindo a sessão de treino…' })
  useEffect(() => {
    let cancelado = false
    let dono: string | null = null
    let liberar: (() => void) | undefined
    const subscription = sb.auth.onAuthStateChange((_evento, sessao) => {
      if (dono && sessao?.user.id !== dono) {
        cancelado = true
        liberar?.()
        setEstado({ chave: treinoUuid, liberado: false, mensagem: 'A conta mudou. Recarregue para entrar no treino com a conta atual.' })
      }
    }).data.subscription
    async function adquirir() {
      try {
        dono = await getUserId()
        if (cancelado) return
        if (!dono) {
          setEstado({ chave: treinoUuid, liberado: false, mensagem: 'Entre na sua conta e recarregue o treino.' })
          return
        }
        if (!navigator.locks) {
          setEstado({ chave: treinoUuid, liberado: false, mensagem: 'Este navegador não oferece a proteção necessária para editar o treino. Use um navegador atualizado.' })
          return
        }
        await navigator.locks.request(`treino:edicao:${dono}:${treinoUuid}`, { ifAvailable: true }, async (lock) => {
          if (cancelado) return
          if (!lock) {
            setEstado({ chave: treinoUuid, liberado: false, mensagem: 'Este treino está aberto em outra aba. Continue nela ou feche-a e recarregue esta página.' })
            return
          }
          await new Promise<void>((resolve) => {
            liberar = resolve
            setEstado({ chave: treinoUuid, liberado: true, mensagem: '' })
          })
        })
      } catch {
        if (!cancelado) setEstado({ chave: treinoUuid, liberado: false, mensagem: 'Não foi possível proteger esta sessão. Recarregue antes de editar.' })
      }
    }
    void adquirir()
    return () => { cancelado = true; liberar?.(); subscription.unsubscribe() }
  }, [treinoUuid])
  if (estado.chave === treinoUuid && estado.liberado) return children
  return <main className="mx-auto max-w-xl p-6"><h1 className="text-xl font-semibold">Sessão de treino</h1><p role="status" className="mt-3">{estado.chave === treinoUuid ? estado.mensagem : 'Conferindo a sessão de treino…'}</p><button className="mt-4 rounded-md border border-border px-3 py-2" onClick={() => window.location.reload()}>Recarregar</button></main>
}
