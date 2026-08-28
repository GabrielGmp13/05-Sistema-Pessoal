'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Brain,
  CalendarDays,
  CalendarRange,
  Code2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Languages,
  NotebookTabs,
  RefreshCw,
  Star,
  Utensils,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EventoAgenda, listarEventosAgenda } from '@/lib/agenda'
import { dataLocalIso } from '@/lib/date'
import { listarProvasNoPeriodo, listarProximasProvas, Prova } from '@/lib/provas'
import { CardRevisao, listarCardsRevisao } from '@/lib/revisao'
import { buscarResumoTempoEstudo, ResumoTempoEstudo } from '@/lib/sessoes-estudo'
import { listarProjetos, listarTodasTarefasProjetos, Projeto, TarefaProjeto } from '@/lib/projetos'
import { listarReceitas, Receita } from '@/lib/receitas'
import { buscarDadosInsights, DadosInsights } from '@/lib/insights'
import { listarHumor, RegistroHumor } from '@/lib/saude'
import { InvestimentoFinanceiro, LancamentoFinanceiro, listarInvestimentosFinanceiros, listarLancamentosFinanceiros } from '@/lib/financas'
import { listarLugares, Lugar } from '@/lib/lugares'
import { buscarResumoIdiomasHub, ResumoIdiomasHub } from '@/lib/idiomas'
import { listarAtividadeAnual, ResumoAtividadeAnual } from '@/lib/atividade'

const modules = [
  {
    href: '/treino',
    title: 'Treino',
    description: 'Planejamento, execução na academia e acompanhamento do shape.',
    icon: Dumbbell,
    status: 'Rotina ativa',
  },
  {
    href: '/biblioteca',
    title: 'Biblioteca',
    description: 'Obras, podcasts, vídeos e artigos no seu acervo pessoal.',
    icon: BookOpen,
    status: 'Acervo',
  },
  {
    href: '/estudos',
    title: 'Estudos',
    description: 'ENEM, escola, cursos, redações e registros de estudo.',
    icon: GraduationCap,
    status: 'Hub acadêmico',
  },
  {
    href: '/idiomas',
    title: 'Idiomas',
    description: 'Vocabulário, práticas, objetivos e tempo dedicado.',
    icon: Languages,
    status: 'Aprendizado',
  },
  {
    href: '/revisao',
    title: 'Revisão Espaçada',
    description: 'Cards vencidos e futuros com intervalos calculados pelo SM-2.',
    icon: Brain,
    status: 'Memória ativa',
  },
  {
    href: '/agenda',
    title: 'Agenda',
    description: 'Compromissos, estudos, provas e treinos organizados por data.',
    icon: CalendarDays,
    status: 'Planejamento',
  },
  {
    href: '/historico',
    title: 'Histórico',
    description: 'Heatmap anual das atividades registradas em todos os módulos.',
    icon: CalendarRange,
    status: 'Retrospectiva',
  },
  {
    href: '/projetos',
    title: 'Projetos',
    description: 'Iniciativas e tarefas organizadas por etapa de execução.',
    icon: FolderKanban,
    status: 'Em andamento',
  },
  {
    href: '/programacao',
    title: 'Programação',
    description: 'Projetos técnicos com repositório, linguagem, status e destaques.',
    icon: Code2,
    status: 'Construção',
  },
  {
    href: '/diario',
    title: 'Diário',
    description: 'Saúde, finanças, lugares e receitas reunidos em uma visão pessoal.',
    icon: NotebookTabs,
    status: 'Vida cotidiana',
  },
]

interface DadosHub {
  tempo: ResumoTempoEstudo | null
  eventos: EventoAgenda[] | null
  proximosEventos: EventoAgenda[] | null
  provas: Prova[] | null
  proximasProvas: Prova[] | null
  revisoes: CardRevisao[] | null
  projetos: Projeto[] | null
  receitas: Receita[] | null
  insights: DadosInsights | null
  tarefasProjetos: TarefaProjeto[] | null
  humor: RegistroHumor[] | null
  lancamentos: LancamentoFinanceiro[] | null
  investimentos: InvestimentoFinanceiro[] | null
  lugares: Lugar[] | null
  idiomas: ResumoIdiomasHub | null
  atividade: ResumoAtividadeAnual | null
}

const DADOS_INICIAIS: DadosHub = {
  tempo: null,
  eventos: null,
  proximosEventos: null,
  provas: null,
  proximasProvas: null,
  revisoes: null,
  projetos: null,
  receitas: null,
  insights: null,
  tarefasProjetos: null,
  humor: null,
  lancamentos: null,
  investimentos: null,
  lugares: null,
  idiomas: null,
  atividade: null,
}

