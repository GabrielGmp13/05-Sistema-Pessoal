'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'
import {
  listarMaterias,
  Materia,
  AreaEnem,
  AREA_ENEM_LABELS,
} from '../../../../lib/materias'
import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { Section } from '@/components/study/section'
import { EmptyState } from '@/components/study/empty-state'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GerenciarMateriasEnem } from './GerenciarMateriasEnem'

const AREAS_VALIDAS: AreaEnem[] = ['linguagens', 'humanas', 'natureza', 'matematica']

export default function AreaEnemPage() {
  const params = useParams<{ area: string }>()
  const areaParam = params.area as AreaEnem

  const [materias, setMaterias] = useState<Materia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const areaValida = AREAS_VALIDAS.includes(areaParam)
  const materiasDaArea = materias.filter((materia) => materia.mostra_enem && materia.area_enem === areaParam)

  const recarregar = useCallback(async () => {
    const resultado = await listarMaterias('academica')
    if (resultado === null) throw new Error('leitura')
    setMaterias(resultado)
    setErro('')
  }, [])

  useEffect(() => {
    if (!areaValida) return
    let ativo = true
    void Promise.resolve().then(recarregar).catch(() => { if (ativo) setErro('Não foi possível carregar as matérias. Recarregue a página.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [areaValida, recarregar])

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
        description="Crie uma matéria ou aproveite uma existente. Conteúdos e simulados ficam dentro de cada matéria."
      />

      <div className="mt-8">
        {erro ? <p role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}
        {carregando ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : erro ? null : <div className="space-y-6">
          <GerenciarMateriasEnem area={areaParam} materias={materias} recarregar={recarregar} />
          {materiasDaArea.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhuma matéria nesta área"
            description="Crie uma matéria ou adicione uma existente no painel acima."
          />
        ) : (
          <Section label="Matérias" title="" count={materiasDaArea.length}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {materiasDaArea.map((m) => (
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
        )}</div>}
      </div>
    </PageShell>
  )
}
