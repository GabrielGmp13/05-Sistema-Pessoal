'use client'

import Link from 'next/link'
import { useCallback, useState, type FormEvent } from 'react'
import { sb } from '@/lib/supabase'
import { TurnstileWidget, turnstileEnabled } from '@/components/TurnstileWidget'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); const [captchaReset, setCaptchaReset] = useState(0)
  const atualizarCaptcha = useCallback((token: string | null) => setCaptchaToken(token), [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (turnstileEnabled && !captchaToken) return
    setLoading(true)
    await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/confirm?next=/nova-senha`, captchaToken: captchaToken ?? undefined })
    setLoading(false); setSent(true); setCaptchaReset((value) => value + 1)
  }
  return <div className="login-container"><form onSubmit={submit} className="login-form"><h1>Recuperar senha</h1><p className="login-intro">Informe o e-mail da conta. Por segurança, a resposta é igual mesmo quando o endereço não existe.</p><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /><TurnstileWidget onTokenChange={atualizarCaptcha} resetKey={captchaReset} />{sent ? <p className="login-ok" role="status">Se houver uma conta, enviaremos as instruções de recuperação.</p> : null}<button type="submit" className="btn-salvar" disabled={loading || (turnstileEnabled && !captchaToken)}>{loading ? 'Enviando...' : 'Enviar instruções'}</button><Link href="/login" className="login-link">Voltar para entrar</Link></form></div>
}
