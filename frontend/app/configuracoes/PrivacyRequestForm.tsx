'use client'

import { useState } from 'react'
import { Download, Loader2, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DELETE_CONFIRMATION, type PrivacyRequestType } from '@/lib/privacy-request'

export function PrivacyRequestForm() {
  const [confirmation, setConfirmation] = useState('')
  const [sending, setSending] = useState<PrivacyRequestType | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function send(tipo: PrivacyRequestType) {
    setSending(tipo); setMessage(''); setError('')
    try {
      const response = await fetch('/api/privacidade/solicitacoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, confirmacao: confirmation }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.erro || 'Não foi possível registrar a solicitação.')
      setConfirmation('')
      setMessage(`Solicitação registrada. Guarde o protocolo ${result.protocolo}. Ela também aparecerá em “Meus pedidos”.`)
      window.dispatchEvent(new Event('support-refresh'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a solicitação.')
    } finally { setSending(null) }
  }

  return (
    <Card className="mt-8 gap-6 p-5 sm:p-6" aria-labelledby="privacy-requests-title">
      <header className="space-y-2">
        <h2 id="privacy-requests-title" className="text-xl font-semibold">Seus dados e sua conta</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Os pedidos recebem protocolo e passam por confirmação de identidade. Registrar um pedido não apaga nada imediatamente.</p>
      </header>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Download className="size-4" />Pedir cópia dos meus dados</h3>
        <p className="text-sm text-muted-foreground">Solicita uma cópia possível das informações vinculadas à conta.</p>
        <Button type="button" variant="outline" disabled={sending !== null} onClick={() => void send('copia')}>
          {sending === 'copia' ? <Loader2 className="animate-spin" /> : null}Gerar protocolo de cópia
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-destructive/40 p-4">
        <h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-4 text-destructive" />Pedir exclusão da conta</h3>
        <p className="text-sm text-muted-foreground">Este pedido será analisado antes da exclusão. Para evitar acidentes, digite a frase abaixo exatamente como aparece.</p>
        <div className="space-y-2">
          <Label htmlFor="delete-account-confirmation">Digite: {DELETE_CONFIRMATION}</Label>
          <Input id="delete-account-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
        </div>
        <Button type="button" variant="destructive" disabled={sending !== null || confirmation !== DELETE_CONFIRMATION} onClick={() => void send('exclusao')}>
          {sending === 'exclusao' ? <Loader2 className="animate-spin" /> : null}Gerar protocolo de exclusão
        </Button>
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-success">{message}</p> : null}
    </Card>
  )
}
