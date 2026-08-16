'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, Download } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AREA_ATIVIDADE_LABELS, AreaAtividade, AtividadeDia, listarAtividadeAnual, ResumoAtividadeAnual } from '@/lib/atividade'
import { dataLocalIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from './Historico.module.css'

type FiltroArea = 'todas' | AreaAtividade

interface CelulaDia {
  data: string
  dentroDoAno: boolean
}

function criarCelulasAno(ano: number): CelulaDia[] {
  const inicio = new Date(ano, 0, 1)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  const fim = new Date(ano, 11, 31)
  fim.setDate(fim.getDate() + (6 - fim.getDay()))
  const celulas: CelulaDia[] = []
  const cursor = new Date(inicio)
  while (cursor <= fim) {
    celulas.push({ data: dataLocalIso(cursor), dentroDoAno: cursor.getFullYear() === ano })
    cursor.setDate(cursor.getDate() + 1)
  }
  return celulas
}

function nivelAtividade(total: number) {
  if (total <= 0) return 0
  if (total === 1) return 1
  if (total <= 3) return 2
  if (total <= 6) return 3
  return 4
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function HistoricoPage() {
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [filtro, setFiltro] = useState<FiltroArea>('todas')
  const [resumo, setResumo] = useState<ResumoAtividadeAnual | null>(null)
  const [selecionado, setSelecionado] = useState<string>(dataLocalIso())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    const atual = await listarAtividadeAnual(ano)
    setResumo(atual)
    setErro(atual ? '' : 'Não foi possível carregar o histórico de atividades.')
    setCarregando(false)
  }, [ano])

  useEffect(() => {
    // O ano selecionado determina a consulta assíncrona do heatmap.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar()
  }, [carregar])

  const diasPorData = useMemo(() => new Map((resumo?.dias ?? []).map((dia) => [dia.data, dia])), [resumo])
  const celulas = useMemo(() => criarCelulasAno(ano), [ano])
  const totalDoDia = useCallback((dia?: AtividadeDia) => filtro === 'todas' ? dia?.total ?? 0 : dia?.areas[filtro] ?? 0, [filtro])
  const diasAtivos = (resumo?.dias ?? []).filter((dia) => totalDoDia(dia) > 0)
  const totalRegistros = diasAtivos.reduce((total, dia) => total + totalDoDia(dia), 0)
  const diaMaisAtivo = [...diasAtivos].sort((a, b) => totalDoDia(b) - totalDoDia(a))[0]
  const detalheSelecionado = diasPorData.get(selecionado)
  const areasDetalhe: AreaAtividade[] = filtro === 'todas'
    ? Object.keys(AREA_ATIVIDADE_LABELS) as AreaAtividade[]
    : [filtro]
  const resumoMensal = useMemo(() => Array.from({ length: 12 }, (_, mes) => {
    const prefixo = `${ano}-${String(mes + 1).padStart(2, '0')}`
    const dias = (resumo?.dias ?? []).filter((dia) => dia.data.startsWith(prefixo) && totalDoDia(dia) > 0)
    return { mes, dias: dias.length, total: dias.reduce((soma, dia) => soma + totalDoDia(dia), 0) }
  }), [ano, resumo, totalDoDia])

  function exportarCsv() {
    const cabecalho = ['data', ...areasDetalhe, 'total']
    const linhas = (resumo?.dias ?? []).filter((dia) => totalDoDia(dia) > 0).map((dia) => [dia.data, ...areasDetalhe.map((area) => dia.areas[area] ?? 0), totalDoDia(dia)])
    const csv = [cabecalho, ...linhas].map((linha) => linha.join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `historico-${ano}-${filtro}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function mudarAno(novoAno: number) {
    setAno(novoAno)
    setSelecionado(novoAno === anoAtual ? dataLocalIso() : `${novoAno}-01-01`)
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Retrospectiva</p><h1 className="mt-2 text-3xl font-semibold">Histórico de atividades</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Veja quando você registrou atividades ao longo do ano. A Agenda continua responsável apenas pelo planejamento futuro.</p></div>
          <div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" aria-label="Ano anterior" onClick={() => mudarAno(ano - 1)}><ChevronLeft /></Button><strong className="min-w-16 text-center font-mono">{ano}</strong><Button type="button" variant="outline" size="icon" aria-label="Próximo ano" disabled={ano >= anoAtual} onClick={() => mudarAno(ano + 1)}><ChevronRight /></Button></div>
        </header>

        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}
        {resumo?.parcial ? <p role="status" className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">Uma ou mais fontes não responderam; o heatmap mostra os dados disponíveis.</p> : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric label="Dias com atividade" value={String(diasAtivos.length)} />
          <Metric label="Registros no período" value={String(totalRegistros)} />
          <Metric label="Dia mais ativo" value={diaMaisAtivo ? `${new Date(`${diaMaisAtivo.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · ${totalDoDia(diaMaisAtivo)}` : '—'} />
        </div>

        <Card className="mt-5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Atividade por dia</h2><p className="mt-1 text-xs text-muted-foreground">Clique em um quadrado para ver o resumo daquele dia.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Select value={filtro} onChange={(event) => setFiltro(event.target.value as FiltroArea)} className="w-full sm:w-44" aria-label="Filtrar área"><option value="todas">Todas as áreas</option>{Object.entries(AREA_ATIVIDADE_LABELS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}</Select><Button type="button" variant="outline" size="sm" onClick={exportarCsv} disabled={totalRegistros === 0}><Download className="size-3.5" />Exportar CSV</Button></div>
          </div>

          {carregando ? <Skeleton className="mt-6 h-32 w-full" /> : (
            <div className={cn('mt-6', styles.heatmapScroll)}>
              <div className={styles.heatmap} role="grid" aria-label={`Atividades de ${ano}`}>
                {celulas.map((celula) => {
                  const total = totalDoDia(diasPorData.get(celula.data))
                  const nivel = nivelAtividade(total)
                  return <button key={celula.data} type="button" role="gridcell" className={cn(styles.dia, styles[`nivel${nivel}`], !celula.dentroDoAno && styles.foraDoAno, selecionado === celula.data && styles.diaSelecionado)} disabled={!celula.dentroDoAno} aria-label={`${formatarData(celula.data)}: ${total} ${total === 1 ? 'registro' : 'registros'}`} title={`${formatarData(celula.data)} · ${total} ${total === 1 ? 'registro' : 'registros'}`} onClick={() => setSelecionado(celula.data)} />
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground"><span>0</span>{[0, 1, 2, 3, 4].map((nivel) => <i key={nivel} className={cn('size-3 rounded-sm border border-border', styles[`nivel${nivel}`])} />)}<span>1 · 2–3 · 4–6 · 7+</span></div>
        </Card>

        <Card className="mt-5 p-5"><h2 className="font-semibold">Resumo mensal</h2><p className="mt-1 text-xs text-muted-foreground">Dias ativos e registros no filtro atual.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{resumoMensal.map((item) => <button type="button" key={item.mes} className="rounded-lg border border-border bg-secondary/40 p-3 text-left hover:bg-secondary" onClick={() => setSelecionado(`${ano}-${String(item.mes + 1).padStart(2, '0')}-01`)}><span className="block text-xs capitalize text-muted-foreground">{new Date(ano, item.mes, 1).toLocaleDateString('pt-BR', { month: 'short' })}</span><strong className="mt-1 block font-mono">{item.total}</strong><span className="text-[11px] text-muted-foreground">{item.dias} dias ativos</span></button>)}</div></Card>

        <Card className="mt-5 p-5">
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><CalendarRange className="size-4" /></span><div><p className="font-mono text-xs uppercase text-muted-foreground">Dia selecionado</p><h2 className="font-semibold">{formatarData(selecionado)}</h2></div><Badge variant="outline" className="ml-auto">{totalDoDia(detalheSelecionado)} registros</Badge></div>
          {detalheSelecionado && totalDoDia(detalheSelecionado) > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{areasDetalhe.map((area) => { const quantidade = detalheSelecionado.areas[area] ?? 0; return quantidade > 0 ? <div key={area} className="flex justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm"><span>{AREA_ATIVIDADE_LABELS[area]}</span><strong className="font-mono">{quantidade}</strong></div> : null })}</div> : <p className="mt-4 text-sm text-muted-foreground">Nenhuma atividade registrada neste dia.</p>}
        </Card>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="p-4"><strong className="block font-mono text-xl">{value}</strong><span className="mt-1 block text-xs text-muted-foreground">{label}</span></Card>
}
