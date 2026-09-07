'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { sb } from '@/lib/supabase'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true)
    await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/confirm?next=/nova-senha` })
    setLoading(false); setSent(true)
  }
  return <div className="login-container"><form onSubmit={submit} className="login-form"><h1>Recuperar senha</h1><p className="login-intro">Informe o e-mail da conta. Por segurança, a resposta é igual mesmo quando o endereço não existe.</p><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />{sent ? <p className="login-ok" role="status">Se houver uma conta, enviaremos as instruções de recuperação.</p> : null}<button type="submit" className="btn-salvar" disabled={loading}>{loading ? 'Enviando...' : 'Enviar instruções'}</button><Link href="/login" className="login-link">Voltar para entrar</Link></form></div>
}
