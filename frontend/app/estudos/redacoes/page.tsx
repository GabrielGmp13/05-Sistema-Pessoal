'use client'

import { useEffect, useMemo, useState } from 'react'
import { PenLine, Plus, TrendingUp } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  listarRedacoes,
  criarRedacao,
  somaCompetencias,
  Redacao,
} from '../../../lib/redacoes'

const COMP_LABELS = [
  'Domínio da norma culta',
  'Compreensão do tema',
  'Seleção de argumentos',
  'Mecanismos linguísticos',
  'Proposta de intervenção',
]

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RedacoesPage() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const [form, setForm] = useState({
    tema: '',
    texto: '',
    data: '',
    c1: '',
    c2: '',
    c3: '',
    c4: '',
    c5: '',
  })

  async function carregar() {
    const r = await listarRedacoes()
    setRedacoes(r ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const scored = redacoes
    .map((r) => somaCompetencias(r))
    .filter((s): s is number => s != null)

  const stats = useMemo(() => {
    if (scored.length === 0) return { avg: null as number | null, best: null as number | null }
    return {
      avg: Math.round(scored.reduce((a, b) => a + b, 0) / scored.length),
      best: Math.max(...scored),
    }
  }, [scored])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tema.trim() || !form.texto.trim() || !form.data) return

    const competencias = {
      competencia_1: form.c1 ? Number(form.c1) : null,
      competencia_2: form.c2 ? Number(form.c2) : null,
      competencia_3: form.c3 ? Number(form.c3) : null,
      competencia_4: form.c4 ? Number(form.c4) : null,
      competencia_5: form.c5 ? Number(form.c5) : null,
    }

    const notaCalculada = somaCompetencias(competencias)

    await criarRedacao({
      tema: form.tema,
      texto: form.texto,
      data: form.data,
      nota: notaCalculada,
      comentario: null,
      ...competencias,
    })

    setForm({ tema: '', texto: '', data: '', c1: '', c2: '', c3: '', c4: '', c5: '' })
    await carregar()
  }

  function updateField(campo: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [campo]: value }))
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo Redações"
        title="Redações"
        description="Registre suas redações com a nota de cada uma das cinco competências e acompanhe sua evolução."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Redações" value={String(redacoes.length)} icon={PenLine} />
        <StatCard
          label="Média"
          value={stats.avg != null ? String(stats.avg) : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Melhor nota"
          value={stats.best != null ? String(stats.best) : '—'}
          icon={TrendingUp}
        />
        <StatCard label="Máx. possível" value="1000" icon={PenLine} />
      </div>

      <div className="mt-10 flex flex-col gap-10">
        <Section label="Nova" title="Registrar redação">
          <Card className="p-5">
            <form onSubmit={handleCriar} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Tema">
                  <Input
                    value={form.tema}
                    onChange={(e) => updateField('tema', e.target.value)}
                    placeholder="Ex: Desafios da educação no Brasil"
                  />
                </Field>
                <Field label="Data">
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => updateField('data', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Texto">
                <textarea
                  value={form.texto}
                  onChange={(e) => updateField('texto', e.target.value)}
                  placeholder="Texto da redação"
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                />
              </Field>

              <div>
                <MonoLabel>Competências (0 a 200)</MonoLabel>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((campo, i) => (
                    <Field key={campo} label={`C${i + 1}`}>
                      <Input
                        value={form[campo]}
                        onChange={(e) => updateField(campo, e.target.value)}
                        placeholder="0"
                        inputMode="numeric"
                        aria-label={COMP_LABELS[i]}
                        title={COMP_LABELS[i]}
                      />
                    </Field>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  <Plus className="size-4" />
                  Salvar redação
                </Button>
              </div>
            </form>
          </Card>
        </Section>

        <Section label="Histórico" title="Minhas redações" count={redacoes.length}>
          {carregando ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : redacoes.length === 0 ? (
            <EmptyState
              icon={PenLine}
              title="Nenhuma redação registrada"
              description="Registre sua primeira redação no formulário acima."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {redacoes.map((r) => {
                const score = somaCompetencias(r)
                const comps = [
                  r.competencia_1,
                  r.competencia_2,
                  r.competencia_3,
                  r.competencia_4,
                  r.competencia_5,
                ]
                return (
                  <Card key={r.uuid} className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-pretty font-medium">{r.tema}</span>
                        <MonoLabel>{formatDate(r.data)}</MonoLabel>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {score != null ? (
                          <Badge
                            variant={score >= 800 ? 'success' : 'default'}
                            className="text-sm"
                          >
                            {score} / 1000
                          </Badge>
                        ) : (
                          <Badge variant="warning">Incompleta</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {comps.map((c, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/40 py-2.5"
                          title={COMP_LABELS[i]}
                        >
                          <MonoLabel>C{i + 1}</MonoLabel>
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              c == null
                                ? 'text-muted-foreground'
                                : c >= 160
                                  ? 'text-success-foreground'
                                  : 'text-foreground',
                            )}
                          >
                            {c == null ? '—' : c}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </PageShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof PenLine
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <span className="mt-1 text-2xl font-semibold tabular-nums">{value}</span>
      <MonoLabel>{label}</MonoLabel>
    </Card>
  )
}