'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, ListTodo } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { SubjectManager } from '@/components/study/subject-manager'
import { EmptyState } from '@/components/study/empty-state'
import { MonoLabel } from '@/components/study/mono-label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  escolaActivities,
  escolaExams,
  escolaSubjects,
  formatDate,
} from '@/lib/study-data'

export default function EscolaPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo Escola"
        title="Escola"
        description="Gerencie as matérias da escola e acompanhe provas e atividades de qualquer uma delas."
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <Section
            label="Bloco 1"
            title="Matérias"
            count={escolaSubjects.length}
          >
            <SubjectManager initialSubjects={escolaSubjects} origin="escola" />
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section label="Bloco 2" title="Próximas provas" count={escolaExams.length}>
              {escolaExams.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nenhuma prova agendada"
                  compact
                />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {escolaExams.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {ex.title}
                      </span>
                      <MonoLabel className="shrink-0">
                        {formatDate(ex.date)}
                      </MonoLabel>
                    </div>
                  ))}
                </Card>
              )}
            </Section>

            <Section
              label="Bloco 3"
              title="Atividades pendentes"
              count={escolaActivities.length}
            >
              {escolaActivities.length === 0 ? (
                <EmptyState icon={ListTodo} title="Tudo em dia" compact />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {escolaActivities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {a.title}
                      </span>
                      <MonoLabel className="shrink-0">
                        {a.due ? formatDate(a.due) : 'sem data'}
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
