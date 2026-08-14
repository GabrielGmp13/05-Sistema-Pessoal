'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Dumbbell, Gauge, RefreshCw, Scale, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getSession, sb } from '@/lib/supabase'
import { getModulosTreino, ModuloTreino, seedModulosSeNecessario } from '@/lib/modulos-treinos'
import { DadosDashboardTreino, getDadosDashboardTreino } from '@/lib/treino'
import styles from './page.module.css'

export default function TreinoHubPage() {
  const [modulos, setModulos] = useState<ModuloTreino[]>([])
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

    await seedModulosSeNecessario(sb, session.user.id)
    const [modulosAtuais, resumo] = await Promise.all([
      getModulosTreino(sb, session.user.id),
      getDadosDashboardTreino(sb, session.user.id),
    ])
    setModulos(modulosAtuais)
    setDados(resumo)
    if (!resumo) setErro('Parte do resumo de treino não pôde ser carregada.')
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const inicioSemana = useMemo(() => {
    const data = new Date()
    const deslocamento = (data.getDay() + 6) % 7
    data.setDate(data.getDate() - deslocamento)
    data.setHours(0, 0, 0, 0)
    return data
  }, [])
  const sessoesSemana = dados?.sessoes.filter((sessao) => new Date(sessao.data_inicio) >= inicioSemana).length ?? 0
  const ultimoPeso = dados?.registrosShape.find((registro) => registro.peso !== null)
  const treinosPorUuid = useMemo(() => new Map(dados?.treinos.map((treino) => [treino.uuid, treino]) ?? []), [dados])

  return (
    <main className={styles.pagina}>
      <div className={styles.container}>
        <header className={styles.cabecalho}>
          <div>
            <p className={styles.eyebrow}>Rotina física</p>
            <h1 className={styles.titulo}>Treino</h1>
            <p className={styles.subtitulo}>Planos, sessões recentes e evolução corporal em uma única visão.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCw className={carregando ? 'animate-spin' : ''} /> Atualizar
          </Button>
        </header>

        {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}

        <section className={styles.metricas} aria-label="Resumo de treino">
          <Metrica icon={CalendarDays} label="Sessões nesta semana" valor={carregando ? '...' : String(sessoesSemana)} />
          <Metrica icon={Dumbbell} label="Treinos planejados" valor={carregando ? '...' : String(dados?.treinos.length ?? 0)} />
          <Metrica icon={Activity} label="Exercícios ativos" valor={carregando ? '...' : String(dados?.totalExercicios ?? 0)} />
          <Metrica icon={Scale} label="Último peso" valor={carregando ? '...' : ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : '--'} />
        </section>

        <div className={styles.faixas}>
          <section className={styles.secao}>
            <div className={styles.secaoCabecalho}>
              <div><p className={styles.eyebrow}>Planejamento</p><h2>Modalidades</h2></div>
              <span>{modulos.length} áreas</span>
            </div>
            <div className={styles.modulos}>
              {modulos.map((modulo) => {
                const treinos = dados?.treinos.filter((treino) => treino.modulo_uuid === modulo.uuid) ?? []
                return (
                  <Link key={modulo.uuid} href={`/treino/${modulo.uuid}`} className={styles.modulo} style={{ '--cor-modulo': modulo.cor } as React.CSSProperties}>
                    <span className={styles.moduloIcone}><Gauge /></span>
                    <span className={styles.moduloTexto}><strong>{modulo.nome}</strong><small>{treinos.length} {treinos.length === 1 ? 'treino' : 'treinos'}</small></span>
                    <ArrowRight />
                  </Link>
                )
              })}
            </div>
          </section>

          <aside className={styles.shape}>
            <div><p className={styles.eyebrow}>Evolução</p><h2>Shape</h2></div>
            <Scale />
            <strong>{ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : 'Sem peso registrado'}</strong>
            <span>{ultimoPeso ? formatarData(ultimoPeso.data) : 'Fotos e histórico corporal'}</span>
            <Link href="/treino/shape">Abrir Shape <ArrowRight /></Link>
          </aside>
        </div>

        <section className={styles.secao}>
          <div className={styles.secaoCabecalho}>
            <div><p className={styles.eyebrow}>Histórico</p><h2>Sessões recentes</h2></div>
            <Sparkles />
          </div>
          {carregando ? <p className={styles.vazio}>Carregando sessões...</p> : !dados?.sessoes.length ? (
            <p className={styles.vazio}>Nenhuma sessão registrada. Abra uma modalidade e escolha um treino para começar.</p>
          ) : (
            <ul className={styles.sessoes}>
              {dados.sessoes.slice(0, 6).map((sessao) => {
                const treino = treinosPorUuid.get(sessao.treino_uuid)
                return (
                  <li key={sessao.uuid}>
                    <span className={styles.sessaoIcone}><Dumbbell /></span>
                    <span className={styles.sessaoTexto}><strong>{treino?.nome ?? 'Treino'}</strong><small>{formatarDataHora(sessao.data_inicio)}</small></span>
                    <span className={sessao.data_fim ? styles.concluida : styles.emAndamento}>{sessao.data_fim ? 'Concluída' : 'Em andamento'}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function Metrica({ icon: Icon, label, valor }: { icon: typeof Dumbbell; label: string; valor: string }) {
  return <div className={styles.metrica}><span><Icon /></span><div><strong>{valor}</strong><small>{label}</small></div></div>
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
