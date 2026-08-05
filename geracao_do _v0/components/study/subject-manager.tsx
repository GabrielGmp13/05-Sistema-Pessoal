'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookMarked, ChevronRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/study/empty-state'
import { InlineAddForm } from '@/components/study/inline-add-form'
import { MonoLabel } from '@/components/study/mono-label'

type Subject = {
  id: string
  name: string
  topics: number
  accuracy: number | null
}

export function SubjectManager({
  initialSubjects,
  origin,
}: {
  initialSubjects: readonly {
    id: string
    name: string
    topics: number
    accuracy: number
  }[]
  origin: 'enem' | 'escola'
}) {
  const [subjects, setSubjects] = useState<Subject[]>(
    initialSubjects.map((s) => ({ ...s })),
  )

  function addSubject(name: string) {
    setSubjects((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name,
        topics: 0,
        accuracy: null,
      },
    ])
  }

  return (
    <div className="flex flex-col gap-4">
      {subjects.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Nenhuma matéria cadastrada"
          description="Adicione sua primeira matéria no campo abaixo para começar."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/materia/${s.id}?from=${origin}`}
              className="group focus-visible:outline-none"
            >
              <Card className="flex items-center gap-3 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <MonoLabel>{s.topics} conteúdos</MonoLabel>
                    {s.accuracy != null ? (
                      <MonoLabel className="text-success-foreground">
                        {s.accuracy}% acerto
                      </MonoLabel>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <InlineAddForm
        placeholder="Nome da nova matéria"
        buttonLabel="Adicionar matéria"
        onAdd={addSubject}
      />
    </div>
  )
}
