'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronRight, ListTodo, School } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { EmptyState } from '@/components/study/empty-state'
import { MonoLabel } from '@/components/study/mono-label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { listarMateriasEscola, Materia } from '../../../lib/materias'
import { listarProximasProvas, Prova } from '../../../lib/provas'
import { listarAtividadesPendentes, Atividade } from '../../../lib/atividades'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function EscolaPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [m, p, a] = await Promise.all([
      listarMateriasEscola(),
      listarProximasProvas('escola'),
      listarAtividadesPendentes(),
    ])
    setMaterias(m ?? [])
    setProvas(p ?? [])
    setAtividades(a ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo Escola"
        title="Escola"
        description="Matérias fixas da escola. Provas, atividades e simulados ficam dentro de cada matéria."
      />

      {carregando ? (
        <LoadingState />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <Section label="Bloco 1" title="Matérias" count={materias.length}>
            {materias.length === 0 ? (
              <EmptyState
                icon={School}
                title="Nenhuma matéria cadastrada"
                description="As matérias fixas são criadas automaticamente pelo sistema."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {materias.map((m) => (
                  <Link
                    key={m.uuid}
                    href={`/estudos/materia/${m.uuid}?from=escola`}
                    className="group focus-visible:outline-none"
                  >
                    <Card className="flex items-center gap-3 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                      <span className="truncate text-sm font-medium">{m.nome}</span>
                      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section label="Bloco 2" title="Próximas provas" count={provas.length}>
              {provas.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nenhuma prova agendada"
                  compact
                />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {provas.map((p) => (
                    <div
                      key={p.uuid}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {p.titulo || 'sem título'}
                      </span>
                      <MonoLabel className="shrink-0">
                        {formatDate(p.data)}
                      </MonoLabel>
                    </div>
                  ))}
                </Card>
              )}
            </Section>

            <Section
              label="Bloco 3"
              title="Atividades pendentes"
              count={atividades.length}
            >
              {atividades.length === 0 ? (
                <EmptyState icon={ListTodo} title="Tudo em dia" compact />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {atividades.map((a) => (
                    <div
                      key={a.uuid}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {a.titulo}
                      </span>
                      <MonoLabel className="shrink-0">
                        {a.data_entrega ? formatDate(a.data_entrega) : 'sem data'}
                      </MonoLabel>
                    </div>
                  ))}
                </Card>
              )}
            </Section>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function LoadingState() {
  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}