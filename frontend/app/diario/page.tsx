'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BedDouble, CircleDollarSign, Droplets, HeartPulse, MapPinned, NotebookTabs, Pill, RefreshCw, Star, Utensils } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { dataLocalIso } from '@/lib/date'
import { InvestimentoFinanceiro, LancamentoFinanceiro, listarInvestimentosFinanceiros, listarLancamentosFinanceiros, listarMetasEconomia, MetaEconomia } from '@/lib/financas'
import { listarLugares, Lugar } from '@/lib/lugares'
import { listarReceitas, Receita } from '@/lib/receitas'
import { listarHidratacao, listarHumor, listarMedicamentos, listarSono, Medicamento, RegistroHidratacao, RegistroHumor, RegistroSono } from '@/lib/saude'

interface DadosDiario {
  sono: RegistroSono[] | null
  hidratacao: RegistroHidratacao[] | null
  humor: RegistroHumor[] | null
  medicamentos: Medicamento[] | null
  lancamentos: LancamentoFinanceiro[] | null
  metas: MetaEconomia[] | null
  investimentos: InvestimentoFinanceiro[] | null
  lugares: Lugar[] | null
  receitas: Receita[] | null
}

const INICIAL: DadosDiario = { sono: null, hidratacao: null, humor: null, medicamentos: null, lancamentos: null, metas: null, investimentos: null, lugares: null, receitas: null }
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function DiarioPage() {
  const [dados, setDados] = useState<DadosDiario>(INICIAL)
  const [carregando, setCarregando] = useState(true)
  const hoje = dataLocalIso()
  const mesAtual = hoje.slice(0, 7)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const resultados = await Promise.allSettled([
      listarSono(), listarHidratacao(), listarHumor(), listarMedicamentos(),
      listarLancamentosFinanceiros(), listarMetasEconomia(), listarLugares(), listarReceitas(),
      listarInvestimentosFinanceiros(),
    ])
    const valor = <T,>(indice: number): T | null => resultados[indice].status === 'fulfilled' ? resultados[indice].value as T | null : null
    setDados({
      sono: valor<RegistroSono[]>(0), hidratacao: valor<RegistroHidratacao[]>(1), humor: valor<RegistroHumor[]>(2), medicamentos: valor<Medicamento[]>(3),
      lancamentos: valor<LancamentoFinanceiro[]>(4), metas: valor<MetaEconomia[]>(5), lugares: valor<Lugar[]>(6), receitas: valor<Receita[]>(7),
      investimentos: valor<InvestimentoFinanceiro[]>(8),
    })
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const sonoHoje = dados.sono?.find((item) => item.data === hoje)
  const aguaHoje = dados.hidratacao?.find((item) => item.data === hoje)
  const humorHoje = dados.humor?.find((item) => item.data === hoje)
  const medicamentosAtivos = dados.medicamentos?.filter((item) => item.ativo) ?? []
  const lancamentosMes = dados.lancamentos?.filter((item) => item.data.startsWith(mesAtual)) ?? []
  const entradas = lancamentosMes.filter((item) => item.tipo === 'entrada').reduce((total, item) => total + Number(item.valor), 0)
  const saidas = lancamentosMes.filter((item) => item.tipo === 'saida').reduce((total, item) => total + Number(item.valor), 0)
  const custoInvestimentos = dados.investimentos?.reduce((total, item) => total + Number(item.quantidade) * Number(item.preco_medio), 0) ?? 0
  const favoritosLugar = useMemo(() => dados.lugares?.filter((item) => item.favorito) ?? [], [dados.lugares])
  const favoritasReceita = useMemo(() => dados.receitas?.filter((item) => item.favorito) ?? [], [dados.receitas])
  const houveFalha = !carregando && Object.values(dados).some((valor) => valor === null)

  const modulos = useMemo(() => [
    {
      href: '/saude', titulo: 'Saúde', subtitulo: 'Seu registro de hoje', icon: HeartPulse,
      metricas: [
        { icon: BedDouble, valor: sonoHoje ? `${sonoHoje.horas_dormidas}h` : '--', label: 'sono' },
        { icon: Droplets, valor: aguaHoje ? `${aguaHoje.copos}/${aguaHoje.meta_copos}` : '--', label: 'copos' },
        { icon: HeartPulse, valor: humorHoje ? `${humorHoje.humor}/5` : '--', label: 'humor' },
        { icon: Pill, valor: String(medicamentosAtivos.length), label: 'medicamentos' },
      ],
      rodape: sonoHoje || aguaHoje || humorHoje ? 'Há registros para hoje.' : 'Nenhum registro diário hoje.',
    },
    {
      href: '/financas', titulo: 'Finanças', subtitulo: 'Movimento do mês', icon: CircleDollarSign,
      metricas: [
        { icon: ArrowUpRight, valor: moeda.format(entradas), label: 'entradas' },
        { icon: ArrowDownLeft, valor: moeda.format(saidas), label: 'saídas' },
        { icon: CircleDollarSign, valor: moeda.format(entradas - saidas), label: 'saldo' },
        { icon: Star, valor: String(dados.investimentos?.length ?? 0), label: 'posições' },
      ],
      rodape: `${lancamentosMes.length} lançamentos · ${dados.metas?.length ?? 0} metas · custo investido ${moeda.format(custoInvestimentos)}.`,
    },
    {
      href: '/lugares', titulo: 'Lugares', subtitulo: 'Destinos e memórias', icon: MapPinned,
      metricas: [
        { icon: MapPinned, valor: String(dados.lugares?.length ?? 0), label: 'lugares' },
        { icon: Star, valor: String(favoritosLugar.length), label: 'favoritos' },
      ],
      rodape: favoritosLugar[0] ? `Em destaque: ${favoritosLugar[0].nome}` : dados.lugares?.[0] ? `Mais recente: ${dados.lugares[0].nome}` : 'Nenhum lugar cadastrado.',
    },
    {
      href: '/receitas', titulo: 'Receitas', subtitulo: 'Seu acervo culinário', icon: Utensils,
      metricas: [
        { icon: Utensils, valor: String(dados.receitas?.length ?? 0), label: 'receitas' },
        { icon: Star, valor: String(favoritasReceita.length), label: 'favoritas' },
        { icon: ArrowUpRight, valor: String(dados.receitas?.filter((item) => item.fez).length ?? 0), label: 'já feitas' },
      ],
      rodape: favoritasReceita[0] ? `Favorita: ${favoritasReceita[0].titulo}` : dados.receitas?.[0] ? `Mais recente: ${dados.receitas[0].titulo}` : 'Nenhuma receita cadastrada.',
    },
  ], [aguaHoje, custoInvestimentos, dados.investimentos, dados.lugares, dados.metas, dados.receitas, entradas, favoritasReceita, favoritosLugar, humorHoje, lancamentosMes.length, medicamentosAtivos.length, saidas, sonoHoje])

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Vida cotidiana</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Diário</h1><p className="mt-3 max-w-2xl text-muted-foreground">O retrato atual da sua saúde, organização financeira, lugares e cozinha.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => void carregar()} disabled={carregando}><RefreshCw className={carregando ? 'animate-spin' : ''} />Atualizar</Button>
        </header>

        {houveFalha ? <p role="alert" className="mt-5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">Parte do Diário não pôde ser atualizada. Os outros resumos continuam disponíveis.</p> : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Áreas do Diário">
          {modulos.map((modulo) => {
            const Icon = modulo.icon
            return (
              <article key={modulo.href} className="flex min-h-64 flex-col rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
                <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-secondary"><Icon className="size-5" /></span><div><p className="font-mono text-[0.68rem] uppercase text-muted-foreground">{modulo.subtitulo}</p><h2 className="mt-1 text-xl font-semibold">{modulo.titulo}</h2></div></div><Link href={modulo.href} aria-label={`Abrir ${modulo.titulo}`} className="rounded-lg p-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"><ArrowRight className="size-4" /></Link></div>
                <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                  {carregando ? Array.from({ length: modulo.metricas.length }, (_, indice) => <Skeleton key={indice} className="h-12" />) : modulo.metricas.map((metrica) => { const MetricaIcon = metrica.icon; return <div key={metrica.label} className="min-w-0"><MetricaIcon className="size-4 text-muted-foreground" /><strong className="mt-2 block truncate font-mono text-base tabular-nums">{metrica.valor}</strong><span className="block truncate text-xs text-muted-foreground">{metrica.label}</span></div> })}
                </div>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-4"><p className="min-w-0 truncate text-sm text-muted-foreground">{carregando ? 'Atualizando...' : modulo.rodape}</p><Link href={modulo.href} className="shrink-0 text-sm font-medium hover:underline">Abrir</Link></div>
              </article>
            )
          })}
        </section>

        <section className="mt-10 border-t border-border pt-5">
          <div className="flex items-center gap-3"><NotebookTabs className="size-5 text-muted-foreground" /><div><p className="font-mono text-xs uppercase text-muted-foreground">Visão integrada</p><h2 className="mt-1 text-xl font-semibold">Hoje em uma linha</h2></div></div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{carregando ? 'Reunindo seus registros...' : montarLinhaDoDia({ sonoHoje, aguaHoje, humorHoje, saldo: entradas - saidas, lugares: dados.lugares?.length ?? 0, receitas: dados.receitas?.length ?? 0 })}</p>
        </section>
      </div>
    </main>
  )
}

function montarLinhaDoDia({ sonoHoje, aguaHoje, humorHoje, saldo, lugares, receitas }: { sonoHoje?: RegistroSono; aguaHoje?: RegistroHidratacao; humorHoje?: RegistroHumor; saldo: number; lugares: number; receitas: number }) {
  const partes = [
    sonoHoje ? `${sonoHoje.horas_dormidas}h de sono` : null,
    aguaHoje ? `${aguaHoje.copos} copos de água` : null,
    humorHoje ? `humor ${humorHoje.humor}/5` : null,
    `saldo mensal ${moeda.format(saldo)}`,
    `${lugares} ${lugares === 1 ? 'lugar' : 'lugares'}`,
    `${receitas} ${receitas === 1 ? 'receita' : 'receitas'}`,
  ].filter(Boolean)
  return partes.join(' · ')
}
