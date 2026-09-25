'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Clock3, Dumbbell, Gauge, Pencil, Plus, RefreshCw, Scale, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { GraficoLinha } from '@/components/treino/line-chart'
import { PresencasTreino } from '@/components/treino/PresencasTreino'
import { volumePorGrupo } from '@/lib/treino-estatisticas'
import { getSession, sb } from '@/lib/supabase'
import { getModulosTreino, ModuloTreino, seedModulosSeNecessario } from '@/lib/modulos-treinos'
import { DadosDashboardTreino, getDadosDashboardTreino, removerPlanejamentoSemanal, salvarPlanejamentoSemanal } from '@/lib/treino'
import styles from './page.module.css'

export default function TreinoHubPage() {
  const [modulos, setModulos] = useState<ModuloTreino[]>([])
  const [dados, setDados] = useState<DadosDashboardTreino | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [fotosShape, setFotosShape] = useState<string[]>([])
  const [fotoShapeAtiva, setFotoShapeAtiva] = useState(0)
  const [usuarioUuid, setUsuarioUuid] = useState('')
  const [planejamentoForm, setPlanejamentoForm] = useState({ uuid: '', dia: '1', treinoUuid: '' })
  const [salvandoPlanejamento, setSalvandoPlanejamento] = useState(false)
  const [excluirPlanejamento, setExcluirPlanejamento] = useState<string | null>(null)
  const [exercicioSelecionado, setExercicioSelecionado] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const session = await getSession()
    if (!session) {
      setErro('Não foi possível identificar a sessão atual.')
      setCarregando(false)
      return
    }
    setUsuarioUuid(session.user.id)

    await seedModulosSeNecessario(sb, session.user.id)
    const [modulosAtuais, resumo] = await Promise.all([
      getModulosTreino(sb, session.user.id),
      getDadosDashboardTreino(sb, session.user.id),
    ])
    setModulos(modulosAtuais)
    setDados(resumo)
    if (resumo) {
      const fotos = resumo.registrosShape.filter((registro) => registro.foto_path).slice(0, 6)
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

  const sessoesSemana = dados?.sessoesSemana.filter((sessao) => sessao.data_fim).length ?? 0
  const volumeSemana = useMemo(() => volumePorGrupo(dados?.seriesSemana ?? [], dados?.exerciciosForca ?? []), [dados])
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
  const diasDaSemana = useMemo(() => semanaAtual(), [])
  const historicoPeso = useMemo(() => (dados?.registrosShape ?? [])
    .filter((registro) => registro.peso !== null)
    .slice(0, 24)
    .reverse()
    .map((registro) => ({ label: formatarDataCurta(registro.data), valor: Number(registro.peso) })), [dados])
  const exercicioAtivo = exercicioSelecionado || dados?.exerciciosForca[0]?.uuid || ''
  const historicoCarga = useMemo(() => (dados?.execucoesForca ?? [])
    .filter((execucao) => execucao.exercicio_uuid === exercicioAtivo && execucao.carga_real !== null)
    .slice(-24)
    .map((execucao) => ({ label: formatarDataHoraCurta(execucao.data_hora), valor: Number(execucao.carga_real) })), [dados, exercicioAtivo])
  const cardioSemana = useMemo(() => {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 6)
    inicio.setHours(0, 0, 0, 0)
    return (dados?.execucoesCardio ?? []).filter((execucao) => new Date(execucao.data_hora) >= inicio)
  }, [dados])
  const distanciaCardioSemana = cardioSemana.reduce((total, execucao) => total + Number(execucao.distancia_real_km ?? 0), 0)
  const duracaoCardioSemana = cardioSemana.reduce((total, execucao) => total + Number(execucao.duracao_real_minutos ?? 0), 0)

  async function salvarPlanejamento(event: React.FormEvent) {
    event.preventDefault()
    if (!usuarioUuid || !planejamentoForm.treinoUuid) return
    setSalvandoPlanejamento(true)
    const resultado = await salvarPlanejamentoSemanal(sb, usuarioUuid, planejamentoForm.treinoUuid, Number(planejamentoForm.dia), planejamentoForm.uuid || undefined)
    if (resultado.error) setErro('Não foi possível salvar o planejamento semanal. Verifique se o mesmo treino já está neste dia.')
    else {
      setPlanejamentoForm({ uuid: '', dia: '1', treinoUuid: '' })
      await carregar()
    }
    setSalvandoPlanejamento(false)
  }

  async function removerPlanejamento(uuid: string) {
    if (!usuarioUuid) return
    try {
      if (!(await removerPlanejamentoSemanal(sb, usuarioUuid, uuid))) setErro('Não foi possível remover o item do planejamento.')
      else {
        if (planejamentoForm.uuid === uuid) setPlanejamentoForm({ uuid: '', dia: '1', treinoUuid: '' })
        await carregar()
      }
    } catch { setErro('Não foi possível confirmar a remoção. Atualize a página antes de tentar novamente.') }
  }

  return (
    <main className={styles.pagina}>
      <ConfirmDialog open={Boolean(excluirPlanejamento)} onOpenChange={aberto => { if (!aberto) setExcluirPlanejamento(null) }}
        title="Remover do planejamento?" description="Somente este item semanal será removido. O treino e as sessões realizadas serão preservados."
        confirmLabel="Remover" onConfirm={async () => { if (excluirPlanejamento) await removerPlanejamento(excluirPlanejamento) }} />
      <div className={styles.container}>
        <header className={styles.cabecalho}>
          <div>
            <h1 className={styles.titulo}>Treino</h1>
            <p className={styles.subtitulo}>Planos, sessões recentes e evolução corporal em uma única visão.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCw className={carregando ? 'animate-spin' : ''} /> Atualizar
          </Button>
        </header>
        <PresencasTreino />

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
              <div className={styles.shapeCabecalho}><p className={styles.eyebrow}>Evolução</p><h2>Shape</h2></div>
              <div className={styles.shapeRodape}>
                <Scale />
                <strong>{ultimoPeso?.peso ? `${ultimoPeso.peso} kg` : 'Sem peso registrado'}</strong>
                <span>{ultimoPeso ? formatarData(ultimoPeso.data) : 'Fotos e histórico corporal'}</span>
                <Link href="/treino/shape">Abrir Shape <ArrowRight /></Link>
              </div>
            </div>
          </aside>
        </div>

        <section className={styles.secao}>
          <div className={styles.secaoCabecalho}>
            <div><p className={styles.eyebrow}>Semana atual</p><h2>Planejamento semanal</h2></div>
            <span>Rotina de segunda a domingo</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {diasDaSemana.map((dia) => {
              const itens = dados?.planejamentoSemanal.filter((item) => item.dia_semana === dia.numero) ?? []
              return <article key={dia.numero} className="min-w-0 rounded-xl border border-border bg-card/80 p-3 text-card-foreground shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dia.nome}</p>
                <strong className="mt-1 block text-lg">{dia.data}</strong>
                <div className="mt-3 space-y-2">{itens.length === 0 ? <p className="text-xs text-muted-foreground">Descanso / livre</p> : itens.map((item) => <div key={item.uuid} className="rounded-lg bg-secondary/70 p-2"><p className="truncate text-xs font-medium">{treinosPorUuid.get(item.treino_uuid)?.nome ?? 'Treino'}</p><div className="mt-1 flex justify-end gap-1"><Button type="button" variant="ghost" size="icon-xs" onClick={() => setPlanejamentoForm({ uuid: item.uuid, dia: String(item.dia_semana), treinoUuid: item.treino_uuid })} aria-label="Editar planejamento"><Pencil /></Button><Button type="button" variant="ghost" size="icon-xs" onClick={() => setExcluirPlanejamento(item.uuid)} aria-label="Remover planejamento"><Trash2 /></Button></div></div>)}</div>
              </article>
            })}
          </div>
          <form onSubmit={salvarPlanejamento} className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-card/70 p-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">Dia<select className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground" value={planejamentoForm.dia} onChange={(event) => setPlanejamentoForm((atual) => ({ ...atual, dia: event.target.value }))}>{diasDaSemana.map((dia) => <option key={dia.numero} value={dia.numero}>{dia.nome}</option>)}</select></label>
            <label className="flex flex-[2] flex-col gap-1 text-xs font-medium text-muted-foreground">Treino<select required className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground" value={planejamentoForm.treinoUuid} onChange={(event) => setPlanejamentoForm((atual) => ({ ...atual, treinoUuid: event.target.value }))}><option value="">Selecione</option>{dados?.treinos.map((treino) => <option key={treino.uuid} value={treino.uuid}>{treino.nome}</option>)}</select></label>
            <Button type="submit" disabled={salvandoPlanejamento || !planejamentoForm.treinoUuid}><Plus />{planejamentoForm.uuid ? 'Atualizar' : 'Adicionar'}</Button>
            {planejamentoForm.uuid ? <Button type="button" variant="ghost" onClick={() => setPlanejamentoForm({ uuid: '', dia: '1', treinoUuid: '' })}>Cancelar</Button> : null}
          </form>
        </section>

        <section className={styles.secao}>
          <div className={styles.secaoCabecalho}>
            <div><p className={styles.eyebrow}>Evolução</p><h2>Dados que acompanham seu treino</h2></div>
            <span>Histórico pessoal, sem estimativas</span>
          </div>
          <div className={styles.graficos}>
            <article className={styles.grafico}>
              <div className={styles.graficoCabecalho}><div><h3>Peso corporal</h3><p>Registros de Shape</p></div><Link href="/treino/shape">Registrar <ArrowRight /></Link></div>
              <GraficoLinha ariaLabel="Evolução do peso corporal" pontos={historicoPeso} sufixo=" kg" />
            </article>
            <article className={styles.grafico}>
              <div className={styles.graficoCabecalho}><div><h3>Carga por exercício</h3><p>Até 24 séries deste exercício, entre as 360 séries concluídas mais recentes.</p></div></div>
              {dados?.exerciciosForca.length ? <label className={styles.seletorGrafico}>Exercício<select value={exercicioAtivo} onChange={(event) => setExercicioSelecionado(event.target.value)}>{dados.exerciciosForca.map((exercicio) => <option key={exercicio.uuid} value={exercicio.uuid}>{exercicio.nome}</option>)}</select></label> : null}
              <GraficoLinha ariaLabel="Evolução de carga do exercício selecionado" pontos={historicoCarga} sufixo=" kg" />
            </article>
            <article className={styles.grafico}>
              <div className={styles.graficoCabecalho}><div><h3>Cardio nos últimos 7 dias</h3><p>Dentro das 360 atividades concluídas mais recentes.</p></div><Link href="/treino/cardio">Ver histórico <ArrowRight /></Link></div>
              <div className={styles.cardioResumo}><strong>{formatarDecimal(distanciaCardioSemana)} km</strong><span>{formatarDuracao(duracaoCardioSemana)} · {cardioSemana.length} {cardioSemana.length === 1 ? 'atividade' : 'atividades'}</span></div>
            </article>
          </div>
        </section>

        <section className={styles.secao}>
          <div className={styles.secaoCabecalho}>
            <div><p className={styles.eyebrow}>Semana atual</p><h2>Volume por grupo muscular</h2></div>
          </div>
          <p>Somente séries de sessões finalizadas. A classificação usa o grupo atual do exercício.</p>
          {volumeSemana.length ? <ul className={styles.sessoes}>{volumeSemana.map((item) => <li key={item.grupo}>
            <span className={styles.sessaoTexto}><strong>{item.grupo}</strong><small>{item.series} séries concluídas · {item.seriesComVolume} com carga e repetições informadas</small></span>
            <span>{item.seriesComVolume ? `${formatarDecimal(item.volume)} kg × reps` : 'Volume não informado'}</span>
          </li>)}</ul> : <p className={styles.vazio}>Nenhuma série concluída nesta semana.</p>}
        </section>

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

function formatarDataCurta(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatarDataHoraCurta(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatarDecimal(valor: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
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

function semanaAtual() {
  const hoje = new Date()
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7))
  const nomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  return nomes.map((nome, indice) => {
    const data = new Date(segunda)
    data.setDate(segunda.getDate() + indice)
    return { numero: indice + 1, nome, data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
  })
}
