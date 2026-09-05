'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Bug, Copy } from 'lucide-react'

import { useTema } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BUG_MODULES, BUG_THEMES, formatBugReport, type BugReportInput } from '@/lib/bug-report'
import packageInfo from '../../package.json'

const EMPTY: BugReportInput = {
  modulo: '', tentativa: '', esperado: '', ocorrido: '', ambiente: '', tema: '', print: 'nao-sei',
}
const selectClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring'

export function BugReportForm() {
  const { tema } = useTema()
  const [form, setForm] = useState(EMPTY)
  const [report, setReport] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copying, setCopying] = useState(false)
  const reportRef = useRef<HTMLTextAreaElement>(null)

  function update(field: keyof BugReportInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setReport('')
    setMessage('')
    setError('')
  }

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      setReport(formatBugReport({ ...form, tema: form.tema || BUG_THEMES[tema] }, packageInfo.version, new Date()))
      setMessage('Relatório gerado. Revise o texto abaixo antes de copiar; nada foi enviado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o relatório.')
    }
  }

  async function copy() {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(report)
      setMessage('Copiado. Envie pelo canal privado combinado com Gabriel; o site não faz o envio.')
    } catch {
      reportRef.current?.focus()
      reportRef.current?.select()
      setMessage('A cópia automática foi bloqueada. Copie o texto selecionado usando Ctrl+C, ⌘C ou o menu do dispositivo.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <Card className="mt-8 gap-6 p-5 sm:p-6" aria-labelledby="bug-title">
      <header className="space-y-2">
        <h2 id="bug-title" className="flex items-center gap-2 text-xl font-semibold"><Bug aria-hidden="true" className="size-5" />Reportar bug</h2>
        <p className="text-sm text-muted-foreground">v{packageInfo.version} · Beta privado. Gere, revise e copie um relato para enviar a Gabriel.</p>
        <p id="bug-privacy" className="text-sm leading-relaxed text-muted-foreground">
          Não inclua senhas, chaves, links privados ou dados de outras pessoas. O formulário não envia nem salva o relato no servidor; o rascunho desaparece ao sair desta página.
        </p>
      </header>
      <form onSubmit={generate} className="space-y-4" aria-describedby="bug-privacy" autoComplete="off">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bug-module">Página ou módulo *</Label>
            <select id="bug-module" className={selectClass} value={form.modulo} onChange={(event) => update('modulo', event.target.value)} required>
              <option value="">Selecione</option>
              {BUG_MODULES.map((module) => <option key={module}>{module}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-theme">Tema usado no problema</Label>
            <select id="bug-theme" className={selectClass} value={form.tema} onChange={(event) => update('tema', event.target.value)}>
              <option value="">Tema atual ({BUG_THEMES[tema]})</option>
              {Object.values(BUG_THEMES).map((theme) => <option key={theme}>{theme}</option>)}
              <option>Não sei</option>
            </select>
          </div>
        </div>
        {([
          ['tentativa', 'O que estava tentando fazer?', 'Descreva os passos, sem dados pessoais.'],
          ['esperado', 'O que esperava que acontecesse?', 'Como deveria funcionar?'],
          ['ocorrido', 'O que aconteceu?', 'Descreva o erro e se voltou a acontecer.'],
        ] as const).map(([field, label, placeholder]) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`bug-${field}`}>{label} *</Label>
            <Textarea id={`bug-${field}`} value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} maxLength={2000} required />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="bug-device">Navegador e dispositivo *</Label>
          <Input id="bug-device" value={form.ambiente} onChange={(event) => update('ambiente', event.target.value)} placeholder="Ex.: Chrome no Windows, zoom 100%; ou Safari no iPhone" maxLength={300} required />
          <p className="text-xs text-muted-foreground">Se não souber o navegador, informe o dispositivo e escreva “não sei”.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bug-print">Poderá enviar um print?</Label>
          <select id="bug-print" className={selectClass} value={form.print} onChange={(event) => update('print', event.target.value)}>
            <option value="nao-sei">Ainda não sei</option>
            <option value="sim">Sim, após ocultar dados pessoais</option>
            <option value="nao">Não</option>
          </select>
          <p className="text-xs leading-relaxed text-muted-foreground">Não há upload aqui. Envie o print separadamente pelo canal privado, se quiser. Oculte e-mails, compromissos, documentos, URLs e outras informações pessoais.</p>
        </div>
        <Button type="submit">Gerar relatório para revisar</Button>
      </form>
      {report ? (
        <div className="space-y-3 border-t border-border pt-6">
          <Label htmlFor="bug-report">Revise o relatório (você pode retirar informações antes de copiar)</Label>
          <Textarea id="bug-report" ref={reportRef} rows={12} maxLength={12000} value={report} onChange={(event) => { setReport(event.target.value); setMessage('') }} />
          <Button type="button" variant="outline" onClick={() => void copy()} disabled={copying || !report.trim()}><Copy aria-hidden="true" />{copying ? 'Copiando...' : 'Copiar relatório'}</Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
    </Card>
  )
}
