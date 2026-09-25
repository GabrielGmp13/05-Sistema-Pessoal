'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronRight, ListTodo, School } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { EmptyState } from '@/components/study/empty-state'
import { MonoLabel } from '@/components/study/mono-label'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { listarMaterias, seedMateriasEnemEscolaSeNecessario, Materia } from '../../../lib/materias'
import { GerenciarMaterias } from './GerenciarMaterias'
import { useContextoAcademico } from '@/components/useContextoAcademico'
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
  const [erro, setErro] = useState('')
  const rotulo = useContextoAcademico()
  const visiveis = materias.filter(m => m.mostra_escola)
  const uuidsVisiveis = new Set(visiveis.map(m => m.uuid))
  const provasVisiveis = provas.filter(p => p.materia_uuid && uuidsVisiveis.has(p.materia_uuid))
  const atividadesVisiveis = atividades.filter(a => uuidsVisiveis.has(a.materia_uuid))

  const recarregar = useCallback(async () => {
    const m = await listarMaterias('academica')
    if (m === null) throw new Error('leitura')
    setMaterias(m)
  }, [])

  useEffect(() => {
    let ativo = true
    void seedMateriasEnemEscolaSeNecessario().then(() => Promise.all([
      listarMaterias('academica'),
      listarProximasProvas('escola'),
      listarAtividadesPendentes(),
    ])).then(([m, p, a]) => {
    if (!ativo) return
    if (m === null || p === null || a === null) throw new Error('leitura')
    setMaterias(m)
    setProvas(p)
    setAtividades(a)
    }).catch(() => { if (ativo) setErro('Não foi possível carregar este contexto. Recarregue a página antes de editar.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        title={rotulo}
        description="Organize suas matérias. Provas, atividades e simulados ficam dentro de cada matéria."
      />

      {erro ? <p role="alert" className="text-destructive">{erro}</p> : carregando ? (
        <LoadingState />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <GerenciarMaterias materias={materias} rotulo={rotulo} recarregar={recarregar} />
          <Section label="Bloco 1" title="Matérias" count={visiveis.length}>
            {visiveis.length === 0 ? (
              <EmptyState
                icon={School}
                title="Nenhuma matéria cadastrada"
                description="Crie uma matéria ou reinclua uma existente no painel acima."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visiveis.map((m) => (
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
            <Section label="Bloco 2" title="Próximas provas" count={provasVisiveis.length}>
              {provasVisiveis.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nenhuma prova agendada"
                  compact
                />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {provasVisiveis.map((p) => (
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
              count={atividadesVisiveis.length}
            >
              {atividadesVisiveis.length === 0 ? (
                <EmptyState icon={ListTodo} title="Tudo em dia" compact />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {atividadesVisiveis.map((a) => (
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
