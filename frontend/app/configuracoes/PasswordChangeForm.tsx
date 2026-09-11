'use client'

import { useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sb } from '@/lib/supabase'

export function PasswordChangeForm() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function alterarSenha(event: React.FormEvent) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    if (novaSenha.length < 12) {
      setErro('Use uma nova senha com pelo menos 12 caracteres.')
      return
    }
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não corresponde à nova senha.')
      return
    }
    if (novaSenha === senhaAtual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }

    setSalvando(true)
    const { error } = await sb.auth.updateUser({
      password: novaSenha,
      current_password: senhaAtual,
    })
    setSalvando(false)
    if (error) {
      setErro('Não foi possível alterar a senha. Confira a senha atual e tente novamente.')
      return
    }
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    setMensagem('Senha alterada. Use a nova senha no próximo acesso.')
  }

  return (
    <Card className="mt-6 p-5">
      <div className="mb-5 flex items-start gap-3">
        <KeyRound aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div>
          <h2 className="font-semibold">Alterar senha</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ao receber uma senha temporária, troque-a aqui antes de guardar dados pessoais.</p>
        </div>
      </div>
      <form onSubmit={alterarSenha} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="senha-atual">Senha atual</Label>
          <Input id="senha-atual" type="password" value={senhaAtual} onChange={(event) => setSenhaAtual(event.target.value)} minLength={12} autoComplete="current-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nova-senha-config">Nova senha</Label>
          <Input id="nova-senha-config" type="password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} minLength={12} autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar-senha-config">Confirmar nova senha</Label>
          <Input id="confirmar-senha-config" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} minLength={12} autoComplete="new-password" required />
        </div>
        <div className="sm:col-span-3">
          {erro ? <p role="alert" className="mb-3 text-sm text-destructive">{erro}</p> : null}
          {mensagem ? <p role="status" className="mb-3 text-sm text-success">{mensagem}</p> : null}
          <Button type="submit" disabled={salvando}>
            {salvando ? <Loader2 aria-hidden="true" className="animate-spin" /> : <KeyRound aria-hidden="true" />}
            {salvando ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
