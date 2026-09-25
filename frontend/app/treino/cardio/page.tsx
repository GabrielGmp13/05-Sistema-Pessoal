'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, Clock3, MapPinned, RefreshCw } from 'lucide-react'

import { GraficoLinha } from '@/components/treino/line-chart'
import { getSession, sb } from '@/lib/supabase'
import { DadosDashboardTreino, getDadosDashboardTreino } from '@/lib/treino'
import { consolidarCardioPorDia } from '@/lib/treino-estatisticas'
import styles from './page.module.css'

export default function CardioPage() {
  const [dados, setDados] = useState<DadosDashboardTreino | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const session = await getSession()
    if (!session) {
      setErro('Não foi possível identificar a sessão atual.')
      setCarregando(false)
      return
    }
    const resumo = await getDadosDashboardTreino(sb, session.user.id)
    if (!resumo) setErro('Não foi possível carregar o histórico de cardio.')
    setDados(resumo)
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const execucoes = useMemo(() => dados?.execucoesCardio ?? [], [dados])
  const distancia = execucoes.reduce((total, execucao) => total + Number(execucao.distancia_real_km ?? 0), 0)
  const duracao = execucoes.reduce((total, execucao) => total + Number(execucao.duracao_real_minutos ?? 0), 0)
  const tendenciaDistancia = useMemo(() => consolidarCardioPorDia(execucoes, 'distancia'), [execucoes])
  const tendenciaDuracao = useMemo(() => consolidarCardioPorDia(execucoes, 'duracao'), [execucoes])

  return (
    <main className={styles.pagina}>
      <div className={styles.container}>
        <div className={styles.cabecalho}>
          <div><Link href="/treino" className={styles.voltar}><ArrowLeft /> Treino</Link><h1>Cardio</h1><p>Distância e duração nas últimas 360 atividades concluídas. Os gráficos mostram até 30 dias com registros.</p></div>
          <button type="button" className={styles.atualizar} onClick={() => void carregar()} disabled={carregando}><RefreshCw className={carregando ? styles.girando : ''} /> Atualizar</button>
        </div>
        {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
        <section className={styles.metricas} aria-label="Resumo de cardio">
          <Metrica icone={MapPinned} rotulo="Distância no recorte" valor={carregando || erro ? '—' : `${formatarDecimal(distancia)} km`} />
          <Metrica icone={Clock3} rotulo="Duração no recorte" valor={carregando || erro ? '—' : formatarDuracao(duracao)} />
          <Metrica icone={Activity} rotulo="Atividades no recorte" valor={carregando || erro ? '—' : String(execucoes.length)} />
        </section>
        <section className={styles.graficos}>
          <article className={styles.grafico}><h2>Distância por dia</h2><GraficoLinha ariaLabel="Evolução da distância de cardio por dia" pontos={tendenciaDistancia} sufixo=" km" /></article>
          <article className={styles.grafico}><h2>Duração por dia</h2><GraficoLinha ariaLabel="Evolução da duração de cardio por dia" pontos={tendenciaDuracao} sufixo=" min" /></article>
        </section>
      </div>
    </main>
  )
}

function Metrica({ icone: Icone, rotulo, valor }: { icone: typeof Activity; rotulo: string; valor: string }) {
  return <article className={styles.metrica}><Icone /><div><strong>{valor}</strong><span>{rotulo}</span></div></article>
}

function formatarDecimal(valor: number) { return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor) }
function formatarDuracao(minutos: number) { return minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)}h${minutos % 60 ? ` ${minutos % 60}min` : ''}` }
