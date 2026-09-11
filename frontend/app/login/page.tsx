'use client'

import Link from 'next/link'
import { useCallback, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'
import { TurnstileWidget, turnstileEnabled } from '@/components/TurnstileWidget'

const signupEnabled = process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED === 'true'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaReset, setCaptchaReset] = useState(0)
  const router = useRouter()
  const atualizarCaptcha = useCallback((token: string | null) => setCaptchaToken(token), [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setErro(null); setMensagem(null)
    if (mode === 'signup' && senha !== confirmacao) { setErro('As senhas não são iguais.'); return }
    if (senha.length < 12) { setErro('Use uma senha com pelo menos 12 caracteres.'); return }
    if (turnstileEnabled && !captchaToken) { setErro('Conclua a verificação contra robôs.'); return }
    setCarregando(true)
    if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: `${window.location.origin}/auth/confirm`, captchaToken: captchaToken ?? undefined } })
      setCarregando(false)
      if (error) { setCaptchaReset((value) => value + 1); setErro('Não foi possível criar a conta. Confira os dados ou tente mais tarde.'); return }
      if (data.session) { router.push('/'); router.refresh(); return }
      setMensagem('Conta solicitada. Confira seu e-mail para confirmar o cadastro.'); return
    }
    const { error } = await sb.auth.signInWithPassword({ email, password: senha, options: { captchaToken: captchaToken ?? undefined } })
    setCarregando(false)
    if (error) { setCaptchaReset((value) => value + 1); setErro('E-mail ou senha incorretos.'); return }
    router.push('/'); router.refresh()
  }

  async function entrarComGoogle() {
    setErro(null); setMensagem(null); setCarregando(true)
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (error) {
      setCarregando(false)
      setErro('Não foi possível iniciar o login com Google. Tente novamente mais tarde.')
    }
  }

  return <div className="login-container"><form onSubmit={handleSubmit} className="login-form">
    <h1>Sistema Pessoal</h1>
    <p className="login-intro">{mode === 'signup' ? 'Crie sua conta pessoal.' : 'Entre na sua conta.'}</p>
    <label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
    <label htmlFor="senha">Senha</label><input id="senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required minLength={12} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
    {mode === 'signup' ? <><label htmlFor="confirmacao">Confirme a senha</label><input id="confirmacao" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} required minLength={12} autoComplete="new-password" /></> : null}
    <TurnstileWidget onTokenChange={atualizarCaptcha} resetKey={captchaReset} />
    {erro ? <p className="erro" role="alert">{erro}</p> : null}{mensagem ? <p className="login-ok" role="status">{mensagem}</p> : null}
    <button type="submit" disabled={carregando || (turnstileEnabled && !captchaToken)} className="btn-salvar">{carregando ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</button>
    {mode === 'login' ? <><div className="login-divider" aria-hidden="true"><span>ou</span></div><button type="button" className="login-google" onClick={() => void entrarComGoogle()} disabled={carregando}><span aria-hidden="true">G</span>Entrar com Google</button></> : null}
    {mode === 'login' ? <Link href="/recuperar-senha" className="login-link">Esqueci minha senha</Link> : null}
    <Link href="/ajuda" className="login-link">Dúvidas frequentes</Link>
    <Link href="/privacidade" className="login-link">Privacidade</Link>
    <Link href="/termos" className="login-link">Termos de uso</Link>
    {signupEnabled ? <button type="button" className="login-secondary" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErro(null); setMensagem(null); setCaptchaReset((value) => value + 1) }}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</button> : <p className="login-note">Novas contas são liberadas manualmente por Gabriel.</p>}
  </form></div>
}
