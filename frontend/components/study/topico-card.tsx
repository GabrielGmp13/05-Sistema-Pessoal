'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarClock, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { TopicoComDados } from '@/lib/topicos-estudo'
import { GraficoDonut } from './grafico-donut'
import { useState } from 'react'

function dataPtBr(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

function resumoSubtopicos(topico: TopicoComDados) {
  const nomes = topico.subtopicos.map((item) => item.nome)
  if (nomes.length === 0) return 'Nenhum subtópico cadastrado'
  if (nomes.length === 1 && nomes[0].localeCompare(topico.nome, undefined, { sensitivity: 'base' }) === 0) {
    return '1 subtópico inicial de compatibilidade'
  }
  const exibidos = nomes.slice(0, 3).join(', ')
  return nomes.length > 3 ? `${exibidos} e mais ${nomes.length - 3}` : exibidos
}

export function TopicoCard({ topico, materiaUuid }: { topico: TopicoComDados; materiaUuid: string }) {
  const [revisaoAberta, setRevisaoAberta] = useState(false)
  const detalheHref = `/estudos/materia/${materiaUuid}/topico/${topico.uuid}`
  return (
    <Card className="relative overflow-hidden p-4 transition-colors hover:border-foreground/25 sm:p-5">
      <Link href={detalheHref} className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40" aria-label={`Abrir tópico ${topico.nome}`} />
      <div className="relative z-[1] pointer-events-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{topico.nome}</h3>
              {topico.vinculo.escopo_ambiguo ? <Badge variant="warning"><AlertTriangle />Escopo a confirmar</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{resumoSubtopicos(topico)}</p>
          </div>
          <Button type="button" size="sm" className="pointer-events-auto relative z-10" onClick={() => setRevisaoAberta(true)}>
            <RotateCcw />Revisar conteúdo completo
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(12rem,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium">Progresso de teoria</span>
              <span className="text-muted-foreground">{topico.metricas.progresso === null ? 'Sem subtópicos' : `${topico.metricas.progresso}%`}</span>
            </div>
            <Progress value={topico.metricas.progresso ?? 0} aria-label={`Progresso de ${topico.nome}`} />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {topico.metricas.proximaRevisao ? (
                <Badge variant={topico.metricas.revisaoAtrasada ? 'warning' : 'outline'}>
                  <CalendarClock />{topico.metricas.revisaoAtrasada ? 'Atrasada' : 'Próxima'}: {dataPtBr(topico.metricas.proximaRevisao)}
                </Badge>
              ) : <Badge variant="outline">Sem revisão agendada</Badge>}
              <Badge variant="outline">{topico.metricas.revisoesConcluidas} revisões registradas desde a V2.3</Badge>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <GraficoDonut label="Revisão" dados={topico.metricas.revisao} />
            <GraficoDonut label="Provas" dados={topico.metricas.prova} />
            <GraficoDonut label="Simulados" dados={topico.metricas.simulado} />
            <GraficoDonut label="Geral" dados={topico.metricas.geral} />
          </div>
        </div>
      </div>

      <Dialog open={revisaoAberta} onOpenChange={setRevisaoAberta} title="Revisar conteúdo completo" description={topico.nome} className="max-w-md">
        <div className="py-10 text-center text-sm text-muted-foreground">Em breve.</div>
      </Dialog>
    </Card>
  )
}