function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return restante > 0 ? `${horas}h ${restante}min` : `${horas}h`
}

export default function HomePage() {
  const [dados, setDados] = useState<DadosHub>(DADOS_INICIAIS)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const dataHoje = dataLocalIso()
    const daquiSeteDias = adicionarDias(dataHoje, 7)
    const resultados = await Promise.allSettled([
      buscarResumoTempoEstudo(),
      listarEventosAgenda(dataHoje, dataHoje),
      listarEventosAgenda(dataHoje, daquiSeteDias),
      listarProvasNoPeriodo(dataHoje, dataHoje),
      listarProximasProvas(),
      listarCardsRevisao(),
      listarProjetos(),
      listarReceitas(),
      buscarDadosInsights(),
      listarTodasTarefasProjetos(),
      listarHumor(),
      listarLancamentosFinanceiros(),
      listarLugares(),
      buscarResumoIdiomasHub(),
      listarAtividadeAnual(Number(dataHoje.slice(0, 4))),
      listarInvestimentosFinanceiros(),
    ])
    setDados({
      tempo: resultados[0].status === 'fulfilled' ? resultados[0].value : null,
      eventos: resultados[1].status === 'fulfilled' ? resultados[1].value : null,
      proximosEventos: resultados[2].status === 'fulfilled' ? resultados[2].value : null,
      provas: resultados[3].status === 'fulfilled' ? resultados[3].value : null,
      proximasProvas: resultados[4].status === 'fulfilled' ? resultados[4].value : null,
      revisoes: resultados[5].status === 'fulfilled' ? resultados[5].value : null,
      projetos: resultados[6].status === 'fulfilled' ? resultados[6].value : null,
      receitas: resultados[7].status === 'fulfilled' ? resultados[7].value : null,
      insights: resultados[8].status === 'fulfilled' ? resultados[8].value : null,
      tarefasProjetos: resultados[9].status === 'fulfilled' ? resultados[9].value : null,
      humor: resultados[10].status === 'fulfilled' ? resultados[10].value : null,
      lancamentos: resultados[11].status === 'fulfilled' ? resultados[11].value : null,
      lugares: resultados[12].status === 'fulfilled' ? resultados[12].value : null,
      idiomas: resultados[13].status === 'fulfilled' ? resultados[13].value : null,
      atividade: resultados[14].status === 'fulfilled' ? resultados[14].value : null,
      investimentos: resultados[15].status === 'fulfilled' ? resultados[15].value : null,
    })
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const dataHoje = dataLocalIso()
  const revisoesPendentes = useMemo(
    () => dados.revisoes?.filter((card) => card.proxima_revisao <= dataHoje) ?? [],
    [dados.revisoes, dataHoje],
  )
  const compromissosPendentes = dados.eventos?.filter((evento) => !evento.concluido) ?? []
  const provasPendentes = dados.provas?.filter((prova) => !prova.feita) ?? []
  const provasFuturas = dados.proximasProvas?.filter((prova) => prova.data > dataHoje) ?? []
  const houveFalha = Object.values(dados).some((valor) => valor === null)
  const projetosAtivos = dados.projetos?.filter((projeto) => projeto.status !== 'concluido') ?? []
  const receitasDestaque = dados.receitas
    ? [...dados.receitas].sort((a, b) => Number(b.favorito) - Number(a.favorito)).slice(0, 3)
    : []
  const insights = useMemo(() => montarInsights(dados, dataHoje), [dados, dataHoje])

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">
              Sistema Pessoal v2
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Visão geral
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              O que pede atenção hoje e o tempo dedicado aos estudos.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void carregar()}
            disabled={carregando}
          >
            <RefreshCw className={carregando ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </header>

        {houveFalha && !carregando ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
          >
            Parte do resumo não pôde ser atualizada. Os dados indisponíveis aparecem com um traço.
          </p>
        ) : null}

        <PainelInsights insights={insights} loading={carregando} />

        <section aria-labelledby="tempo-title" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Estudos</p>
              <h2 id="tempo-title" className="mt-1 text-xl font-semibold">Tempo registrado</h2>
            </div>
            <Link href="/estudos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Abrir Estudos
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(14rem,1fr)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard
                label="Hoje"
                value={dados.tempo ? formatarDuracao(dados.tempo.hojeMinutos) : null}
                loading={carregando}
              />
              <MetricCard
                label="Semana atual"
                value={dados.tempo ? formatarDuracao(dados.tempo.semanaMinutos) : null}
                loading={carregando}
              />
              <MetricCard
                label="Mês atual"
                value={dados.tempo ? formatarDuracao(dados.tempo.mesMinutos) : null}
                loading={carregando}
              />
            </div>
            <ProximasProvasCard
              provas={dados.proximasProvas === null ? null : provasFuturas}
              hoje={dataHoje}
              loading={carregando}
            />
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <section aria-labelledby="agenda-title" className="border-t border-border pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Hoje</p>
                <h2 id="agenda-title" className="mt-1 text-xl font-semibold">Agenda</h2>
              </div>
              <Badge variant="outline">
                {dados.eventos === null || dados.provas === null
                  ? 'Indisponível'
                  : `${compromissosPendentes.length + provasPendentes.length} pendentes`}
              </Badge>
            </div>
            <div className="mt-4">
              {carregando ? (
                <ListaSkeleton />
              ) : dados.eventos === null || dados.provas === null ? (
                <EstadoIndisponivel />
              ) : compromissosPendentes.length + provasPendentes.length === 0 ? (
                <EstadoVazio icon={CheckCircle2} texto="Nada pendente para hoje." />
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {compromissosPendentes.slice(0, 4).map((evento) => (
                    <li key={evento.uuid}>
                      <Link
                        href="/agenda"
                        className="flex items-center gap-3 py-3 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      >
                        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{evento.titulo}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {evento.hora_inicio?.slice(0, 5) ?? 'Sem horário'}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {provasPendentes
                    .slice(0, Math.max(0, 4 - compromissosPendentes.length))
                    .map((prova) => (
                      <li key={prova.uuid}>
                        <Link
                          href={prova.materia_uuid ? `/estudos/materia/${prova.materia_uuid}` : '/estudos'}
                          className="flex items-center gap-3 py-3 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        >
                          <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {prova.titulo || 'Prova'}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">Prova</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <Link
              href="/agenda"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Ver agenda completa <ChevronRight className="size-4" />
            </Link>
          </section>

          <section aria-labelledby="revisao-title" className="border-t border-border pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Memória</p>
                <h2 id="revisao-title" className="mt-1 text-xl font-semibold">Revisões pendentes</h2>
              </div>
              <Badge variant="outline">
                {dados.revisoes === null ? 'Indisponível' : revisoesPendentes.length}
              </Badge>
            </div>
            <div className="mt-4">
              {carregando ? (
                <ListaSkeleton />
              ) : dados.revisoes === null ? (
                <EstadoIndisponivel />
              ) : revisoesPendentes.length === 0 ? (
                <EstadoVazio icon={CheckCircle2} texto="Nenhuma revisão vencida ou para hoje." />
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {revisoesPendentes.slice(0, 4).map((card) => (
                    <li key={card.uuid}>
                      <Link
                        href="/revisao"
                        className="flex items-center gap-3 py-3 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      >
                        <Brain className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{card.pergunta}</span>
                        <Badge variant={card.proxima_revisao < dataHoje ? 'warning' : 'outline'}>
                          {card.proxima_revisao < dataHoje ? 'Atrasada' : 'Hoje'}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link
              href="/revisao"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Abrir revisão <ChevronRight className="size-4" />
            </Link>
          </section>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ResumoNovoModulo
            eyebrow="Execução"
            title="Projetos ativos"
            href="/projetos"
            indisponivel={dados.projetos === null}
            loading={carregando}
            vazio="Nenhum projeto ativo."
            items={projetosAtivos.slice(0, 3).map((projeto) => ({
              id: projeto.uuid,
              label: projeto.nome,
              detail: projeto.data_prazo ? `Prazo ${new Date(`${projeto.data_prazo}T00:00:00`).toLocaleDateString('pt-BR')}` : projeto.status,
              icon: FolderKanban,
            }))}
          />
          <ResumoNovoModulo
            eyebrow="Cozinha"
            title="Receitas em destaque"
            href="/receitas"
            indisponivel={dados.receitas === null}
            loading={carregando}
            vazio="Nenhuma receita cadastrada."
            items={receitasDestaque.map((receita) => ({
              id: receita.uuid,
              label: receita.titulo,
              detail: receita.favorito ? 'Favorita' : receita.categoria || 'Receita',
              icon: receita.favorito ? Star : Utensils,
            }))}
          />
        </div>

        <section aria-labelledby="modulos-title" className="mt-12 border-t border-border pt-6">
          <div>
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">Atalhos</p>
            <h2 id="modulos-title" className="mt-1 text-xl font-semibold">Módulos</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs outline-none transition-all hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-4">
                    <span className="font-mono text-xs font-medium uppercase text-muted-foreground">
                      {module.status}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{module.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

interface InsightPessoal {
  id: string
  detalhe: string
  href: string
  itens: Array<{ id: string; texto: string }>
}

function montarInsights(dados: DadosHub, hoje: string): InsightPessoal[] {
  const itens: InsightPessoal[] = []
  const biblioteca = dados.insights

  const obras = [
    ...(biblioteca?.livros.filter((item) => item.status === 'lendo').map((item) => ({ id: `livro-${item.titulo}`, texto: `Lendo agora: ${item.titulo}` })) ?? []),
    ...(biblioteca?.mangas.filter((item) => item.status === 'lendo').map((item) => ({ id: `manga-${item.titulo}`, texto: `Lendo agora: ${item.titulo}` })) ?? []),
    ...(biblioteca?.series.filter((item) => item.status === 'assistindo').map((item) => ({ id: `serie-${item.titulo}`, texto: `Assistindo agora: ${item.titulo}` })) ?? []),
    ...(biblioteca?.animes.filter((item) => item.status === 'assistindo').map((item) => ({ id: `anime-${item.titulo}`, texto: `Assistindo agora: ${item.titulo}` })) ?? []),
    ...(biblioteca?.podcasts.filter((item) => item.status === 'ouvindo').map((item) => ({ id: `podcast-${item.titulo}`, texto: `Ouvindo agora: ${item.titulo}` })) ?? []),
  ]
  if (obras.length > 0) itens.push({ id: 'biblioteca-andamento', detalhe: 'Biblioteca', href: '/biblioteca', itens: obras })

  const provas = (dados.proximasProvas ?? []).filter((prova) => prova.data >= hoje).map((prova) => {
    const dias = diferencaDias(hoje, prova.data)
    const textoData = dias === 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `acontece em ${dias} dias`
    return { id: prova.uuid, texto: `${prova.titulo || 'Próxima prova'} ${textoData}` }
  })
  if (provas.length > 0) itens.push({ id: 'provas', detalhe: 'Próximas provas', href: '/estudos', itens: provas })

  const revisoes = (dados.revisoes ?? [])
    .filter((card) => card.proxima_revisao <= hoje)
    .map((card) => ({ id: card.uuid, texto: `${card.proxima_revisao < hoje ? 'Revisão atrasada' : 'Revisar hoje'}: ${card.pergunta}` }))
  if (revisoes.length > 0) itens.push({ id: 'revisoes', detalhe: 'Revisão Espaçada', href: '/revisao', itens: revisoes })

  return itens
}

function IconeInsight({ id }: { id: string }) {
  if (id === 'biblioteca-andamento') return <BookOpen className="size-4" />
  if (id === 'provas') return <GraduationCap className="size-4" />
  if (id === 'revisoes') return <Brain className="size-4" />
  return <Lightbulb className="size-4" />
}

function InsightCard({ insight }: { insight: InsightPessoal }) {
  const [indice, setIndice] = useState(0)
  useEffect(() => {
    if (insight.itens.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const intervalId = window.setInterval(() => setIndice((atual) => (atual + 1) % insight.itens.length), 5000)
    return () => window.clearInterval(intervalId)
  }, [insight])
  const item = insight.itens[indice % insight.itens.length] ?? insight.itens[0]
  return (
    <Link href={insight.href} className="group flex min-h-36 min-w-[82%] snap-start flex-col rounded-lg border border-border bg-card p-4 text-card-foreground outline-none transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/35 focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:min-w-0">
      <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground"><IconeInsight id={insight.id} /></span>
      <p className="mt-3 font-mono text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{insight.detalhe}</p>
      <strong key={item.id} className="mt-1 line-clamp-2 animate-in fade-in text-sm font-semibold leading-snug sm:text-[0.95rem]">{item.texto}</strong>
      <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-medium text-muted-foreground group-hover:text-foreground">
        <span>Abrir {insight.detalhe}</span>
        {insight.itens.length > 1 ? <span>{(indice % insight.itens.length) + 1}/{insight.itens.length}</span> : <ChevronRight className="size-3.5" />}
      </span>
    </Link>
  )
}

function PainelInsights({ insights, loading }: { insights: InsightPessoal[]; loading: boolean }) {
  const colunas = insights.length === 1
    ? 'sm:grid-cols-1 lg:max-w-sm'
    : insights.length === 2
      ? 'sm:grid-cols-2 lg:max-w-2xl'
      : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <section aria-labelledby="insights-title" className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] font-medium uppercase text-muted-foreground">Painel pessoal</p>
          <h2 id="insights-title" className="mt-1 text-xl font-semibold">Insights</h2>
        </div>
        {!loading && insights.length > 0 ? <Badge variant="outline">{insights.length} ativos</Badge> : null}
      </div>

      {loading ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className="min-h-36 rounded-lg border border-border bg-card p-4">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="mt-4 h-3 w-20" />
              <Skeleton className="mt-2 h-5 w-full" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      ) : insights.length > 0 ? (
        <div className={`mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:pb-0 ${colunas}`}>
          {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </div>
      ) : (
        <div className="mt-3 flex min-h-28 items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Lightbulb className="size-4" /></span>
          <p className="text-sm text-muted-foreground">Os insights aparecem conforme seus registros ganham contexto.</p>
        </div>
      )}
    </section>
  )
}

function MetricCard({ label, value, loading }: { label: string; value: string | null; loading: boolean }) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Clock3 className="size-4" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <strong className="block font-mono text-xl font-semibold tabular-nums">{value ?? '--'}</strong>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function ProximasProvasCard({
  provas,
  hoje,
  loading,
}: {
  provas: Prova[] | null
  hoje: string
  loading: boolean
}) {
  const trilhoRef = useRef<HTMLDivElement>(null)

  function rolar(direcao: -1 | 1) {
    trilhoRef.current?.scrollBy({
      left: direcao * trilhoRef.current.clientWidth,
      behavior: 'smooth',
    })
  }

  return (
    <div className="flex min-h-24 min-w-0 flex-col rounded-lg border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.68rem] font-medium uppercase text-muted-foreground">
          Próximas provas
        </span>
        {provas && provas.length > 1 ? (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => rolar(-1)} aria-label="Prova anterior">
              <ChevronLeft className="size-3" />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => rolar(1)} aria-label="Próxima prova">
              <ChevronRight className="size-3" />
            </Button>
          </div>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-10 w-full" />
      ) : provas === null ? (
        <span className="mt-3 text-xs text-muted-foreground">Indisponível</span>
      ) : provas.length === 0 ? (
        <span className="mt-3 text-xs leading-relaxed text-muted-foreground">Nenhuma prova futura.</span>
      ) : (
        <div ref={trilhoRef} className="mt-2 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {provas.map((prova) => {
            const dias = diferencaDias(hoje, prova.data)
            return (
              <Link
                key={prova.uuid}
                href={prova.materia_uuid ? `/estudos/materia/${prova.materia_uuid}` : '/estudos'}
                className="min-w-full snap-start rounded-md py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                <strong className="block text-sm leading-snug">
                  Faltam {dias} {dias === 1 ? 'dia' : 'dias'}
                </strong>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  para {prova.titulo || 'a prova'}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function diferencaDias(inicio: string, fim: string) {
  function paraUtc(data: string) {
    const [ano, mes, dia] = data.split('-').map(Number)
    return Date.UTC(ano, mes - 1, dia)
  }
  return Math.max(0, Math.round((paraUtc(fim) - paraUtc(inicio)) / 86_400_000))
}

function adicionarDias(data: string, dias: number) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const valor = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return valor.toISOString().slice(0, 10)
}

function ListaSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Carregando resumo">
      {[0, 1, 2].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
    </div>
  )
}

function EstadoIndisponivel() {
  return <p className="py-5 text-sm text-muted-foreground">Não foi possível carregar este resumo.</p>
}

function EstadoVazio({ icon: Icon, texto }: { icon: typeof CheckCircle2; texto: string }) {
  return (
    <div className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" />
      <p>{texto}</p>
    </div>
  )
}

function ResumoNovoModulo({
  eyebrow,
  title,
  href,
  indisponivel,
  loading,
  vazio,
  items,
}: {
  eyebrow: string
  title: string
  href: string
  indisponivel: boolean
  loading: boolean
  vazio: string
  items: Array<{ id: string; label: string; detail: string; icon: typeof FolderKanban }>
}) {
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-mono text-xs font-medium uppercase text-muted-foreground">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold">{title}</h2></div>
        <Link href={href} className="text-sm font-medium text-muted-foreground hover:text-foreground">Abrir</Link>
      </div>
      <div className="mt-3">
        {loading ? <ListaSkeleton /> : indisponivel ? <EstadoIndisponivel /> : items.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{vazio}</p> : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => {
              const Icon = item.icon
              return <li key={item.id}><Link href={href} className="flex items-center gap-3 py-3"><Icon className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span><span className="text-xs capitalize text-muted-foreground">{item.detail}</span></Link></li>
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
