'use client'

import { useState } from 'react'
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { MonoLabel } from '@/components/study/mono-label'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { enemAreas } from '@/lib/study-data'

type Row = {
  n: number
  correct: boolean
  content: string
  reason: string
}

const contents = [
  'Funções',
  'Geometria analítica',
  'Probabilidade',
  'Estatística',
  'Trigonometria',
  'Álgebra',
]

// Demo seed: tabela já gerada com maioria de acertos e 2 linhas erradas abertas.
function seedRows(): Row[] {
  return Array.from({ length: 10 }, (_, i) => {
    const n = i + 1
    if (n === 3)
      return { n, correct: false, content: 'Probabilidade', reason: 'Confundi combinação com arranjo' }
    if (n === 7)
      return { n, correct: false, content: 'Geometria analítica', reason: 'Erro de sinal na distância' }
    return { n, correct: true, content: '', reason: '' }
  })
}

export default function GabaritoPage() {
  const [generated, setGenerated] = useState(true)
  const [area, setArea] = useState<string>('Matemática')
  const [qty, setQty] = useState(10)
  const [rows, setRows] = useState<Row[]>(seedRows())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const correctCount = rows.filter((r) => r.correct).length

  function generate(e: React.FormEvent) {
    e.preventDefault()
    const total = Math.min(Math.max(1, qty), 90)
    const preview = Math.min(total, 10)
    setRows(
      Array.from({ length: preview }, (_, i) => ({
        n: i + 1,
        correct: true,
        content: '',
        reason: '',
      })),
    )
    setGenerated(true)
    setSaved(false)
  }

  function reset() {
    setGenerated(false)
    setRows([])
    setSaved(false)
  }

  function toggle(n: number) {
    setRows((prev) =>
      prev.map((r) => (r.n === n ? { ...r, correct: !r.correct } : r)),
    )
  }

  function update(n: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.n === n ? { ...r, ...patch } : r)))
  }

  function save() {
    setSaving(true)
    setSaved(false)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 1300)
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/enem">Voltar ao ENEM</BackLink>
      </div>
      <PageHeader
        eyebrow="Lançamento em lote"
        title="Gabarito digital"
        description="Digite rapidamente o resultado da prova: marque acertos e erros, e detalhe apenas o que precisar."
      />

      {/* Resumo do gabarito já lançado */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <SummaryStat label="Questões registradas" value="90" />
        <SummaryStat label="Taxa de acerto" value="71%" accent />
      </div>

      {/* Seletor de área + quantidade */}
      <Card className="mt-6 p-5">
        <form
          onSubmit={generate}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <Field label="Área do ENEM" className="sm:flex-1">
            <Select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label="Área do ENEM"
            >
              {enemAreas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantidade de questões" className="sm:w-48">
            <Input
              type="number"
              min={1}
              max={90}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </Field>
          <Button type="submit" size="lg" className="shrink-0">
            <Sparkles className="size-4" />
            {generated ? 'Gerar novamente' : 'Gerar tabela'}
          </Button>
        </form>
      </Card>

      {!generated ? (
        <Card className="mt-4 flex flex-col items-center justify-center gap-2 border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">Nenhuma tabela gerada ainda</p>
          <p className="max-w-sm text-pretty text-xs leading-relaxed text-muted-foreground">
            Escolha a área e a quantidade de questões acima e gere a tabela para
            começar o lançamento.
          </p>
        </Card>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonoLabel>
              {area} · {rows.length} questões · {correctCount} certas
            </MonoLabel>
            <button
              type="button"
              onClick={reset}
              className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Limpar
            </button>
          </div>

          <Card className="divide-y divide-border overflow-hidden">
            {rows.map((r) => (
              <div key={r.n} className="flex flex-col gap-3 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-sm font-medium tabular-nums">
                    {r.n}
                  </span>
                  <span className="text-sm text-muted-foreground">Questão {r.n}</span>
                  <div
                    className="ml-auto inline-flex overflow-hidden rounded-lg border border-border"
                    role="group"
                    aria-label={`Resultado da questão ${r.n}`}
                  >
                    <button
                      type="button"
                      onClick={() => update(r.n, { correct: true, content: '', reason: '' })}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                        r.correct
                          ? 'bg-success text-success-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted',
                      )}
                      aria-pressed={r.correct}
                    >
                      <Check className="size-3.5" />
                      Certo
                    </button>
                    <button
                      type="button"
                      onClick={() => update(r.n, { correct: false })}
                      className={cn(
                        'inline-flex items-center gap-1 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors',
                        !r.correct
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-card text-muted-foreground hover:bg-muted',
                      )}
                      aria-pressed={!r.correct}
                    >
                      <X className="size-3.5" />
                      Errado
                    </button>
                  </div>
                </div>

                {!r.correct ? (
                  <div className="grid grid-cols-1 gap-3 pl-11 sm:grid-cols-2">
                    <Field label="Conteúdo relacionado" optional>
                      <Select
                        value={r.content}
                        onChange={(e) => update(r.n, { content: e.target.value })}
                        aria-label={`Conteúdo da questão ${r.n}`}
                      >
                        <option value="">Selecione…</option>
                        {contents.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Motivo do erro" optional>
                      <Input
                        value={r.reason}
                        onChange={(e) => update(r.n, { reason: e.target.value })}
                        placeholder="Ex: erro de cálculo"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            ))}
          </Card>

          <div className="flex items-center justify-end gap-3">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-success-foreground">
                <Check className="size-3.5" />
                Gabarito salvo
              </span>
            ) : null}
            <Button size="lg" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? 'Salvando…' : 'Salvar gabarito'}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <Card className="p-4">
      <MonoLabel>{label}</MonoLabel>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          accent && 'text-success-foreground',
        )}
      >
        {value}
      </p>
    </Card>
  )
}
