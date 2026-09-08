'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Bug, FileImage, Lightbulb, Loader2, RefreshCw } from 'lucide-react'
import { useTema } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BUG_MODULES, BUG_THEMES } from '@/lib/bug-report'
import { otimizarImagem } from '@/lib/image-optimization'
import { SUPPORT_MAX_FILES, SUPPORT_STATUS_LABELS, validateSupportImage, type SupportStatus, type SupportType } from '@/lib/support'
import packageInfo from '../../package.json'

interface Ticket {
  uuid: string; protocolo: string; tipo: SupportType; titulo: string; modulo: string | null
  descricao: string; status: SupportStatus; resposta: string | null; created_at: string
  chamados_suporte_historico: Array<{ uuid: string; status: SupportStatus; mensagem: string | null; origem: string; created_at: string }>
  chamados_suporte_anexos: Array<{ uuid: string; nome_original: string; tamanho_bytes: number }>
}

const EMPTY = { tipo: 'bug' as SupportType, titulo: '', modulo: '', descricao: '', esperado: '', passos: '', ambiente: '' }
const selectClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring'

export function BugReportForm() {
  const { tema } = useTema()
  const [form, setForm] = useState(EMPTY)
  const [files, setFiles] = useState<File[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/suporte', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.erro || 'Não foi possível carregar seus pedidos.')
      setTickets(result.chamados ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus pedidos.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    // A consulta assíncrona sincroniza esta tela com chamados externos à árvore React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])
  useEffect(() => {
    const refresh = () => void load()
    window.addEventListener('support-refresh', refresh)
    return () => window.removeEventListener('support-refresh', refresh)
  }, [load])
  function update(field: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [field]: value })); setMessage(''); setError('')
  }
  function selectFiles(list: FileList | null) {
    const selected = Array.from(list ?? []).slice(0, SUPPORT_MAX_FILES)
    const invalid = selected.map(validateSupportImage).find(Boolean)
    if (invalid) { setError(invalid); setFiles([]); return }
    setError(''); setFiles(selected)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/suporte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tema: BUG_THEMES[tema], versao: packageInfo.version }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.erro || 'Não foi possível registrar o pedido.')
      for (const file of files) {
        const arquivo = (await otimizarImagem(file, { maxWidth: 2560, maxHeight: 2560, quality: 0.9 })).file
        const body = new FormData(); body.set('arquivo', arquivo)
        const upload = await fetch(`/api/suporte/${result.uuid}/anexos`, { method: 'POST', body })
        if (!upload.ok) throw new Error(`O pedido ${result.protocolo} foi salvo, mas um print não foi enviado.`)
      }
      setForm(EMPTY); setFiles([]); setMessage(`Pedido enviado. Guarde o protocolo ${result.protocolo}.`); await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o pedido.')
    } finally { setSending(false) }
  }

  return <section className="mt-8 space-y-6" aria-labelledby="support-title">
    <Card className="gap-6 p-5 sm:p-6">
      <header className="space-y-2">
        <h2 id="support-title" className="flex items-center gap-2 text-xl font-semibold">{form.tipo === 'bug' ? <Bug className="size-5" aria-hidden="true" /> : <Lightbulb className="size-5" aria-hidden="true" />}Bugs e sugestões</h2>
        <p className="text-sm text-muted-foreground">Envie um pedido e acompanhe o protocolo aqui. O print fica privado e não é anexado ao e-mail de aviso.</p>
        <p id="support-privacy" className="text-sm leading-relaxed text-muted-foreground">Não envie senhas, documentos, dados financeiros ou dados de outras pessoas. Textos são guardados como texto simples e não são executados por IA.</p>
      </header>
      <form onSubmit={submit} className="space-y-4" aria-describedby="support-privacy" autoComplete="off">
        <div className="grid grid-cols-2 gap-2"><Button type="button" variant={form.tipo === 'bug' ? 'default' : 'outline'} onClick={() => update('tipo', 'bug')}><Bug />Reportar bug</Button><Button type="button" variant={form.tipo === 'sugestao' ? 'default' : 'outline'} onClick={() => update('tipo', 'sugestao')}><Lightbulb />Dar sugestão</Button></div>
        <div className="space-y-2"><Label htmlFor="support-title-input">Título *</Label><Input id="support-title-input" value={form.titulo} onChange={(event) => update('titulo', event.target.value)} minLength={5} maxLength={120} placeholder="Resumo curto do pedido" required /></div>
        <div className="space-y-2"><Label htmlFor="support-module">Página ou módulo</Label><select id="support-module" className={selectClass} value={form.modulo} onChange={(event) => update('modulo', event.target.value)}><option value="">Selecione</option>{BUG_MODULES.map((module) => <option key={module}>{module}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="support-description">{form.tipo === 'bug' ? 'O que aconteceu? *' : 'Qual é sua sugestão? *'}</Label><Textarea id="support-description" value={form.descricao} onChange={(event) => update('descricao', event.target.value)} minLength={10} maxLength={4000} required /></div>
        {form.tipo === 'bug' ? <><div className="space-y-2"><Label htmlFor="support-steps">O que estava tentando fazer?</Label><Textarea id="support-steps" value={form.passos} onChange={(event) => update('passos', event.target.value)} maxLength={2000} /></div><div className="space-y-2"><Label htmlFor="support-expected">O que esperava que acontecesse?</Label><Textarea id="support-expected" value={form.esperado} onChange={(event) => update('esperado', event.target.value)} maxLength={2000} /></div><div className="space-y-2"><Label htmlFor="support-device">Navegador e dispositivo</Label><Input id="support-device" value={form.ambiente} onChange={(event) => update('ambiente', event.target.value)} maxLength={300} placeholder="Ex.: Chrome no Windows, zoom 100%" /></div></> : null}
        <div className="space-y-2"><Label htmlFor="support-images">Prints privados (opcional)</Label><Input id="support-images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => selectFiles(event.target.files)} /><p className="text-xs text-muted-foreground">Até 3 imagens de 2 MB cada. Oculte informações pessoais antes de enviar.</p>{files.length ? <p className="flex items-center gap-2 text-xs"><FileImage className="size-4" />{files.length} print(s) selecionado(s)</p> : null}</div>
        <Button type="submit" disabled={sending}>{sending ? <Loader2 className="animate-spin" /> : null}{sending ? 'Enviando...' : 'Enviar e gerar protocolo'}</Button>
      </form>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{message ? <p role="status" className="text-sm text-success">{message}</p> : null}
    </Card>
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Meus pedidos</h2><p className="text-sm text-muted-foreground">Histórico e respostas ligadas à sua conta.</p></div><Button type="button" variant="outline" size="icon" onClick={() => void load()} aria-label="Atualizar pedidos"><RefreshCw /></Button></div>
      {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : tickets.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Você ainda não enviou pedidos.</p> : <div className="space-y-4">{tickets.map((ticket) => <article key={ticket.uuid} className="space-y-3 rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{ticket.titulo}</p><p className="text-xs text-muted-foreground">{ticket.protocolo} · {new Date(ticket.created_at).toLocaleString('pt-BR')}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{SUPPORT_STATUS_LABELS[ticket.status]}</span></div><p className="whitespace-pre-wrap text-sm">{ticket.descricao}</p>{ticket.resposta ? <div className="rounded-lg bg-secondary p-3"><p className="text-xs font-semibold">Resposta de Gabriel</p><p className="mt-1 whitespace-pre-wrap text-sm">{ticket.resposta}</p></div> : null}{ticket.chamados_suporte_anexos?.length ? <div className="flex flex-wrap gap-2">{ticket.chamados_suporte_anexos.map((file) => <a key={file.uuid} href={`/api/suporte/${ticket.uuid}/anexos/${file.uuid}`} target="_blank" rel="noreferrer" className="text-sm text-primary underline underline-offset-4">{file.nome_original}</a>)}</div> : null}<ol className="space-y-1 border-t border-border pt-3">{[...(ticket.chamados_suporte_historico ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((item) => <li key={item.uuid} className="text-xs text-muted-foreground"><strong>{SUPPORT_STATUS_LABELS[item.status]}</strong> · {new Date(item.created_at).toLocaleString('pt-BR')}{item.mensagem ? ` — ${item.mensagem}` : ''}</li>)}</ol></article>)}</div>}
    </Card>
  </section>
}
