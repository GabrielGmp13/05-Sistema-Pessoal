'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Brain,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clock3,
  Code2,
  Dumbbell,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  Languages,
  Lightbulb,
  MapPin,
  NotebookTabs,
  RefreshCw,
  Star,
  Utensils,
  WalletCards,
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
  texto: string
  detalhe: string
  href: string
}

function montarInsights(dados: DadosHub, hoje: string): InsightPessoal[] {
  const itens: InsightPessoal[] = []
  const biblioteca = dados.insights

  function adicionarConsumos(
    id: string,
    prefixo: string,
    candidatos: Array<{ titulo: string }>,
  ) {
    candidatos.slice(0, 2).forEach((item, indice) => {
      itens.push({ id: `${id}-${indice}`, texto: `${prefixo}: ${item.titulo}`, detalhe: 'Biblioteca', href: '/biblioteca' })
    })
  }

  adicionarConsumos('livro', 'Lendo agora', biblioteca?.livros.filter((item) => item.status === 'lendo') ?? [])
  adicionarConsumos('manga', 'Lendo agora', biblioteca?.mangas.filter((item) => item.status === 'lendo') ?? [])
  adicionarConsumos('serie', 'Assistindo agora', biblioteca?.series.filter((item) => item.status === 'assistindo') ?? [])
  adicionarConsumos('anime', 'Assistindo agora', biblioteca?.animes.filter((item) => item.status === 'assistindo') ?? [])
  adicionarConsumos('podcast', 'Ouvindo agora', biblioteca?.podcasts.filter((item) => item.status === 'ouvindo') ?? [])

  const videoPendente = biblioteca?.videos.find((item) => !item.assistido)
  if (videoPendente) itens.push({ id: 'video', texto: `Vídeo ainda não assistido: ${videoPendente.titulo}`, detalhe: 'Biblioteca', href: '/biblioteca' })

  if (biblioteca) {
    const favoritos = [
      ...biblioteca.livros,
      ...biblioteca.mangas,
      ...biblioteca.series,
      ...biblioteca.animes,
      ...biblioteca.podcasts,
      ...biblioteca.videos,
    ].filter((item) => item.favorito).length
    if (favoritos > 0) itens.push({ id: 'favoritos', texto: `${favoritos} ${favoritos === 1 ? 'item favorito' : 'itens favoritos'} na Biblioteca`, detalhe: 'Acervo pessoal', href: '/biblioteca' })

    const curso = biblioteca.cursos.find((item) => !item.concluido)
    if (curso) itens.push({ id: 'curso', texto: `Curso em andamento: ${curso.nome}`, detalhe: 'Estudos', href: '/estudos/curso' })
  }

  const proximaProva = dados.proximasProvas?.find((prova) => prova.data >= hoje)
  if (proximaProva) {
    const dias = diferencaDias(hoje, proximaProva.data)
    const textoData = dias === 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `acontece em ${dias} dias`
    itens.push({ id: 'prova', texto: `${proximaProva.titulo || 'A próxima prova'} ${textoData}`, detalhe: 'Estudos', href: '/estudos' })
  }

  if (dados.tempo?.hojeMinutos) itens.push({ id: 'tempo-hoje', texto: `Você estudou ${formatarDuracao(dados.tempo.hojeMinutos)} hoje`, detalhe: 'Tempo registrado', href: '/estudos' })
  if (dados.tempo?.semanaMinutos) itens.push({ id: 'tempo-semana', texto: `Você estudou ${formatarDuracao(dados.tempo.semanaMinutos)} nesta semana`, detalhe: 'Tempo registrado', href: '/estudos' })
  if (dados.tempo?.mesMinutos) itens.push({ id: 'tempo-mes', texto: `Você estudou ${formatarDuracao(dados.tempo.mesMinutos)} neste mês`, detalhe: 'Tempo registrado', href: '/estudos' })

  const vencidas = dados.revisoes?.filter((card) => card.proxima_revisao < hoje).length ?? 0
  if (vencidas > 0) itens.push({ id: 'revisoes', texto: `${vencidas} ${vencidas === 1 ? 'revisão vencida' : 'revisões vencidas'}`, detalhe: 'Revisão Espaçada', href: '/revisao' })

  if (dados.projetos && dados.tarefasProjetos) {
    const projetoProgramacao = dados.projetos.find((item) => item.destaque && (item.repositorio_url || item.linguagem_principal))
    if (projetoProgramacao) {
      itens.push({ id: 'programacao-destaque', texto: `Projeto em destaque: ${projetoProgramacao.nome}${projetoProgramacao.linguagem_principal ? ` · ${projetoProgramacao.linguagem_principal}` : ''}`, detalhe: 'Programação', href: '/programacao' })
    }
    const projeto = dados.projetos.find((item) => item.status !== 'concluido')
    if (projeto) {
      const pendentes = dados.tarefasProjetos.filter((tarefa) => tarefa.projeto_uuid === projeto.uuid && tarefa.status !== 'feito').length
      itens.push({ id: 'projeto', texto: `Projeto ${projeto.nome} tem ${pendentes} ${pendentes === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`, detalhe: 'Projetos', href: '/projetos' })
    }
  }

  const receitaFavorita = dados.receitas?.find((receita) => receita.favorito)
  if (receitaFavorita) itens.push({ id: 'receita-favorita', texto: `Receita favorita: ${receitaFavorita.titulo}`, detalhe: 'Receitas', href: '/receitas' })
  const receitasFeitas = dados.receitas?.filter((receita) => receita.fez).length ?? 0
  if (receitasFeitas > 0) itens.push({ id: 'receitas-feitas', texto: `${receitasFeitas} ${receitasFeitas === 1 ? 'receita marcada' : 'receitas marcadas'} como feita${receitasFeitas === 1 ? '' : 's'}`, detalhe: 'Receitas', href: '/receitas' })
  const receitaRecente = dados.receitas ? [...dados.receitas].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] : undefined
  if (receitaRecente && receitaRecente.uuid !== receitaFavorita?.uuid) itens.push({ id: 'receita-recente', texto: `Receita adicionada recentemente: ${receitaRecente.titulo}`, detalhe: 'Receitas', href: '/receitas' })

  const compromisso = dados.proximosEventos?.find((evento) => !evento.concluido && evento.data >= hoje)
  if (compromisso) {
    const dias = diferencaDias(hoje, compromisso.data)
    const textoData = dias === 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `acontece em ${dias} dias`
    itens.push({ id: 'compromisso', texto: `${compromisso.titulo} ${textoData}`, detalhe: 'Próximo compromisso', href: '/agenda' })
  }

  const humorRecente = dados.humor?.[0]
  if (humorRecente) {
    itens.push({
      id: 'saude-humor',
      texto: `Último humor: ${humorRecente.humor}/5 · energia ${humorRecente.energia}/5`,
      detalhe: 'Saúde',
      href: '/saude',
    })
  }

  const lancamentosMes = dados.lancamentos?.filter((item) => item.data.startsWith(hoje.slice(0, 7))) ?? []
  if (lancamentosMes.length > 0) {
    const saldo = lancamentosMes.reduce(
      (total, item) => total + (item.tipo === 'entrada' ? Number(item.valor) : -Number(item.valor)),
      0,
    )
    itens.push({
      id: 'financas-saldo',
      texto: `Saldo registrado no mês: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}`,
      detalhe: 'Finanças',
      href: '/financas',
    })
  }

  if (dados.investimentos && dados.investimentos.length > 0) {
    const custo = dados.investimentos.reduce((total, item) => total + Number(item.quantidade) * Number(item.preco_medio), 0)
    itens.push({
      id: 'financas-investimentos',
      texto: `${dados.investimentos.length} ${dados.investimentos.length === 1 ? 'posição de investimento' : 'posições de investimento'} · custo ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custo)}`,
      detalhe: 'Finanças',
      href: '/financas',
    })
  }

  const lugar = dados.lugares?.find((item) => item.favorito) ?? dados.lugares?.[0]
  if (lugar) {
    itens.push({
      id: 'lugar-destaque',
      texto: `${lugar.favorito ? 'Lugar favorito' : 'Lugar em destaque'}: ${lugar.nome}`,
      detalhe: 'Lugares',
      href: '/lugares',
    })
  }

  if (dados.idiomas?.idiomaAtivo) {
    itens.push({
      id: 'idioma-ativo',
      texto: `Idioma ativo: ${dados.idiomas.idiomaAtivo.nome}${dados.idiomas.idiomaAtivo.nivel_atual ? ` · nível ${dados.idiomas.idiomaAtivo.nivel_atual}` : ''}`,
      detalhe: 'Idiomas',
      href: '/idiomas',
    })
  }
  if (dados.idiomas && dados.idiomas.minutosSemana > 0) {
    itens.push({
      id: 'idiomas-tempo',
      texto: `${formatarDuracao(dados.idiomas.minutosSemana)} de prática de idiomas nesta semana`,
      detalhe: 'Idiomas',
      href: '/idiomas',
    })
  }

  const diaMaisAtivo = dados.atividade?.dias.length
    ? [...dados.atividade.dias].sort((a, b) => b.total - a.total)[0]
    : null
  if (diaMaisAtivo) {
    itens.push({
      id: 'historico-dia',
      texto: `Dia mais ativo do ano: ${new Date(`${diaMaisAtivo.data}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · ${diaMaisAtivo.total} registros`,
      detalhe: 'Histórico',
      href: '/historico',
    })
  }

  return itens
}

function iconeDoInsight(id: string): typeof Lightbulb {
  if (id.startsWith('livro') || id.startsWith('manga')) return BookOpen
  if (id.startsWith('serie') || id.startsWith('anime') || id === 'video') return CirclePlay
  if (id === 'favoritos') return Star
  if (id === 'curso' || id === 'prova') return GraduationCap
  if (id.startsWith('tempo')) return Clock3
  if (id === 'revisoes') return Brain
  if (id.startsWith('programacao')) return Code2
  if (id === 'projeto') return FolderKanban
  if (id.startsWith('receita')) return Utensils
  if (id === 'compromisso') return CalendarDays
  if (id.startsWith('saude')) return HeartPulse
  if (id.startsWith('financas')) return WalletCards
  if (id.startsWith('lugar')) return MapPin
  if (id.startsWith('idioma')) return Languages
  if (id.startsWith('historico')) return CalendarRange
  return Lightbulb
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
          {insights.map((insight) => {
            const Icon = iconeDoInsight(insight.id)
            return (
              <Link
                key={insight.id}
                href={insight.href}
                className="group flex min-h-36 min-w-[82%] snap-start flex-col rounded-lg border border-border bg-card p-4 text-card-foreground outline-none transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/35 focus-visible:ring-[3px] focus-visible:ring-ring/30 sm:min-w-0"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 font-mono text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {insight.detalhe}
                </p>
                <strong className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-[0.95rem]">
                  {insight.texto}
                </strong>
                <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  Abrir {insight.detalhe}
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
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
