'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'

export default function NovaSenhaPage() {
  const [senha, setSenha] = useState(''); const [confirmacao, setConfirmacao] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (senha.length < 12) { setError('Use uma senha com pelo menos 12 caracteres.'); return }
    if (senha !== confirmacao) { setError('As senhas não são iguais.'); return }
    setLoading(true); const { error: updateError } = await sb.auth.updateUser({ password: senha }); setLoading(false)
    if (updateError) { setError('O link expirou ou a sessão não é válida. Solicite uma nova recuperação.'); return }
    router.push('/'); router.refresh()
  }
  return <div className="login-container"><form onSubmit={submit} className="login-form"><h1>Definir nova senha</h1><p className="login-intro">Use pelo menos 12 caracteres e não reutilize uma senha de outro serviço.</p><label htmlFor="senha">Nova senha</label><input id="senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} minLength={12} required autoComplete="new-password" /><label htmlFor="confirmacao">Confirme a senha</label><input id="confirmacao" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} minLength={12} required autoComplete="new-password" />{error ? <p className="erro" role="alert">{error}</p> : null}<button type="submit" className="btn-salvar" disabled={loading}>{loading ? 'Salvando...' : 'Salvar nova senha'}</button></form></div>
}
