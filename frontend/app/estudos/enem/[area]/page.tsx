'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'
import {
  listarMateriasPorAreaEnem,
  Materia,
  AreaEnem,
  AREA_ENEM_LABELS,
} from '../../../../lib/materias'
import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { EmptyState } from '@/components/study/empty-state'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const AREAS_VALIDAS: AreaEnem[] = ['linguagens', 'humanas', 'natureza', 'matematica']

export default function AreaEnemPage() {
  const params = useParams<{ area: string }>()
  const areaParam = params.area as AreaEnem

  const [materias, setMaterias] = useState<Materia[]>([])
  const [carregando, setCarregando] = useState(true)

  const areaValida = AREAS_VALIDAS.includes(areaParam)

  useEffect(() => {
    if (!areaValida) { setCarregando(false); return }
    listarMateriasPorAreaEnem(areaParam).then((m) => {
      setMaterias(m ?? [])
      setCarregando(false)
    })
  }, [areaParam, areaValida])

  if (!areaValida) {
    return (
      <PageShell>
        <div className="mb-5">
          <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
        </div>
        <PageHeader title="Área não encontrada" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/estudos/enem">Voltar ao ENEM</BackLink>
      </div>
      <PageHeader
        title={AREA_ENEM_LABELS[areaParam]}
        description="Matérias desta área. Provas e simulados vinculados aparecem dentro de cada matéria."
      />

      <div className="mt-8">
        {carregando ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : materias.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhuma matéria nesta área"
            description="As matérias fixas são criadas automaticamente pelo sistema."
          />
        ) : (
          <Section label="Matérias" title="" count={materias.length}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {materias.map((m) => (
                <Link
                  key={m.uuid}
                  href={`/estudos/materia/${m.uuid}?from=enem`}
                  className="group focus-visible:outline-none"
                >
                  <Card className="flex items-center gap-3 p-4 transition-all hover:border-foreground/20 hover:shadow-sm group-focus-visible:ring-[3px] group-focus-visible:ring-ring/30">
                    <span className="truncate text-sm font-medium">{m.nome}</span>
                    <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Card>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </PageShell>
  )
}
