'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Clock3, Dumbbell, Gauge, RefreshCw, Scale, Sparkles } from 'lucide-react'

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
  const [fotosShape, setFotosShape] = useState<string[]>([])
  const [fotoShapeAtiva, setFotoShapeAtiva] = useState(0)

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
    if (resumo) {
      const fotos = resumo.registrosShape.filter((registro) => registro.foto_path)
      const urls = await Promise.all(fotos.map(async (registro) => {
        const { data } = await sb.storage.from('shape').createSignedUrl(registro.foto_path as string, 3600)
        return data?.signedUrl ?? null
      }))
      setFotosShape(urls.filter((url): url is string => Boolean(url)))
      setFotoShapeAtiva(0)
    } else {
      setFotosShape([])
    }
    if (!resumo) setErro('Parte do resumo de treino não pôde ser carregada.')
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  useEffect(() => {
    if (fotosShape.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const intervalId = window.setInterval(() => {
      setFotoShapeAtiva((atual) => (atual + 1) % fotosShape.length)
    }, 6000)
    return () => window.clearInterval(intervalId)
  }, [fotosShape])

  const sessoesSemana = dados?.sessoesSemana.length ?? 0
  const duracaoSemanaMinutos = dados?.sessoesSemana
    .reduce((total, sessao) => total + (duracaoSessao(sessao.data_inicio, sessao.data_fim) ?? 0), 0) ?? 0
  const ultimoPeso = dados?.registrosShape.find((registro) => registro.peso !== null)
  const treinosPorUuid = useMemo(() => new Map(dados?.treinos.map((treino) => [treino.uuid, treino]) ?? []), [dados])
  const progressoModulos = useMemo(() => {
    const moduloPorTreino = new Map(dados?.treinos.map((treino) => [treino.uuid, treino.modulo_uuid]) ?? [])
    const sessoesPorModulo = new Map<string, number>()
    for (const sessao of dados?.sessoesConcluidas ?? []) {
      const moduloUuid = moduloPorTreino.get(sessao.treino_uuid)
      if (moduloUuid) sessoesPorModulo.set(moduloUuid, (sessoesPorModulo.get(moduloUuid) ?? 0) + 1)
    }
    return modulos.map((modulo) => {
      const sessoes = sessoesPorModulo.get(modulo.uuid) ?? 0
      return { ...modulo, sessoes, pontos: sessoes * 10 }
    })
  }, [dados, modulos])
  const maiorPontuacao = Math.max(1, ...progressoModulos.map((modulo) => modulo.pontos))

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
          <Metrica icon={Clock3} label="Tempo nesta semana" valor={carregando ? '...' : formatarDuracao(duracaoSemanaMinutos)} />
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
            {fotosShape[fotoShapeAtiva] ? <span aria-hidden="true" className={styles.shapeFundo} style={{ backgroundImage: `url(${fotosShape[fotoShapeAtiva]})` }} /> : null}
            <span aria-hidden="true" className={styles.shapeMascara} />
            <div className={styles.shapeConteudo}>
              <div><p className={styles.eyebrow}>Evolução</p><h2>Shape</h2></div>
              <Scale />
              <strong>{ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : 'Sem peso registrado'}</strong>
              <span>{ultimoPeso ? formatarData(ultimoPeso.data) : 'Fotos e histórico corporal'}</span>
              <Link href="/treino/shape">Abrir Shape <ArrowRight /></Link>
            </div>
          </aside>
        </div>

        <section className={styles.secao}>
          <div className={styles.secaoCabecalho}>
            <div><p className={styles.eyebrow}>Pontuação pessoal</p><h2>Progresso por modalidade</h2></div>
            <span>10 pontos por sessão concluída</span>
          </div>
          {progressoModulos.every((modulo) => modulo.pontos === 0) ? (
            <p className={styles.vazio}>Finalize sessões para começar sua pontuação por modalidade.</p>
          ) : (
            <div className={styles.progressoModulos}>
              {progressoModulos.map((modulo) => (
                <div key={modulo.uuid} className={styles.progressoModulo}>
                  <div><strong>{modulo.nome}</strong><span>{modulo.pontos} pts · {modulo.sessoes} {modulo.sessoes === 1 ? 'sessão' : 'sessões'}</span></div>
                  <div className={styles.progressoTrilho} aria-label={`${modulo.nome}: ${modulo.pontos} pontos`}><span style={{ width: `${(modulo.pontos / maiorPontuacao) * 100}%`, backgroundColor: modulo.cor }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                    <span className={styles.sessaoTexto}><strong>{treino?.nome ?? 'Treino'}</strong><small>{formatarDataHora(sessao.data_inicio)}{sessao.data_fim ? ` · ${formatarDuracao(duracaoSessao(sessao.data_inicio, sessao.data_fim) ?? 0)}` : ''}</small></span>
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

function duracaoSessao(inicio: string, fim: string | null) {
  if (!fim) return null
  const minutos = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60_000)
  return minutos > 0 ? minutos : null
}

function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return restante ? `${horas}h ${restante}min` : `${horas}h`
}
