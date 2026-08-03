'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, Plus, Search } from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { MonoLabel } from '@/components/study/mono-label'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { listarMaterias, criarMateria, Materia } from '../../../lib/materias'

type Filter = 'todos' | 'em-andamento' | 'concluido'

export default function CursoListaPage() {
  const [cursos, setCursos] = useState<Materia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')

  const [nome, setNome] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [cargaHoraria, setCargaHoraria] = useState('')

  async function carregar() {
    const m = await listarMaterias('curso')
    setCursos(m ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    return cursos.filter((c) => {
      const matchQuery =
        c.nome.toLowerCase().includes(query.toLowerCase()) ||
        (c.plataforma ?? '').toLowerCase().includes(query.toLowerCase())
      const matchFilter =
        filter === 'todos' ||
        (filter === 'concluido' ? c.concluido : !c.concluido)
      return matchQuery && matchFilter
    })
  }, [cursos, query, filter])

  async function handleCriarCurso(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await criarMateria({
      nome: nome.trim(),
      tipo: 'curso',
      cor: null,
      area_enem: null, // curso nunca tem área ENEM
      mostra_escola: false, // flags só têm sentido pra matéria tipo 'academica'
      mostra_enem: false,
      plataforma: plataforma.trim() || null,
      carga_horaria_total_horas: cargaHoraria ? Number(cargaHoraria) : null,
      horas_dedicadas: 0,
      certificado_path: null,
      concluido: false,
      data_conclusao: null,
    })
    setNome('')
    setPlataforma('')
    setCargaHoraria('')
    await carregar()
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo Curso"
        title="Cursos"
        description="Acompanhe seus cursos livres, o progresso das aulas e a carga horária total."
      />

      <div className="mt-8 flex flex-col gap-10">
        <Section label="Novo" title="Adicionar curso">
          <Card className="p-5">
            <form
              onSubmit={handleCriarCurso}
              className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end"
            >
              <Field label="Nome do curso">
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: TypeScript avançado"
                />
              </Field>
              <Field label="Plataforma" optional>
                <Input
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  placeholder="Ex: Udemy"
                />
              </Field>
              <Field label="Horas" optional>
                <Input
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="sm:w-24"
                />
              </Field>
              <Button type="submit" size="lg">
                <Plus className="size-4" />
                Adicionar
              </Button>
            </form>
          </Card>
        </Section>

        <Section
          label="Biblioteca"
          title="Meus cursos"
          count={filtrados.length}
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar"
                  aria-label="Buscar cursos"
                  className="h-8 w-36 pl-8 text-sm sm:w-44"
                />
              </div>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
                aria-label="Filtrar por status"
                className="h-8 w-auto text-sm"
              >
                <option value="todos">Todos</option>
                <option value="em-andamento">Em andamento</option>
                <option value="concluido">Concluídos</option>
              </Select>
            </div>
          }
        >
          {carregando ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Nenhum curso encontrado"
              description="Ajuste a busca ou adicione um novo curso acima."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtrados.map((c) => (
                <Link
                  key={c.uuid}
                  href={`/estudos/curso/${c.uuid}`}
                  className="group focus-visible:outline-none"
                >
                  <Card className="flex h-full flex-col gap-4 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                        <BookOpen className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{c.nome}</span>
                        <MonoLabel>
                          {c.plataforma ?? 'Sem plataforma'}
                          {c.carga_horaria_total_horas != null
                            ? ` · ${c.carga_horaria_total_horas}h`
                            : ''}
                        </MonoLabel>
                      </div>
                      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={c.concluido ? 'success' : 'default'}>
                          {c.concluido ? 'Concluído' : 'Em andamento'}
                        </Badge>
                      </div>
                      <Progress value={c.concluido ? 100 : 0} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageShell>
  )
}