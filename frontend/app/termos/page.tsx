'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase'
import { TERMS_VERSION, hasAcceptedTerms } from '@/lib/terms'

export default function TermosPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [confirmacaoMarcada, setConfirmacaoMarcada] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    void sb.auth.getUser().then(({ data: { user } }) => {
      if (!ativo) return
      setAutenticado(Boolean(user))
      setTermosAceitos(hasAcceptedTerms(user?.user_metadata))
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  async function aceitarTermos() {
    if (!confirmacaoMarcada || salvando || !autenticado) return
    setErro('')
    setSalvando(true)
    try {
    const { error } = await sb.auth.updateUser({
      data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
    })
    if (error) {
      setErro('Não foi possível registrar sua aceitação agora. Tente novamente.')
      return
    }
    const { error: refreshError } = await sb.auth.refreshSession()
    if (refreshError) {
      setErro('A aceitação foi registrada, mas a sessão não pôde ser atualizada. Entre novamente para continuar.')
      return
    }
    setTermosAceitos(true)
    router.replace('/')
    router.refresh()
    } catch {
      setErro('Não foi possível concluir o aceite. Confira sua conexão e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Projeto Pessoal</p>
          <h1 className="text-3xl font-semibold">Termos de uso</h1>
          <p className="text-sm text-muted-foreground">Versão {TERMS_VERSION} · piloto controlado</p>
        </header>

        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Um piloto para uso pessoal e amigos</h2>
          <p className="leading-relaxed text-muted-foreground">O Sistema Pessoal é um piloto gratuito, para uso individual de Gabriel e pessoas convidadas. Não há cadastro público. A conta é pessoal e não deve ser compartilhada.</p>
          <p className="leading-relaxed text-muted-foreground">O piloto pode mudar, ficar indisponível ou ser encerrado para manutenção, segurança ou evolução do projeto. Guarde cópias próprias do que for importante e use a exportação disponível antes de solicitar exclusão.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Uso responsável</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>insira somente dados seus ou dados de terceiros para os quais você tenha autorização;</li>
            <li>não envie senha, token, documento de identidade, dado bancário ou informação sensível em chamados de suporte;</li>
            <li>não tente acessar, alterar ou descobrir dados de outra pessoa, nem usar o serviço para atividades ilegais ou abusivas;</li>
            <li>saúde, diário e finanças são recursos de organização pessoal, não orientação médica, psicológica, jurídica ou financeira.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Dados, integrações e suporte</h2>
          <p className="leading-relaxed text-muted-foreground">O tratamento de dados, fornecedores de infraestrutura, pedidos de cópia/exclusão e prazos de retenção estão explicados no Aviso de privacidade. Integrações externas são opcionais e podem ficar indisponíveis; o cadastro manual continua como alternativa quando houver essa possibilidade.</p>
          <p className="leading-relaxed text-muted-foreground">Bugs e sugestões devem ser enviados pelo canal de suporte do sistema, sem dados sensíveis. Em caso de risco de segurança ou falha grave, novos convites podem ser suspensos enquanto o problema é analisado.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contato e mudanças</h2>
          <p className="leading-relaxed text-muted-foreground">Dúvidas sobre estes termos ou sobre privacidade podem ser enviadas para <a className="text-primary underline underline-offset-4" href="mailto:sistemapessoa007@gmail.com">sistemapessoa007@gmail.com</a>. Uma mudança relevante destes termos exigirá nova aceitação antes de continuar usando a conta.</p>
          <p className="text-sm leading-relaxed text-muted-foreground">Este texto explica o funcionamento do piloto e não substitui orientação jurídica individual.</p>
        </section>

        {carregando ? <p className="text-sm text-muted-foreground">Conferindo sua conta…</p> : null}
        {!carregando && !autenticado ? <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Leia os termos antes de entrar. Ao receber um convite, entre pelo link enviado e confirme sua aceitação nesta página.</p> : null}
        {!carregando && autenticado && !termosAceitos ? (
          <section className="space-y-4 rounded-xl border border-primary/30 bg-card p-5" aria-labelledby="aceite-title">
            <h2 id="aceite-title" className="text-xl font-semibold">Confirme para iniciar</h2>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <input type="checkbox" className="mt-1 size-4" checked={confirmacaoMarcada} onChange={(event) => setConfirmacaoMarcada(event.target.checked)} />
              <span>Li e aceito estes Termos de uso e o <Link href="/privacidade" className="text-primary underline underline-offset-4">Aviso de privacidade</Link>.</span>
            </label>
            {erro ? <p role="alert" className="text-sm text-destructive">{erro}</p> : null}
            <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60" disabled={!confirmacaoMarcada || salvando} onClick={() => void aceitarTermos()}>{salvando ? 'Registrando…' : 'Aceitar e continuar'}</button>
          </section>
        ) : null}
        {!carregando && autenticado && termosAceitos ? <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Você já aceitou esta versão dos termos. <Link href="/" className="text-primary underline underline-offset-4">Ir para o início</Link>.</p> : null}

        <nav className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link href="/login" className="text-primary underline underline-offset-4">Voltar para entrar</Link>
          <Link href="/privacidade" className="text-primary underline underline-offset-4">Aviso de privacidade</Link>
        </nav>
      </article>
    </main>
  )
}
