'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Landmark, Pencil, PiggyBank, Plus, Target, Trash2, WalletCards } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  CategoriaFinanceira,
  deletarCategoriaFinanceira,
  deletarLancamentoFinanceiro,
  deletarMetaEconomia,
  deletarOrcamentoFinanceiro,
  LancamentoFinanceiro,
  listarCategoriasFinanceiras,
  listarLancamentosFinanceiros,
  listarMetasEconomia,
  listarOrcamentosFinanceiros,
  MetaEconomia,
  OrcamentoFinanceiro,
  salvarCategoriaFinanceira,
  salvarLancamentoFinanceiro,
  salvarMetaEconomia,
  salvarOrcamentoFinanceiro,
  TipoMovimento,
} from '@/lib/financas'
import { dataLocalIso } from '@/lib/date'

type Exclusao = { tipo: 'categoria' | 'lancamento' | 'orcamento' | 'meta'; uuid: string; nome: string }

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function FinancasPage() {
  const agora = new Date()
  const [periodo, setPeriodo] = useState(`${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`)
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([])
  const [metas, setMetas] = useState<MetaEconomia[]>([])
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

  const carregar = useCallback(async () => {
    const [categoriasData, lancamentosData, orcamentosData, metasData] = await Promise.all([
      listarCategoriasFinanceiras(), listarLancamentosFinanceiros(), listarOrcamentosFinanceiros(), listarMetasEconomia(),
    ])
    if ([categoriasData, lancamentosData, orcamentosData, metasData].some((item) => item === null)) setErro('Parte dos dados financeiros não pôde ser carregada.')
    setCategorias(categoriasData ?? [])
    setLancamentos(lancamentosData ?? [])
    setOrcamentos(orcamentosData ?? [])
    setMetas(metasData ?? [])
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

  function editarCategoria(item: CategoriaFinanceira) { setCategoriaEditando(item); setCategoriaNome(item.nome); setCategoriaTipo(item.tipo); setCategoriaCor(item.cor ?? '#3b82f6') }
  function editarLancamento(item: LancamentoFinanceiro) { setLancamentoEditando(item); setLancamentoCategoria(item.categoria_uuid); setLancamentoValor(String(item.valor)); setLancamentoData(item.data); setLancamentoDescricao(item.descricao ?? '') }
  function editarMeta(item: MetaEconomia) { setMetaEditando(item); setMetaTitulo(item.titulo); setMetaAlvo(String(item.valor_alvo)); setMetaAtual(String(item.valor_atual)); setMetaData(item.data_alvo ?? '') }

  async function confirmarExclusao() {
    if (!exclusao) return
    const acoes = { categoria: deletarCategoriaFinanceira, lancamento: deletarLancamentoFinanceiro, orcamento: deletarOrcamentoFinanceiro, meta: deletarMetaEconomia }
    await executar(() => acoes[exclusao.tipo](exclusao.uuid))
    setExclusao(null)
  }

  const nomeCategoria = (uuid: string) => categorias.find((item) => item.uuid === uuid)?.nome ?? 'Categoria removida'

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase text-muted-foreground">Organização pessoal</p><h1 className="mt-2 text-3xl font-semibold">Finanças</h1><p className="mt-2 text-muted-foreground">Entradas, saídas e objetivos sem depender de cotações externas.</p></div><label className="text-xs font-medium text-muted-foreground">Mês<Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-1 w-44" /></label></header>
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
    </div><ConfirmDialog open={Boolean(exclusao)} onOpenChange={(open) => !open && setExclusao(null)} title="Excluir registro?" description={`“${exclusao?.nome ?? ''}” será removido das listas por exclusão lógica.`} confirmLabel="Excluir" onConfirm={confirmarExclusao} /></main>
  )
}

const selectClass = 'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'
function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label> }
function Resumo({ icon: Icon, label, valor, positive = false }: { icon: typeof ArrowUpRight; label: string; valor: number; positive?: boolean }) { return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" />{label}</div><strong className={`mt-3 block font-mono text-xl tabular-nums ${positive ? 'text-success' : ''}`}>{moeda.format(valor)}</strong></div> }
