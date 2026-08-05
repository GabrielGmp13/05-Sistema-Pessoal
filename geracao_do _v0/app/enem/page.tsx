'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, FileCheck2, Plus } from 'lucide-react'

import {
  BackLink,
  PageHeader,
  PageShell,
} from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { SubjectManager } from '@/components/study/subject-manager'
import { EmptyState } from '@/components/study/empty-state'
import { MonoLabel } from '@/components/study/mono-label'
import { Field } from '@/components/study/field'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { enemExams, enemSubjects, formatDate } from '@/lib/study-data'

type Exam = {
  id: string
  date: string
  day: string
  title: string
}

export default function EnemPage() {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>(enemExams.map((e) => ({ ...e })))
  const [day, setDay] = useState('Dia 1')
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  function addExam(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setExams((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, date, day, title: title.trim() },
    ])
    setDate('')
    setTitle('')
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/">Voltar ao Hub</BackLink>
      </div>
      <PageHeader
        eyebrow="Mundo ENEM"
        title="ENEM"
        description="Gerencie suas áreas de conhecimento e acompanhe as provas oficiais do Dia 1 e Dia 2."
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <Section
            label="Bloco 1"
            title="Áreas de conhecimento"
            count={enemSubjects.length}
          >
            <SubjectManager initialSubjects={enemSubjects} origin="enem" />
          </Section>

          <Section label="Bloco 2" title="Provas ENEM" count={exams.length}>
            <div className="flex flex-col gap-4">
              {exams.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Nenhuma prova agendada"
                  description="Agende o Dia 1 ou Dia 2 no formulário abaixo."
                />
              ) : (
                <Card className="divide-y divide-border overflow-hidden">
                  {exams.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-4"
                    >
                      <Badge variant={ex.day === 'Dia 1' ? 'success' : 'default'}>
                        {ex.day}
                      </Badge>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {ex.title || 'Prova ENEM'}
                        </span>
                        <MonoLabel>{formatDate(ex.date)}</MonoLabel>
                      </div>
                      <Link
                        href="/enem/gabarito"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'ml-auto',
                        )}
                      >
                        <FileCheck2 className="size-3.5" />
                        Lançar gabarito
                      </Link>
                    </div>
                  ))}
                </Card>
              )}

              <Card className="p-5">
                <form onSubmit={addExam} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Dia da prova">
                      <Select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        aria-label="Dia da prova"
                      >
                        <option>Dia 1</option>
                        <option>Dia 2</option>
                      </Select>
                    </Field>
                    <Field label="Data">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </Field>
                    <Field label="Título" optional>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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
