'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Landmark, Pencil, PiggyBank, Plus, RefreshCw, Target, Trash2, TrendingUp, WalletCards } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { buscarCotacao, CotacaoAtivo } from '@/lib/cotacoes'
import {
  CategoriaFinanceira,
  deletarCategoriaFinanceira,
  deletarInvestimentoFinanceiro,
  deletarLancamentoFinanceiro,
  deletarMetaEconomia,
  deletarOrcamentoFinanceiro,
  InvestimentoFinanceiro,
  LancamentoFinanceiro,
  listarCategoriasFinanceiras,
  listarInvestimentosFinanceiros,
  listarLancamentosFinanceiros,
  listarMetasEconomia,
  listarOrcamentosFinanceiros,
  MetaEconomia,
  OrcamentoFinanceiro,
  salvarCategoriaFinanceira,
  salvarInvestimentoFinanceiro,
  salvarLancamentoFinanceiro,
  salvarMetaEconomia,
  salvarOrcamentoFinanceiro,
  TipoInvestimento,
  TipoMovimento,
} from '@/lib/financas'
import { dataLocalIso } from '@/lib/date'

type Exclusao = { tipo: 'categoria' | 'lancamento' | 'orcamento' | 'meta' | 'investimento'; uuid: string; nome: string }

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const tiposInvestimento: { value: TipoInvestimento; label: string }[] = [
  { value: 'acao', label: 'Ação' },
  { value: 'fii', label: 'FII' },
  { value: 'etf', label: 'ETF' },
  { value: 'bdr', label: 'BDR' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'renda_fixa', label: 'Renda fixa' },
  { value: 'outro', label: 'Outro' },
]

