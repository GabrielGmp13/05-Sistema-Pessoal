'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarClock,
  ChevronRight,
  FileCheck2,
  Plus,
  Timer,
} from 'lucide-react'
import {
  listarTodasMateriasEnem,
  Materia,
  AREA_ENEM_LABELS,
  ORDEM_AREAS_ENEM,
} from '../../../lib/materias'
import { listarProximasProvas, criarProva, Prova, TipoProva } from '../../../lib/provas'
import {
  BackLink,
  PageHeader,
  PageShell,
} from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { EmptyState } from '@/components/study/empty-state'
import { MonoLabel } from '@/components/study/mono-label'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function EnemPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [novaProva, setNovaProva] = useState({ titulo: '', data: '', tipo: 'enem_dia1' as TipoProva })
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [m, p] = await Promise.all([
      listarTodasMateriasEnem(),
      listarProximasProvas(),
    ])
    setMaterias(m ?? [])
    setProvas((p ?? []).filter((pr) => pr.tipo === 'enem_dia1' || pr.tipo === 'enem_dia2'))
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCriarProva() {
    if (!novaProva.data) return
    await criarProva({
      materia_uuid: null,
      tipo: novaProva.tipo,
      conteudo_uuid: null,
      titulo: novaProva.titulo || (novaProva.tipo === 'enem_dia1' ? 'ENEM — Dia 1' : 'ENEM — Dia 2'),
      data: novaProva.data,
      tempo_minutos: novaProva.tipo === 'enem_dia1' ? 330 : 300,
      redacao_uuid: null,
      nota: null,
      feita: false,
      observacoes: null,
    })
    setNovaProva({ titulo: '', data: '', tipo: 'enem_dia1' })
    carregar()
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo ENEM"
        title="ENEM"
        description="Áreas de conhecimento fixas do exame. Entre em uma área pra ver suas matérias, ou gerencie a prova oficial aqui embaixo."
      />

      {carregando ? (
        <LoadingState />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <Section label="Bloco 1" title="Áreas de conhecimento">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ORDEM_AREAS_ENEM.map((area) => {
                const count = materias.filter((m) => m.area_enem === area).length
                return (
                  <Link key={area} href={`/estudos/enem/${area}`} className="group focus-visible:outline-none">
                    <Card className="flex items-center gap-4 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-base font-semibold">{AREA_ENEM_LABELS[area]}</span>
                        <MonoLabel>{count} matéria{count === 1 ? '' : 's'}</MonoLabel>
                      </div>
                      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Card>
                  </Link>
                )
              })}
            </div>
          </Section>

          <Section label="Bloco 2" title="Provas ENEM" count={provas.length}>
            <div className="flex flex-col gap-4">
              {provas.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nenhuma prova agendada"
                  description="Agende o Dia 1 ou Dia 2 no formulário abaixo."
                />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {provas.map((p) => (
                    <div
                      key={p.uuid}
                      className="flex flex-wrap items-center gap-3 px-5 py-4"
                    >
                      <Badge variant={p.tipo === 'enem_dia1' ? 'success' : 'default'}>
                        {p.tipo === 'enem_dia1' ? 'Dia 1' : 'Dia 2'}
                      </Badge>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {p.titulo || 'Prova ENEM'}
                        </span>
                        <MonoLabel>{formatDate(p.data)}</MonoLabel>
                      </div>
                      <div className="ml-auto flex flex-wrap gap-2">
                      <Link
                        href={`/estudos/enem/gabarito/${p.uuid}?modo=prova`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      >
                        <Timer className="size-3.5" />
                        Fazer prova
                      </Link>
                      <Link
                        href={`/estudos/enem/gabarito/${p.uuid}`}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
                        )}
                      >
                        <FileCheck2 className="size-3.5" />
                        Gabarito
                      </Link>
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              <Card className="p-5">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleCriarProva(); }}
                  className="flex flex-col gap-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Dia da prova">
                      <Select
                        value={novaProva.tipo}
                        onChange={(e) => setNovaProva((p) => ({ ...p, tipo: e.target.value as TipoProva }))}
                        aria-label="Dia da prova"
                      >
                        <option value="enem_dia1">Dia 1 (Linguagens + Humanas + Redação)</option>
                        <option value="enem_dia2">Dia 2 (Natureza + Matemática)</option>
                      </Select>
                    </Field>
                    <Field label="Data">
                      <Input
                        type="date"
                        value={novaProva.data}
                        onChange={(e) => setNovaProva((p) => ({ ...p, data: e.target.value }))}
                      />
                    </Field>
                    <Field label="Título" optional>
                      <Input
                        value={novaProva.titulo}
                        onChange={(e) => setNovaProva((p) => ({ ...p, titulo: e.target.value }))}
                        placeholder="Ex: 1ª aplicação"
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="lg">
                      <Plus className="size-4" />
                      Agendar prova
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </Section>
        </div>
      )}
    </PageShell>
  )
}

function LoadingState() {
  return (
    <div className="mt-8 flex flex-col gap-10">
      {[0, 1].map((s) => (
        <div key={s} className="flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
