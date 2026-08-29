'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, Check, Clock3, Languages, Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { dataLocalIso } from '@/lib/date'
import {
  atualizarIdioma,
  atualizarVocabulario,
  criarIdioma,
  criarPratica,
  criarVocabulario,
  deletarIdioma,
  deletarPratica,
  deletarVocabulario,
  Idioma,
  listarIdiomas,
  listarPraticas,
  listarVocabulario,
  PraticaIdioma,
  TIPOS_PRATICA_IDIOMA,
  TipoPraticaIdioma,
  VocabularioIdioma,
} from '@/lib/idiomas'
import { cn } from '@/lib/utils'

const IDIOMA_VAZIO = { nome: '', nivel_atual: '', objetivo: '', cor: '#7c9a72', ativo: true }
const VOCABULARIO_VAZIO = { termo: '', traducao: '', exemplo: '' }
const PRATICA_VAZIA = { data: dataLocalIso(), tipo: 'leitura' as TipoPraticaIdioma, duracao_minutos: 20, observacoes: '' }

function formatarMinutos(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const restante = minutos % 60
  return restante ? `${horas}h ${restante}min` : `${horas}h`
}

export default function IdiomasPage() {
  const [idiomas, setIdiomas] = useState<Idioma[]>([])
  const [selecionadoUuid, setSelecionadoUuid] = useState<string | null>(null)
  const [vocabulario, setVocabulario] = useState<VocabularioIdioma[]>([])
  const [praticas, setPraticas] = useState<PraticaIdioma[]>([])
  const [novoIdioma, setNovoIdioma] = useState(IDIOMA_VAZIO)
  const [edicao, setEdicao] = useState(IDIOMA_VAZIO)
  const [novoVocabulario, setNovoVocabulario] = useState(VOCABULARIO_VAZIO)
  const [novaPratica, setNovaPratica] = useState(PRATICA_VAZIA)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmacao, setConfirmacao] = useState<{ title: string; description: string; action: () => Promise<void> } | null>(null)

  const selecionado = useMemo(
    () => idiomas.find((idioma) => idioma.uuid === selecionadoUuid) ?? null,
    [idiomas, selecionadoUuid],
  )

  const carregarIdiomas = useCallback(async (preferirUuid?: string) => {
    const atuais = await listarIdiomas()
    if (atuais === null) {
      setErro('Não foi possível carregar os idiomas.')
      setCarregando(false)
      return
    }
    setIdiomas(atuais)
    setSelecionadoUuid((atual) => {
      const candidato = preferirUuid ?? atual
      return atuais.some((idioma) => idioma.uuid === candidato) ? candidato : atuais[0]?.uuid ?? null
    })
    setCarregando(false)
  }, [])

  const carregarDetalhes = useCallback(async (idiomaUuid: string) => {
    const [palavras, registros] = await Promise.all([
      listarVocabulario(idiomaUuid),
      listarPraticas(idiomaUuid),
    ])
    if (palavras === null || registros === null) {
      setErro('Parte dos dados do idioma não pôde ser carregada.')
    }
    setVocabulario(palavras ?? [])
    setPraticas(registros ?? [])
  }, [])

  useEffect(() => {
    // O carregamento assíncrono inicial sincroniza a tela com o Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarIdiomas()
  }, [carregarIdiomas])

  useEffect(() => {
    if (!selecionado) {
      // A seleção controla os três estados editáveis exibidos no painel.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVocabulario([])
      setPraticas([])
      setEdicao(IDIOMA_VAZIO)
      return
    }
    setEdicao({
      nome: selecionado.nome,
      nivel_atual: selecionado.nivel_atual ?? '',
      objetivo: selecionado.objetivo ?? '',
      cor: selecionado.cor ?? '#7c9a72',
      ativo: selecionado.ativo,
    })
    void carregarDetalhes(selecionado.uuid)
  }, [carregarDetalhes, selecionado])

  const resumo = useMemo(() => {
    const hoje = new Date()
    const inicioMes = `${dataLocalIso(hoje).slice(0, 7)}-01`
    const inicioSemana = new Date(hoje)
    const dia = inicioSemana.getDay()
    inicioSemana.setDate(inicioSemana.getDate() - (dia === 0 ? 6 : dia - 1))
    const semana = dataLocalIso(inicioSemana)
    return {
      semana: praticas.filter((pratica) => pratica.data >= semana).reduce((total, pratica) => total + pratica.duracao_minutos, 0),
      mes: praticas.filter((pratica) => pratica.data >= inicioMes).reduce((total, pratica) => total + pratica.duracao_minutos, 0),
      dominadas: vocabulario.filter((item) => item.dominado).length,
    }
  }, [praticas, vocabulario])

  async function adicionarIdioma(event: React.FormEvent) {
    event.preventDefault()
    if (!novoIdioma.nome.trim()) return
    setSalvando(true)
    const criado = await criarIdioma({
      nome: novoIdioma.nome.trim(),
      nivel_atual: novoIdioma.nivel_atual.trim() || null,
      objetivo: novoIdioma.objetivo.trim() || null,
      cor: novoIdioma.cor || null,
      ativo: novoIdioma.ativo,
    })
    setSalvando(false)
    if (!criado) return setErro('Não foi possível criar o idioma. Verifique se o nome já existe.')
    setNovoIdioma(IDIOMA_VAZIO)
    setErro('')
    await carregarIdiomas(criado.uuid)
  }

  async function salvarIdioma() {
    if (!selecionado || !edicao.nome.trim()) return
    setSalvando(true)
    const atualizado = await atualizarIdioma(selecionado.uuid, {
      nome: edicao.nome.trim(),
      nivel_atual: edicao.nivel_atual.trim() || null,
      objetivo: edicao.objetivo.trim() || null,
      cor: edicao.cor || null,
      ativo: edicao.ativo,
    })
    setSalvando(false)
    if (!atualizado) return setErro('Não foi possível salvar o idioma.')
    setErro('')
    await carregarIdiomas(atualizado.uuid)
  }

  async function adicionarVocabulario(event: React.FormEvent) {
    event.preventDefault()
    if (!selecionado || !novoVocabulario.termo.trim() || !novoVocabulario.traducao.trim()) return
    const criado = await criarVocabulario({
      idioma_uuid: selecionado.uuid,
      termo: novoVocabulario.termo.trim(),
      traducao: novoVocabulario.traducao.trim(),
      exemplo: novoVocabulario.exemplo.trim() || null,
      dominado: false,
    })
    if (!criado) return setErro('Não foi possível adicionar o vocabulário.')
    setNovoVocabulario(VOCABULARIO_VAZIO)
    setVocabulario((atuais) => [criado, ...atuais])
    setErro('')
  }

  async function alternarDominado(item: VocabularioIdioma) {
    const atualizado = await atualizarVocabulario(item.uuid, { dominado: !item.dominado })
    if (!atualizado) return setErro('Não foi possível atualizar o vocabulário.')
    setVocabulario((atuais) => atuais.map((atual) => atual.uuid === atualizado.uuid ? atualizado : atual))
  }

  async function adicionarPratica(event: React.FormEvent) {
    event.preventDefault()
    if (!selecionado || novaPratica.duracao_minutos <= 0) return
    const criada = await criarPratica({
      idioma_uuid: selecionado.uuid,
      data: novaPratica.data,
      tipo: novaPratica.tipo,
      duracao_minutos: novaPratica.duracao_minutos,
      observacoes: novaPratica.observacoes.trim() || null,
    })
    if (!criada) return setErro('Não foi possível registrar a prática.')
    setNovaPratica(PRATICA_VAZIA)
    setPraticas((atuais) => [criada, ...atuais])
    setErro('')
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <h1 className="text-3xl font-semibold">Idiomas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Organize vocabulário, práticas e tempo dedicado sem depender de serviços externos.</p>
        </header>

        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

        <Card className="mt-7 p-4">
          <form onSubmit={adicionarIdioma} className="grid gap-3 md:grid-cols-[minmax(11rem,1fr)_10rem_8rem_auto] md:items-end">
            <div className="space-y-2"><Label htmlFor="novo-idioma">Novo idioma</Label><Input id="novo-idioma" value={novoIdioma.nome} onChange={(event) => setNovoIdioma((atual) => ({ ...atual, nome: event.target.value }))} placeholder="Ex.: Espanhol" /></div>
            <div className="space-y-2"><Label htmlFor="novo-nivel">Nível atual</Label><Input id="novo-nivel" value={novoIdioma.nivel_atual} onChange={(event) => setNovoIdioma((atual) => ({ ...atual, nivel_atual: event.target.value }))} placeholder="Ex.: A2" /></div>
            <div className="space-y-2"><Label htmlFor="nova-cor">Cor</Label><Input id="nova-cor" type="color" value={novoIdioma.cor} onChange={(event) => setNovoIdioma((atual) => ({ ...atual, cor: event.target.value }))} /></div>
            <Button type="submit" disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Plus />}Adicionar</Button>
          </form>
        </Card>

        {carregando ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[16rem_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
        ) : idiomas.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-y border-border py-12 text-center text-muted-foreground"><Languages className="size-8" /><p>Nenhum idioma cadastrado.</p></div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="border-border lg:border-r lg:pr-5">
              <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Seus idiomas</p>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
                {idiomas.map((idioma) => (
                  <button key={idioma.uuid} type="button" onClick={() => setSelecionadoUuid(idioma.uuid)} className={cn('min-w-44 rounded-lg border-l-4 px-3 py-3 text-left outline-none transition-colors lg:min-w-0', selecionadoUuid === idioma.uuid ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')} style={{ borderLeftColor: idioma.cor ?? 'transparent' }}>
                    <strong className="block truncate text-sm">{idioma.nome}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">{idioma.nivel_atual || 'Nível não informado'} · {idioma.ativo ? 'ativo' : 'pausado'}</span>
                  </button>
                ))}
              </div>
            </aside>

            {selecionado ? (
              <section className="min-w-0">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric icon={Clock3} label="Nesta semana" value={formatarMinutos(resumo.semana)} />
                  <Metric icon={Clock3} label="Neste mês" value={formatarMinutos(resumo.mes)} />
                  <Metric icon={BookOpenCheck} label="Vocabulário dominado" value={`${resumo.dominadas}/${vocabulario.length}`} />
                </div>

                <Card className="mt-5 p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-end">
                    <div className="space-y-2"><Label htmlFor="idioma-nome">Nome</Label><Input id="idioma-nome" value={edicao.nome} onChange={(event) => setEdicao((atual) => ({ ...atual, nome: event.target.value }))} /></div>
                    <div className="space-y-2"><Label htmlFor="idioma-nivel">Nível</Label><Input id="idioma-nivel" value={edicao.nivel_atual} onChange={(event) => setEdicao((atual) => ({ ...atual, nivel_atual: event.target.value }))} /></div>
                    <div className="space-y-2"><Label htmlFor="idioma-cor">Cor</Label><Input id="idioma-cor" type="color" value={edicao.cor} onChange={(event) => setEdicao((atual) => ({ ...atual, cor: event.target.value }))} /></div>
                    <div className="flex gap-2"><Button type="button" onClick={salvarIdioma} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />}Salvar</Button><Button type="button" variant="ghost" size="icon" aria-label="Apagar idioma" onClick={() => setConfirmacao({ title: 'Apagar idioma?', description: `“${selecionado.nome}” e seus registros deixarão de aparecer.`, action: async () => { if (await deletarIdioma(selecionado.uuid)) await carregarIdiomas() } })}><Trash2 /></Button></div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"><div className="space-y-2"><Label htmlFor="idioma-objetivo">Objetivo</Label><Textarea id="idioma-objetivo" rows={2} value={edicao.objetivo} onChange={(event) => setEdicao((atual) => ({ ...atual, objetivo: event.target.value }))} placeholder="O que você quer alcançar?" /></div><label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={edicao.ativo} onChange={(event) => setEdicao((atual) => ({ ...atual, ativo: event.target.checked }))} />Idioma ativo</label></div>
                </Card>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <Card className="p-4">
                    <h2 className="font-semibold">Vocabulário</h2>
                    <form onSubmit={adicionarVocabulario} className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Input value={novoVocabulario.termo} onChange={(event) => setNovoVocabulario((atual) => ({ ...atual, termo: event.target.value }))} placeholder="Termo" aria-label="Termo" />
                      <Input value={novoVocabulario.traducao} onChange={(event) => setNovoVocabulario((atual) => ({ ...atual, traducao: event.target.value }))} placeholder="Tradução" aria-label="Tradução" />
                      <Input className="sm:col-span-2" value={novoVocabulario.exemplo} onChange={(event) => setNovoVocabulario((atual) => ({ ...atual, exemplo: event.target.value }))} placeholder="Exemplo opcional" aria-label="Exemplo" />
                      <Button type="submit" className="sm:col-span-2"><Plus />Adicionar palavra</Button>
                    </form>
                    <ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto">
                      {vocabulario.length === 0 ? <li className="py-8 text-center text-sm text-muted-foreground">Nenhuma palavra cadastrada.</li> : vocabulario.map((item) => (
                        <li key={item.uuid} className="flex items-start gap-3 py-3">
                          <Button type="button" variant={item.dominado ? 'default' : 'outline'} size="icon-xs" aria-label={item.dominado ? 'Marcar como não dominado' : 'Marcar como dominado'} onClick={() => void alternarDominado(item)}><Check /></Button>
                          <div className="min-w-0 flex-1"><strong className={cn('block text-sm', item.dominado && 'text-muted-foreground line-through')}>{item.termo}</strong><span className="block text-sm text-muted-foreground">{item.traducao}</span>{item.exemplo ? <span className="mt-1 block text-xs italic text-muted-foreground">{item.exemplo}</span> : null}</div>
                          <Button type="button" variant="ghost" size="icon-xs" aria-label="Apagar palavra" onClick={() => setConfirmacao({ title: 'Apagar palavra?', description: `“${item.termo}” será removida do vocabulário.`, action: async () => { if (await deletarVocabulario(item.uuid)) setVocabulario((atuais) => atuais.filter((atual) => atual.uuid !== item.uuid)) } })}><Trash2 /></Button>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-4">
                    <h2 className="font-semibold">Práticas</h2>
                    <form onSubmit={adicionarPratica} className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Input type="date" value={novaPratica.data} onChange={(event) => setNovaPratica((atual) => ({ ...atual, data: event.target.value }))} aria-label="Data da prática" required />
                      <Select value={novaPratica.tipo} onChange={(event) => setNovaPratica((atual) => ({ ...atual, tipo: event.target.value as TipoPraticaIdioma }))} aria-label="Tipo da prática">{Object.entries(TIPOS_PRATICA_IDIOMA).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}</Select>
                      <Input type="number" min={1} value={novaPratica.duracao_minutos} onChange={(event) => setNovaPratica((atual) => ({ ...atual, duracao_minutos: Number(event.target.value) }))} aria-label="Duração em minutos" />
                      <Input value={novaPratica.observacoes} onChange={(event) => setNovaPratica((atual) => ({ ...atual, observacoes: event.target.value }))} placeholder="Observação opcional" aria-label="Observação" />
                      <Button type="submit" className="sm:col-span-2"><Plus />Registrar prática</Button>
                    </form>
                    <ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto">
                      {praticas.length === 0 ? <li className="py-8 text-center text-sm text-muted-foreground">Nenhuma prática registrada.</li> : praticas.map((pratica) => (
                        <li key={pratica.uuid} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{new Date(`${pratica.data}T00:00:00`).toLocaleDateString('pt-BR')}</strong><Badge variant="outline">{TIPOS_PRATICA_IDIOMA[pratica.tipo]}</Badge><span className="font-mono text-xs text-muted-foreground">{formatarMinutos(pratica.duracao_minutos)}</span></div>{pratica.observacoes ? <p className="mt-1 truncate text-xs text-muted-foreground">{pratica.observacoes}</p> : null}</div><Button type="button" variant="ghost" size="icon-xs" aria-label="Apagar prática" onClick={() => setConfirmacao({ title: 'Apagar prática?', description: 'Este registro de prática será removido.', action: async () => { if (await deletarPratica(pratica.uuid)) setPraticas((atuais) => atuais.filter((atual) => atual.uuid !== pratica.uuid)) } })}><Trash2 /></Button></li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmacao !== null} title={confirmacao?.title ?? ''} description={confirmacao?.description ?? ''} confirmLabel="Apagar" onOpenChange={(open) => { if (!open) setConfirmacao(null) }} onConfirm={async () => { await confirmacao?.action() }} />
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <Card className="flex items-center gap-3 p-4"><span className="flex size-9 items-center justify-center rounded-lg bg-secondary"><Icon className="size-4" /></span><div><strong className="block font-mono text-lg">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div></Card>
}
