'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Circle, Clock, PlayCircle, Plus, Trophy } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { listarMaterias, atualizarMateria, Materia } from '../../../../lib/materias'
import {
  listarModulosCurso,
  criarModuloCurso,
  deletarModuloCurso,
  ModuloCurso,
} from '../../../../lib/modulos-curso'
import {
  criarConteudo,
  listarConteudosPorModuloCurso,
  atualizarConteudo,
  Conteudo,
} from '../../../../lib/conteudos'

export default function CursoDetalhePage() {
  const params = useParams<{ materiaUuid: string }>()
  const materiaUuid = params.materiaUuid

  const [curso, setCurso] = useState<Materia | null>(null)
  const [modulos, setModulos] = useState<ModuloCurso[]>([])
  const [conteudosPorModulo, setConteudosPorModulo] = useState<Record<string, Conteudo[]>>({})
  const [novoModuloNome, setNovoModuloNome] = useState('')
  const [novaAulaNome, setNovaAulaNome] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const [cursos, mods] = await Promise.all([
      listarMaterias('curso'),
      listarModulosCurso(materiaUuid),
    ])
    setCurso((cursos ?? []).find((c) => c.uuid === materiaUuid) ?? null)
    setModulos(mods ?? [])

    const mapa: Record<string, Conteudo[]> = {}
    for (const mod of mods ?? []) {
      mapa[mod.uuid] = (await listarConteudosPorModuloCurso(mod.uuid)) ?? []
    }
    setConteudosPorModulo(mapa)
    setCarregando(false)
  }

  useEffect(() => {
    if (materiaUuid) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaUuid])

  const { total, done, progress } = useMemo(() => {
    const aulas = Object.values(conteudosPorModulo).flat()
    const t = aulas.length
    const d = aulas.filter((a) => a.progresso >= 100).length
    return {
      total: t,
      done: d,
      progress: t === 0 ? (curso?.concluido ? 100 : 0) : Math.round((d / t) * 100),
    }
  }, [conteudosPorModulo, curso])

  async function handleCriarModulo(e: React.FormEvent) {
    e.preventDefault()
    if (!novoModuloNome.trim()) return
    await criarModuloCurso({
      materia_uuid: materiaUuid,
      nome: novoModuloNome.trim(),
      ordem: modulos.length,
    })
    setNovoModuloNome('')
    await carregar()
  }

  async function handleDeletarModulo(uuid: string) {
    await deletarModuloCurso(uuid)
    await carregar()
  }

  async function handleCriarAula(moduloUuid: string, e: React.FormEvent) {
    e.preventDefault()
    const nomeAula = novaAulaNome[moduloUuid]
    if (!nomeAula?.trim()) return
    await criarConteudo(
      {
        nome: nomeAula.trim(),
        progresso: 0,
        revisao_uuid: null,
        modulo_curso_uuid: moduloUuid,
      },
      [materiaUuid],
    )
    setNovaAulaNome((prev) => ({ ...prev, [moduloUuid]: '' }))
    await carregar()
  }

  async function handleToggleAula(conteudoUuid: string, concluida: boolean) {
    await atualizarConteudo(conteudoUuid, { progresso: concluida ? 0 : 100 })
    await carregar()
  }

  async function handleMarcarCursoConcluido() {
    if (!curso) return
    await atualizarMateria(curso.uuid, {
      concluido: !curso.concluido,
      data_conclusao: !curso.concluido
        ? new Date().toISOString().slice(0, 10)
        : null,
    })
    await carregar()
  }

  if (carregando) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos/curso">Voltar aos Cursos</BackLink>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageShell>
    )
  }

  if (!curso) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos/curso">Voltar aos Cursos</BackLink>
        </div>
        <PageHeader eyebrow="Curso" title="Curso não encontrado" />
        <div className="mt-8">
          <EmptyState
            title="Esse curso não existe"
            description="Volte para a lista e escolha outro curso."
          />
        </div>
      </PageShell>
    )
  }

  const isDone = curso.concluido || (total > 0 && done === total)

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos/curso">Voltar aos Cursos</BackLink>
      </div>
      <PageHeader
        eyebrow={curso.plataforma ?? 'Curso'}
        title={curso.nome}
        description={
          curso.carga_horaria_total_horas != null
            ? `${total} aulas · ${curso.carga_horaria_total_horas}h de conteúdo`
            : `${total} aulas`
        }
        actions={
          isDone ? (
            <Badge variant="success">
              <Trophy className="size-3" />
              Concluído
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarcarCursoConcluido}
            >
              <CheckCircle2 className="size-3.5" />
              Marcar como concluído
            </Button>
          )
        }
      />

      <Card className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <span className="font-mono text-sm font-semibold tabular-nums">
              {progress}%
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <MonoLabel>Progresso geral</MonoLabel>
            <span className="text-sm text-muted-foreground">
              {done} de {total} aulas concluídas
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-4 sm:justify-end">
          {curso.carga_horaria_total_horas != null && (
            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <Clock className="size-4" />
              {curso.carga_horaria_total_horas}h
            </div>
          )}
          <Progress value={progress} className="max-w-xs flex-1" />
        </div>
      </Card>

      <div className="mt-10">
        <Section
          label="Conteúdo"
          title="Módulos e aulas"
          count={modulos.length}
        >
          {modulos.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title="Nenhum módulo cadastrado"
              description="Adicione o primeiro módulo abaixo para organizar as aulas do curso."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {modulos.map((mod, mi) => {
                const aulas = conteudosPorModulo[mod.uuid] ?? []
                const mDone = aulas.filter((a) => a.progresso >= 100).length
                return (
                  <Card key={mod.uuid} className="overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-border bg-secondary/40 px-5 py-3.5">
                      <MonoLabel>
                        Módulo {String(mi + 1).padStart(2, '0')}
                      </MonoLabel>
                      <h3 className="text-sm font-semibold">{mod.nome}</h3>
                      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                        {mDone}/{aulas.length}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletarModulo(mod.uuid)}
                      >
                        Apagar
                      </Button>
                    </div>

                    {aulas.length > 0 && (
                      <ul className="divide-y divide-border">
                        {aulas.map((aula) => {
                          const complete = aula.progresso >= 100
                          return (
                            <li key={aula.uuid}>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleAula(aula.uuid, complete)
                                }
                                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/30"
                                aria-pressed={complete}
                              >
                                {complete ? (
                                  <CheckCircle2 className="size-4 shrink-0 text-success-foreground" />
                                ) : (
                                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                                )}
                                <span
                                  className={cn(
                                    'text-sm',
                                    complete
                                      ? 'text-muted-foreground line-through'
                                      : 'font-medium',
                                  )}
                                >
                                  {aula.nome}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <form
                      onSubmit={(e) => handleCriarAula(mod.uuid, e)}
                      className="flex items-center gap-2 border-t border-border px-5 py-3"
                    >
                      <Input
                        value={novaAulaNome[mod.uuid] ?? ''}
                        onChange={(e) =>
                          setNovaAulaNome((prev) => ({
                            ...prev,
                            [mod.uuid]: e.target.value,
                          }))
                        }
                        placeholder="Nome da aula"
                        aria-label="Nome da aula"
                        className="h-8 text-sm"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        <Plus className="size-3.5" />
                        Aula
                      </Button>
                    </form>
                  </Card>
                )
              })}
            </div>
          )}

          <Card className="mt-4 p-3">
            <form
              onSubmit={handleCriarModulo}
              className="flex items-center gap-2"
            >
              <Field label="Novo módulo" className="flex-1">
                <Input
                  value={novoModuloNome}
                  onChange={(e) => setNovoModuloNome(e.target.value)}
                  placeholder="Ex: Fundamentos"
                />
              </Field>
              <Button type="submit" size="sm" className="mt-auto">
                <Plus className="size-3.5" />
                Adicionar módulo
              </Button>
            </form>
          </Card>
        </Section>
      </div>
    </PageShell>
  )
}