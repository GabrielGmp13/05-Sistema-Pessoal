'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  ListTodo,
  PenLine,
  School,
} from 'lucide-react'

import { PageHeader, PageShell } from '@/components/study/page-shell'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatDateShort,
  pendingActivities,
  recentSimulados,
  upcomingExams,
} from '@/lib/study-data'

const destinations = [
  {
    href: '/enem',
    label: 'ENEM',
    description: 'Áreas de conhecimento e provas oficiais',
    icon: GraduationCap,
  },
  {
    href: '/escola',
    label: 'Escola',
    description: 'Matérias, provas e atividades',
    icon: School,
  },
  {
    href: '/curso',
    label: 'Curso',
    description: 'Cursos livres em módulos e aulas',
    icon: BookOpen,
  },
  {
    href: '/redacoes',
    label: 'Redações',
    description: 'Treinos com nota por competência',
    icon: PenLine,
  },
]

export default function HubPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Módulo"
        title="Estudos"
        description="Seu ponto central de estudos. Escolha um mundo e veja rapidamente o que está pendente."
      />

      <nav aria-label="Mundos de estudo" className="mt-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {destinations.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group focus-visible:outline-none"
            >
              <Card className="flex items-center gap-4 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <d.icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-semibold">{d.label}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {d.description}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HubBlock
          label="Agenda"
          title="Próximas provas"
          icon={CalendarDays}
          loading={loading}
          empty={upcomingExams.length === 0}
          emptyText="Nenhuma prova agendada."
        >
          {upcomingExams.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{e.title}</span>
                <MonoLabel>{formatDateShort(e.date)}</MonoLabel>
              </div>
              <Badge variant={e.origin === 'ENEM' ? 'success' : 'default'}>
                {e.origin}
              </Badge>
            </li>
          ))}
        </HubBlock>

        <HubBlock
          label="A fazer"
          title="Atividades pendentes"
          icon={ListTodo}
          loading={loading}
          empty={pendingActivities.length === 0}
          emptyText="Tudo em dia por aqui."
        >
          {pendingActivities.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {a.title}
              </span>
              <MonoLabel className="shrink-0">
                {a.due ? formatDateShort(a.due) : 'sem data'}
              </MonoLabel>
            </li>
          ))}
        </HubBlock>

        <HubBlock
          label="Desempenho"
          title="Últimos simulados"
          icon={BarChart3}
          loading={loading}
          empty={recentSimulados.length === 0}
          emptyText="Nenhum simulado registrado."
        >
          {recentSimulados.slice(0, 5).map((s) => {
            const pct = Math.round((s.correct / s.total) * 100)
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <MonoLabel>{formatDateShort(s.date)}</MonoLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {s.correct}/{s.total}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              </li>
            )
          })}
        </HubBlock>
      </div>
    </PageShell>
  )
}

function HubBlock({
  label,
  title,
  icon: Icon,
  loading,
  empty,
  emptyText,
  children,
}: {
  label: string
  title: string
  icon: typeof CalendarDays
  loading: boolean
  empty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <MonoLabel className="ml-auto">{label}</MonoLabel>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className="p-5">
          <EmptyState title={emptyText} compact />
        </div>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </Card>
  )
}
