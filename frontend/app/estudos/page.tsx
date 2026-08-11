'use client'

// Hub de Estudos v2 (Fase 1 + 1B, DEC-035/036). Navegação por ROTA real
// (não useState como Biblioteca/DEC-032) — decisão explícita do usuário:
// entra num módulo, volta pro hub, escolhe outro.
// Versão restilizada com design system do v0 (DEC-038).

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  ListTodo,
  PenLine,
  School,
} from 'lucide-react'
import { listarProximasProvas, Prova } from '../../lib/provas'
import { listarAtividadesPendentes, Atividade } from '../../lib/atividades'
import { listarUltimosSimulados, Simulado } from '../../lib/simulados'
import { seedMateriasEnemEscolaSeNecessario } from '../../lib/materias'
import { listarRevisoesPendentes, CardRevisao } from '../../lib/revisao'
import { PageHeader, PageShell } from '@/components/study/page-shell'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const destinations = [
  { href: '/estudos/enem', label: 'ENEM', description: 'Áreas de conhecimento e provas oficiais', icon: GraduationCap },
  { href: '/estudos/escola', label: 'Escola', description: 'Matérias, provas e atividades', icon: School },
  { href: '/estudos/curso', label: 'Curso', description: 'Cursos livres em módulos e aulas', icon: BookOpen },
  { href: '/estudos/redacoes', label: 'Redações', description: 'Treinos com nota por competência', icon: PenLine },
]

export default function EstudosHubPage() {
  const [provas, setProvas] = useState<Prova[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [revisoes, setRevisoes] = useState<CardRevisao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      // Seed das matérias fixas de Escola/ENEM — roda uma vez, seguro
      // rodar de novo (checa existência antes de criar). Ver lib/materias.ts.
      await seedMateriasEnemEscolaSeNecessario()

      const [p, a, s, r] = await Promise.all([
        listarProximasProvas(),
        listarAtividadesPendentes(),
        listarUltimosSimulados(5),
        listarRevisoesPendentes(7),
      ])
      setProvas(p ?? [])
      setAtividades(a ?? [])
      setSimulados(s ?? [])
      setRevisoes(r ?? [])
      setCarregando(false)
    }
    carregar()
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

      <div className="mt-8">
        <HubBlock
          label="Revisão"
          title="Revisões pendentes (próximos 7 dias)"
          icon={BookMarked}
          loading={carregando}
          empty={revisoes.length === 0}
          emptyText="Nenhuma revisão pendente por enquanto."
          action={
            <Button render={<Link href="/revisao" />} variant="outline" size="sm">
              Abrir revisão
              <ChevronRight className="size-3.5" />
            </Button>
          }
        >
          {revisoes.map((r) => {
            const hoje = new Date().toISOString().slice(0, 10)
            const atrasada = r.proxima_revisao < hoje
            return (
              <li
                key={r.uuid}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <span className="min-w-0 truncate text-sm font-medium">{r.pergunta}</span>
                <span className="inline-flex items-center gap-2">
                  <MonoLabel className="shrink-0">{formatDateShort(r.proxima_revisao)}</MonoLabel>
                  {atrasada && <Badge variant="warning">atrasada</Badge>}
                </span>
              </li>
            )
          })}
        </HubBlock>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HubBlock
          label="Agenda"
          title="Próximas provas"
          icon={CalendarDays}
          loading={carregando}
          empty={provas.length === 0}
          emptyText="Nenhuma prova agendada."
        >
          {provas.map((p) => (
            <li
              key={p.uuid}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{p.titulo || p.tipo}</span>
                <MonoLabel>{formatDateShort(p.data)}</MonoLabel>
              </div>
              {p.materia_uuid ? (
                <Badge variant="default">{p.materia_uuid.slice(0, 8)}</Badge>
              ) : null}
            </li>
          ))}
        </HubBlock>

        <HubBlock
          label="A fazer"
          title="Atividades pendentes"
          icon={ListTodo}
          loading={carregando}
          empty={atividades.length === 0}
          emptyText="Tudo em dia por aqui."
        >
          {atividades.map((a) => (
            <li
              key={a.uuid}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {a.titulo}
              </span>
              <span className="inline-flex items-center gap-2">
                <MonoLabel className="shrink-0">
                  {a.data_entrega ? formatDateShort(a.data_entrega) : 'sem data'}
                </MonoLabel>
                <Badge variant={a.feita ? 'success' : 'outline'}>
                  {a.feita ? 'feita' : 'pendente'}
                </Badge>
              </span>
            </li>
          ))}
        </HubBlock>

        <HubBlock
          label="Desempenho"
          title="Últimos simulados"
          icon={BarChart3}
          loading={carregando}
          empty={simulados.length === 0}
          emptyText="Nenhum simulado registrado."
        >
          {simulados.slice(0, 5).map((s) => {
            const pct = s.total_questoes > 0
              ? Math.round((s.total_acertos / s.total_questoes) * 100)
              : 0
            return (
              <li
                key={s.uuid}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <MonoLabel>{formatDateShort(s.data)}</MonoLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {s.total_acertos}/{s.total_questoes}
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
  action,
  children,
}: {
  label: string
  title: string
  icon: typeof CalendarDays
  loading: boolean
  empty: boolean
  emptyText: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <MonoLabel className={action ? undefined : 'ml-auto'}>{label}</MonoLabel>
        {action ? <div className="ml-auto">{action}</div> : null}
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