export default function FinancasPage() {
  const agora = new Date()
  const [periodo, setPeriodo] = useState(`${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`)
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([])
  const [metas, setMetas] = useState<MetaEconomia[]>([])
  const [investimentos, setInvestimentos] = useState<InvestimentoFinanceiro[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)

  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaFinanceira | null>(null)
  const [categoriaNome, setCategoriaNome] = useState('')
  const [categoriaTipo, setCategoriaTipo] = useState<TipoMovimento>('saida')
  const [categoriaCor, setCategoriaCor] = useState('#3b82f6')
  const [lancamentoEditando, setLancamentoEditando] = useState<LancamentoFinanceiro | null>(null)
  const [lancamentoCategoria, setLancamentoCategoria] = useState('')
  const [lancamentoValor, setLancamentoValor] = useState('')
  const [lancamentoData, setLancamentoData] = useState(dataLocalIso())
  const [lancamentoDescricao, setLancamentoDescricao] = useState('')
  const [metaEditando, setMetaEditando] = useState<MetaEconomia | null>(null)
  const [metaTitulo, setMetaTitulo] = useState('')
  const [metaAlvo, setMetaAlvo] = useState('')
  const [metaAtual, setMetaAtual] = useState('0')
  const [metaData, setMetaData] = useState('')
  const [orcamentoCategoria, setOrcamentoCategoria] = useState('')
  const [orcamentoValor, setOrcamentoValor] = useState('')
  const [investimentoEditando, setInvestimentoEditando] = useState<InvestimentoFinanceiro | null>(null)
  const [investimentoTicker, setInvestimentoTicker] = useState('')
  const [investimentoTipo, setInvestimentoTipo] = useState<TipoInvestimento>('acao')
  const [investimentoQuantidade, setInvestimentoQuantidade] = useState('')
  const [investimentoPrecoMedio, setInvestimentoPrecoMedio] = useState('')
  const [cotacoes, setCotacoes] = useState<Record<string, CotacaoAtivo>>({})
  const [cotacaoCarregando, setCotacaoCarregando] = useState<string | null>(null)
  const [avisoCotacao, setAvisoCotacao] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const [categoriasData, lancamentosData, orcamentosData, metasData, investimentosData] = await Promise.all([
      listarCategoriasFinanceiras(), listarLancamentosFinanceiros(), listarOrcamentosFinanceiros(), listarMetasEconomia(), listarInvestimentosFinanceiros(),
    ])
    if ([categoriasData, lancamentosData, orcamentosData, metasData, investimentosData].some((item) => item === null)) setErro('Parte dos dados financeiros não pôde ser carregada.')
    setCategorias(categoriasData ?? [])
    setLancamentos(lancamentosData ?? [])
    setOrcamentos(orcamentosData ?? [])
    setMetas(metasData ?? [])
    setInvestimentos(investimentosData ?? [])
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const [ano, mes] = periodo.split('-').map(Number)
  const lancamentosMes = useMemo(() => lancamentos.filter((item) => item.data.startsWith(periodo)), [lancamentos, periodo])
  const entradas = lancamentosMes.filter((item) => item.tipo === 'entrada').reduce((total, item) => total + Number(item.valor), 0)
  const saidas = lancamentosMes.filter((item) => item.tipo === 'saida').reduce((total, item) => total + Number(item.valor), 0)
  const saldo = entradas - saidas
  const orcamentosMes = orcamentos.filter((item) => item.ano === ano && item.mes === mes)

  async function executar(acao: () => Promise<unknown>, limpar?: () => void) {
    setSalvando(true)
    setErro(null)
    const resultado = await acao()
    if (!resultado) setErro('Não foi possível salvar. Revise os dados e tente novamente.')
    else { limpar?.(); await carregar() }
    setSalvando(false)
  }

  async function salvarCategoria() {
    if (!categoriaNome.trim()) return setErro('Informe o nome da categoria.')
    await executar(() => salvarCategoriaFinanceira({ nome: categoriaNome.trim(), tipo: categoriaTipo, cor: categoriaCor || null }, categoriaEditando?.uuid), () => {
      setCategoriaEditando(null); setCategoriaNome(''); setCategoriaTipo('saida'); setCategoriaCor('#3b82f6')
    })
  }

  async function salvarLancamento() {
    const categoria = categorias.find((item) => item.uuid === lancamentoCategoria)
    if (!categoria || Number(lancamentoValor) <= 0) return setErro('Selecione a categoria e informe um valor válido.')
    await executar(() => salvarLancamentoFinanceiro({
      categoria_uuid: categoria.uuid, tipo: categoria.tipo, valor: Number(lancamentoValor),
      data: lancamentoData, descricao: lancamentoDescricao.trim() || null,
    }, lancamentoEditando?.uuid), () => {
      setLancamentoEditando(null); setLancamentoCategoria(''); setLancamentoValor(''); setLancamentoDescricao(''); setLancamentoData(dataLocalIso())
    })
  }

  async function salvarMeta() {
    if (!metaTitulo.trim() || Number(metaAlvo) <= 0 || Number(metaAtual) < 0) return setErro('Informe título e valores válidos para a meta.')
    await executar(() => salvarMetaEconomia({ titulo: metaTitulo.trim(), valor_alvo: Number(metaAlvo), valor_atual: Number(metaAtual), data_alvo: metaData || null }, metaEditando?.uuid), () => {
      setMetaEditando(null); setMetaTitulo(''); setMetaAlvo(''); setMetaAtual('0'); setMetaData('')
    })
  }

  async function salvarOrcamento() {
    if (!orcamentoCategoria || Number(orcamentoValor) <= 0) return setErro('Selecione uma categoria de saída e informe o limite.')
    const existente = orcamentosMes.find((item) => item.categoria_uuid === orcamentoCategoria)
    await executar(() => salvarOrcamentoFinanceiro({ categoria_uuid: orcamentoCategoria, mes, ano, valor_limite: Number(orcamentoValor) }, existente?.uuid), () => { setOrcamentoCategoria(''); setOrcamentoValor('') })
  }

  async function salvarInvestimento() {
    const ticker = investimentoTicker.trim().toUpperCase()
    const quantidade = Number(investimentoQuantidade)
    const precoMedio = Number(investimentoPrecoMedio)
    if (!/^[A-Z0-9.^-]{2,15}$/.test(ticker) || quantidade <= 0 || precoMedio < 0) {
      return setErro('Informe ticker, quantidade e preço médio válidos.')
    }
    await executar(() => salvarInvestimentoFinanceiro({ ticker, tipo: investimentoTipo, quantidade, preco_medio: precoMedio }, investimentoEditando?.uuid), () => {
      setInvestimentoEditando(null); setInvestimentoTicker(''); setInvestimentoTipo('acao'); setInvestimentoQuantidade(''); setInvestimentoPrecoMedio('')
    })
  }

  function editarCategoria(item: CategoriaFinanceira) { setCategoriaEditando(item); setCategoriaNome(item.nome); setCategoriaTipo(item.tipo); setCategoriaCor(item.cor ?? '#3b82f6') }
  function editarLancamento(item: LancamentoFinanceiro) { setLancamentoEditando(item); setLancamentoCategoria(item.categoria_uuid); setLancamentoValor(String(item.valor)); setLancamentoData(item.data); setLancamentoDescricao(item.descricao ?? '') }
  function editarMeta(item: MetaEconomia) { setMetaEditando(item); setMetaTitulo(item.titulo); setMetaAlvo(String(item.valor_alvo)); setMetaAtual(String(item.valor_atual)); setMetaData(item.data_alvo ?? '') }
  function editarInvestimento(item: InvestimentoFinanceiro) { setInvestimentoEditando(item); setInvestimentoTicker(item.ticker); setInvestimentoTipo(item.tipo); setInvestimentoQuantidade(String(item.quantidade)); setInvestimentoPrecoMedio(String(item.preco_medio)) }

  async function consultarCotacao(ticker: string) {
    setCotacaoCarregando(ticker)
    setAvisoCotacao(null)
    try {
      const resposta = await buscarCotacao(ticker)
      if (!resposta.disponivel || !resposta.cotacao) setAvisoCotacao(resposta.mensagem ?? 'Cotação automática indisponível no momento.')
      else setCotacoes((atuais) => ({ ...atuais, [ticker]: resposta.cotacao as CotacaoAtivo }))
    } catch (error) {
      setAvisoCotacao(error instanceof Error ? error.message : 'Não foi possível consultar a cotação.')
    } finally {
      setCotacaoCarregando(null)
    }
  }

  async function confirmarExclusao() {
    if (!exclusao) return
    const acoes = { categoria: deletarCategoriaFinanceira, lancamento: deletarLancamentoFinanceiro, orcamento: deletarOrcamentoFinanceiro, meta: deletarMetaEconomia, investimento: deletarInvestimentoFinanceiro }
    await executar(() => acoes[exclusao.tipo](exclusao.uuid))
    setExclusao(null)
  }

  const nomeCategoria = (uuid: string) => categorias.find((item) => item.uuid === uuid)?.nome ?? 'Categoria removida'

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase text-muted-foreground">Organização pessoal</p><h1 className="mt-2 text-3xl font-semibold">Finanças</h1><p className="mt-2 text-muted-foreground">Entradas, saídas, objetivos e posições de investimento em um só lugar.</p></div><label className="text-xs font-medium text-muted-foreground">Mês<Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-1 w-44" /></label></header>
      {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{erro}</p> : null}
      <section className="mt-7 grid gap-3 sm:grid-cols-3"><Resumo icon={ArrowUpRight} label="Entradas" valor={entradas} positive /><Resumo icon={ArrowDownLeft} label="Saídas" valor={saidas} /><Resumo icon={WalletCards} label="Saldo" valor={saldo} positive={saldo >= 0} /></section>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,.85fr)]">
        <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Movimentação</p><h2 className="mt-1 text-xl font-semibold">{lancamentoEditando ? 'Editar lançamento' : 'Novo lançamento'}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Campo label="Categoria"><select value={lancamentoCategoria} onChange={(e) => setLancamentoCategoria(e.target.value)} className={selectClass}><option value="">Selecione</option>{categorias.map((item) => <option key={item.uuid} value={item.uuid}>{item.nome} · {item.tipo}</option>)}</select></Campo><Campo label="Valor"><Input type="number" min="0.01" step="0.01" value={lancamentoValor} onChange={(e) => setLancamentoValor(e.target.value)} /></Campo><Campo label="Data"><Input type="date" value={lancamentoData} onChange={(e) => setLancamentoData(e.target.value)} /></Campo><Campo label="Descrição"><Input value={lancamentoDescricao} onChange={(e) => setLancamentoDescricao(e.target.value)} /></Campo></div><div className="mt-3 flex gap-2"><Button onClick={() => void salvarLancamento()} disabled={salvando || categorias.length === 0}><Plus /> Salvar</Button>{lancamentoEditando ? <Button variant="outline" onClick={() => setLancamentoEditando(null)}>Cancelar</Button> : null}</div>
          <ul className="mt-5 divide-y divide-border border-y border-border">{lancamentosMes.length === 0 ? <li className="py-4 text-sm text-muted-foreground">Nenhum lançamento neste mês.</li> : lancamentosMes.map((item) => <li key={item.uuid} className="flex items-center gap-3 py-3"><span className={`flex size-8 items-center justify-center rounded-lg ${item.tipo === 'entrada' ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'}`}>{item.tipo === 'entrada' ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}</span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.descricao || nomeCategoria(item.categoria_uuid)}</strong><span className="text-xs text-muted-foreground">{nomeCategoria(item.categoria_uuid)} · {new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR')}</span></div><strong className="font-mono text-sm tabular-nums">{item.tipo === 'saida' ? '-' : '+'}{moeda.format(Number(item.valor))}</strong><Button size="icon-xs" variant="ghost" onClick={() => editarLancamento(item)} aria-label="Editar lançamento"><Pencil /></Button><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'lancamento', uuid: item.uuid, nome: item.descricao || nomeCategoria(item.categoria_uuid) })} aria-label="Excluir lançamento"><Trash2 /></Button></li>)}</ul>
        </section>

        <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Organização</p><h2 className="mt-1 text-xl font-semibold">Categorias</h2><div className="mt-4 grid gap-3"><Campo label="Nome"><Input value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} /></Campo><div className="grid grid-cols-[1fr_auto] gap-2"><Campo label="Tipo"><select value={categoriaTipo} onChange={(e) => setCategoriaTipo(e.target.value as TipoMovimento)} className={selectClass}><option value="saida">Saída</option><option value="entrada">Entrada</option></select></Campo><Campo label="Cor"><Input type="color" value={categoriaCor} onChange={(e) => setCategoriaCor(e.target.value)} className="w-16 p-1" /></Campo></div></div><Button className="mt-3" variant="outline" onClick={() => void salvarCategoria()} disabled={salvando}><Plus /> {categoriaEditando ? 'Salvar edição' : 'Adicionar categoria'}</Button><ul className="mt-4 flex flex-wrap gap-2">{categorias.map((item) => <li key={item.uuid} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><i className="size-2 rounded-full" style={{ background: item.cor ?? undefined }} />{item.nome}<Button size="icon-xs" variant="ghost" onClick={() => editarCategoria(item)} aria-label={`Editar ${item.nome}`}><Pencil /></Button><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'categoria', uuid: item.uuid, nome: item.nome })} aria-label={`Excluir ${item.nome}`}><Trash2 /></Button></li>)}</ul></section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Limites</p><h2 className="mt-1 text-xl font-semibold">Orçamentos do mês</h2><div className="mt-4 grid grid-cols-[1fr_8rem] gap-2"><select value={orcamentoCategoria} onChange={(e) => setOrcamentoCategoria(e.target.value)} className={selectClass}><option value="">Categoria de saída</option>{categorias.filter((item) => item.tipo === 'saida').map((item) => <option key={item.uuid} value={item.uuid}>{item.nome}</option>)}</select><Input type="number" min="0.01" step="0.01" placeholder="Limite" value={orcamentoValor} onChange={(e) => setOrcamentoValor(e.target.value)} /></div><Button className="mt-3" variant="outline" onClick={() => void salvarOrcamento()} disabled={salvando}><Landmark /> Salvar limite</Button><ul className="mt-4 space-y-4">{orcamentosMes.length === 0 ? <li className="text-sm text-muted-foreground">Nenhum orçamento definido.</li> : orcamentosMes.map((item) => { const gasto = lancamentosMes.filter((l) => l.tipo === 'saida' && l.categoria_uuid === item.categoria_uuid).reduce((total, l) => total + Number(l.valor), 0); return <li key={item.uuid}><div className="flex items-center justify-between gap-3 text-sm"><span>{nomeCategoria(item.categoria_uuid)}</span><span className="font-mono text-xs">{moeda.format(gasto)} / {moeda.format(Number(item.valor_limite))}</span><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'orcamento', uuid: item.uuid, nome: nomeCategoria(item.categoria_uuid) })} aria-label="Excluir orçamento"><Trash2 /></Button></div><Progress className="mt-2" value={(gasto / Number(item.valor_limite)) * 100} indicatorClassName={gasto > Number(item.valor_limite) ? 'bg-destructive' : undefined} /></li> })}</ul></section>

        <section className="border-t border-border pt-5"><p className="font-mono text-xs uppercase text-muted-foreground">Objetivos</p><h2 className="mt-1 text-xl font-semibold">Metas de economia</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Campo label="Título"><Input value={metaTitulo} onChange={(e) => setMetaTitulo(e.target.value)} /></Campo><Campo label="Data alvo"><Input type="date" value={metaData} onChange={(e) => setMetaData(e.target.value)} /></Campo><Campo label="Valor alvo"><Input type="number" min="0.01" step="0.01" value={metaAlvo} onChange={(e) => setMetaAlvo(e.target.value)} /></Campo><Campo label="Valor atual"><Input type="number" min="0" step="0.01" value={metaAtual} onChange={(e) => setMetaAtual(e.target.value)} /></Campo></div><Button className="mt-3" onClick={() => void salvarMeta()} disabled={salvando}><Target /> {metaEditando ? 'Salvar meta' : 'Criar meta'}</Button><ul className="mt-4 space-y-4">{metas.map((item) => <li key={item.uuid}><div className="flex items-center gap-2"><PiggyBank className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.titulo}</span><Button size="icon-xs" variant="ghost" onClick={() => editarMeta(item)} aria-label={`Editar ${item.titulo}`}><Pencil /></Button><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'meta', uuid: item.uuid, nome: item.titulo })} aria-label={`Excluir ${item.titulo}`}><Trash2 /></Button></div><Progress className="mt-2" value={(Number(item.valor_atual) / Number(item.valor_alvo)) * 100} /><p className="mt-1 text-xs text-muted-foreground">{moeda.format(Number(item.valor_atual))} de {moeda.format(Number(item.valor_alvo))}</p></li>)}</ul></section>
      </div>

      <section className="mt-10 border-t border-border pt-5">
        <p className="font-mono text-xs uppercase text-muted-foreground">Patrimônio</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Investimentos</h2><p className="mt-1 text-sm text-muted-foreground">A posição fica salva; a cotação é consultada sob demanda e nunca é persistida.</p></div>
          <strong className="font-mono text-sm tabular-nums">Custo acumulado: {moeda.format(investimentos.reduce((total, item) => total + Number(item.quantidade) * Number(item.preco_medio), 0))}</strong>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Ticker"><Input value={investimentoTicker} onChange={(e) => setInvestimentoTicker(e.target.value.toUpperCase())} placeholder="PETR4" maxLength={15} /></Campo>
          <Campo label="Tipo"><select className={selectClass} value={investimentoTipo} onChange={(e) => setInvestimentoTipo(e.target.value as TipoInvestimento)}>{tiposInvestimento.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select></Campo>
          <Campo label="Quantidade"><Input type="number" min="0.00000001" step="0.00000001" value={investimentoQuantidade} onChange={(e) => setInvestimentoQuantidade(e.target.value)} /></Campo>
          <Campo label="Preço médio"><Input type="number" min="0" step="0.01" value={investimentoPrecoMedio} onChange={(e) => setInvestimentoPrecoMedio(e.target.value)} /></Campo>
        </div>
        <div className="mt-3 flex gap-2"><Button onClick={() => void salvarInvestimento()} disabled={salvando}><TrendingUp />{investimentoEditando ? 'Salvar posição' : 'Adicionar posição'}</Button>{investimentoEditando ? <Button variant="outline" onClick={() => { setInvestimentoEditando(null); setInvestimentoTicker(''); setInvestimentoQuantidade(''); setInvestimentoPrecoMedio('') }}>Cancelar</Button> : null}</div>
        {avisoCotacao ? <p role="status" className="mt-3 text-xs text-muted-foreground">{avisoCotacao}</p> : null}
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {investimentos.length === 0 ? <li className="text-sm text-muted-foreground">Nenhuma posição cadastrada.</li> : investimentos.map((item) => {
            const cotacao = cotacoes[item.ticker]
            const custo = Number(item.quantidade) * Number(item.preco_medio)
            const valorAtual = cotacao ? Number(item.quantidade) * cotacao.preco : null
            return <li key={item.uuid} className="rounded-lg border border-border bg-card p-4"><div className="flex items-start gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><TrendingUp className="size-4" /></span><div className="min-w-0 flex-1"><strong className="block">{item.ticker}</strong><span className="text-xs text-muted-foreground">{tiposInvestimento.find((tipo) => tipo.value === item.tipo)?.label ?? item.tipo}</span></div><Button size="icon-xs" variant="ghost" onClick={() => editarInvestimento(item)} aria-label={`Editar ${item.ticker}`}><Pencil /></Button><Button size="icon-xs" variant="ghost" onClick={() => setExclusao({ tipo: 'investimento', uuid: item.uuid, nome: item.ticker })} aria-label={`Excluir ${item.ticker}`}><Trash2 /></Button></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Quantidade</dt><dd className="mt-1 font-mono">{Number(item.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 8 })}</dd></div><div><dt className="text-muted-foreground">Preço médio</dt><dd className="mt-1 font-mono">{moeda.format(Number(item.preco_medio))}</dd></div><div><dt className="text-muted-foreground">Custo</dt><dd className="mt-1 font-mono">{moeda.format(custo)}</dd></div><div><dt className="text-muted-foreground">Cotação</dt><dd className="mt-1 font-mono">{cotacao ? formatarCotacao(cotacao.preco, cotacao.moeda) : '—'}</dd></div></dl>{valorAtual !== null ? <p className="mt-3 text-xs text-muted-foreground">Valor estimado: <strong className="text-foreground">{formatarCotacao(valorAtual, cotacao.moeda)}</strong>{cotacao.variacao_percentual !== null ? ` · ${cotacao.variacao_percentual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% no dia` : ''}</p> : null}<Button className="mt-3" size="sm" variant="outline" onClick={() => void consultarCotacao(item.ticker)} disabled={cotacaoCarregando === item.ticker}><RefreshCw className={cotacaoCarregando === item.ticker ? 'animate-spin' : ''} />Consultar cotação</Button></li>
          })}
        </ul>
      </section>
    </div><ConfirmDialog open={Boolean(exclusao)} onOpenChange={(open) => !open && setExclusao(null)} title="Excluir registro?" description={`“${exclusao?.nome ?? ''}” será removido das listas por exclusão lógica.`} confirmLabel="Excluir" onConfirm={confirmarExclusao} /></main>
  )
}

const selectClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'
function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label> }
function Resumo({ icon: Icon, label, valor, positive = false }: { icon: typeof ArrowUpRight; label: string; valor: number; positive?: boolean }) { return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" />{label}</div><strong className={`mt-3 block font-mono text-xl tabular-nums ${positive ? 'text-success' : ''}`}>{moeda.format(valor)}</strong></div> }
function formatarCotacao(valor: number, currency: string) { try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(valor) } catch { return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) } }
