'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArchiveRestore,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FileUp,
  Plus,
  Play,
  Trash2,
} from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { MonoLabel } from '@/components/study/mono-label'
import { Section } from '@/components/study/section'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { dataLocalIso } from '@/lib/date'
import { analisarFlashcards, FlashcardImportado } from '@/lib/flashcard-import'
import { Conteudo, listarConteudosPorMateria } from '@/lib/conteudos'
import { listarMaterias, Materia } from '@/lib/materias'
import {
  avaliarCard,
  CardRevisao,
  criarCardManual,
  definirCardArquivado,
  deletarCardRevisao,
  importarCardsRevisao,
  listarCardsArquivados,
  listarCardsRevisao,
  Qualidade,
} from '@/lib/revisao'

const RESULTADOS: { label: string; qualidade: Qualidade }[] = [
  { label: 'Errei', qualidade: 1 },
  { label: 'Difícil', qualidade: 3 },
  { label: 'Bom', qualidade: 4 },
  { label: 'Fácil', qualidade: 5 },
]

interface AnkiDeck {
  id: string
  nome: string
  quantidade: number
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RevisaoPage() {
  const [cards, setCards] = useState<CardRevisao[]>([])
  const [arquivados, setArquivados] = useState<CardRevisao[]>([])
  const [aba, setAba] = useState<'ativos' | 'arquivados'>('ativos')
  const [carregando, setCarregando] = useState(true)
  const [processandoUuid, setProcessandoUuid] = useState<string | null>(null)
  const [respostasVisiveis, setRespostasVisiveis] = useState<Set<string>>(new Set())
  const [cardParaApagar, setCardParaApagar] = useState<CardRevisao | null>(null)
  const [erro, setErro] = useState('')
  const [novoCard, setNovoCard] = useState({ pergunta: '', resposta: '' })
  const [importando, setImportando] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState('')
  const [previewImportacao, setPreviewImportacao] = useState<FlashcardImportado[]>([])
  const [moduloPadrao, setModuloPadrao] = useState('manual')
  const [filtroModulo, setFiltroModulo] = useState('todos')
  const [materias, setMaterias] = useState<Materia[]>([])
  const [conteudosImportacao, setConteudosImportacao] = useState<Conteudo[]>([])
  const [materiaImportacao, setMateriaImportacao] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('materia') ?? '')
  const [conteudoImportacao, setConteudoImportacao] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('conteudo') ?? '')
  const [filtroMateria, setFiltroMateria] = useState('todos')
  const [filtroConteudo, setFiltroConteudo] = useState('todos')
  const [conteudosFiltro, setConteudosFiltro] = useState<Conteudo[]>([])
  const [arquivoAnki, setArquivoAnki] = useState<File | null>(null)
  const [decksAnki, setDecksAnki] = useState<AnkiDeck[]>([])
  const [deckAnki, setDeckAnki] = useState('')

  const carregar = useCallback(async () => {
    const [atuais, suspensos, materiasAtuais] = await Promise.all([
      listarCardsRevisao(),
      listarCardsArquivados(),
      listarMaterias(),
    ])
    if (atuais === null || suspensos === null) {
      setErro('Não foi possível carregar as revisões.')
    } else {
      setCards(atuais)
      setArquivados(suspensos)
      setMaterias(materiasAtuais ?? [])
      setErro('')
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregar()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  useEffect(() => {
    if (!materiaImportacao) return
    void listarConteudosPorMateria(materiaImportacao).then((itens) => setConteudosImportacao(itens ?? []))
  }, [materiaImportacao])

  useEffect(() => {
    if (filtroMateria === 'todos') return
    void listarConteudosPorMateria(filtroMateria).then((itens) => setConteudosFiltro(itens ?? []))
  }, [filtroMateria])

  const hoje = dataLocalIso()
  const modulosDisponiveis = useMemo(() => [...new Set([...cards, ...arquivados].map((card) => card.modulo || 'manual'))].sort(), [cards, arquivados])
  const aplicarFiltros = useCallback((itens: CardRevisao[]) => itens.filter((card) => {
    if (filtroModulo !== 'todos' && (card.modulo || 'manual') !== filtroModulo) return false
    if (filtroMateria !== 'todos' && card.materia_uuid !== filtroMateria) return false
    if (filtroConteudo !== 'todos' && card.conteudo_uuid !== filtroConteudo) return false
    return true
  }), [filtroConteudo, filtroMateria, filtroModulo])
  const cardsFiltrados = useMemo(() => aplicarFiltros(cards), [aplicarFiltros, cards])
  const arquivadosFiltrados = useMemo(() => aplicarFiltros(arquivados), [aplicarFiltros, arquivados])
  const { pendentes, futuras, atrasadas, paraHoje } = useMemo(() => {
    const atrasados = cardsFiltrados.filter((card) => card.proxima_revisao < hoje)
    const hojeCards = cardsFiltrados.filter((card) => card.proxima_revisao === hoje)
    return {
      pendentes: [...atrasados, ...hojeCards],
      futuras: cardsFiltrados.filter((card) => card.proxima_revisao > hoje),
      atrasadas: atrasados.length,
      paraHoje: hojeCards.length,
    }
  }, [cardsFiltrados, hoje])

  async function handleCriarCard(event: React.FormEvent) {
    event.preventDefault()
    if (!novoCard.pergunta.trim()) return

    const criado = await criarCardManual({
      pergunta: novoCard.pergunta.trim(),
      resposta: novoCard.resposta.trim() || null,
    })
    if (!criado) {
      setErro('Não foi possível criar o card.')
      return
    }

    setNovoCard({ pergunta: '', resposta: '' })
    await carregar()
  }

  async function handleSelecionarImportacao(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return
    if (!/\.(csv|tsv|apkg)$/i.test(arquivo.name)) {
      setErro('Selecione um arquivo .csv, .tsv ou .apkg.')
      return
    }

    setErro('')
    setResultadoImportacao('')
    if (/\.apkg$/i.test(arquivo.name)) {
      setArquivoAnki(arquivo)
      setImportando(true)
      try {
        const form = new FormData()
        form.set('arquivo', arquivo)
        const response = await fetch('/api/importacao/anki', { method: 'POST', body: form })
        const body = await response.json() as { decks?: AnkiDeck[]; cards?: FlashcardImportado[]; erro?: string }
        if (!response.ok) throw new Error(body.erro || 'Não foi possível ler o .apkg.')
        setDecksAnki(body.decks ?? [])
        setDeckAnki('')
        setPreviewImportacao(body.cards ?? [])
      } catch (error) {
        setArquivoAnki(null)
        setDecksAnki([])
        setPreviewImportacao([])
        setErro(error instanceof Error ? error.message : 'Não foi possível ler o .apkg.')
      } finally {
        setImportando(false)
      }
      return
    }
    setArquivoAnki(null)
    setDecksAnki([])
    setDeckAnki('')
    try {
      setPreviewImportacao(analisarFlashcards(await arquivo.text(), arquivo.size))
    } catch (error) {
      setPreviewImportacao([])
      setErro(error instanceof Error ? error.message : 'Não foi possível ler o arquivo.')
    }
  }

  async function selecionarDeckAnki(deckId: string) {
    setDeckAnki(deckId)
    if (!arquivoAnki || !deckId) return
    setImportando(true)
    setErro('')
    try {
      const form = new FormData()
      form.set('arquivo', arquivoAnki)
      form.set('deckId', deckId)
      const response = await fetch('/api/importacao/anki', { method: 'POST', body: form })
      const body = await response.json() as { cards?: FlashcardImportado[]; erro?: string }
      if (!response.ok) throw new Error(body.erro || 'Não foi possível ler o deck.')
      setPreviewImportacao(body.cards ?? [])
      const deck = decksAnki.find((item) => item.id === deckId)
      if (deck) setModuloPadrao(`anki:${deck.nome}`)
    } catch (error) {
      setPreviewImportacao([])
      setErro(error instanceof Error ? error.message : 'Não foi possível ler o deck.')
    } finally {
      setImportando(false)
    }
  }

  async function confirmarImportacao() {
    if (previewImportacao.length === 0) return
    setImportando(true)
    setErro('')
    setResultadoImportacao('')
    try {
      const cardsImportados = previewImportacao.map((card) => ({
        ...card,
        modulo: materiaImportacao ? 'estudos' : card.modulo || moduloPadrao,
        materia_uuid: materiaImportacao || null,
        conteudo_uuid: conteudoImportacao || null,
      }))
      const resultado = await importarCardsRevisao(cardsImportados)
      if (!resultado) throw new Error('Não foi possível salvar os cards importados.')
      setResultadoImportacao(`${resultado.criados} card${resultado.criados === 1 ? '' : 's'} criado${resultado.criados === 1 ? '' : 's'} · ${resultado.duplicados} duplicado${resultado.duplicados === 1 ? '' : 's'} ignorado${resultado.duplicados === 1 ? '' : 's'}.`)
      setPreviewImportacao([])
      setArquivoAnki(null)
      setDecksAnki([])
      setDeckAnki('')
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.')
    } finally {
      setImportando(false)
    }
  }

  async function handleAvaliar(cardUuid: string, qualidade: Qualidade) {
    setProcessandoUuid(cardUuid)
    const atualizado = await avaliarCard(cardUuid, qualidade)
    if (!atualizado) {
      setErro('Não foi possível registrar o resultado da revisão.')
    } else {
      setRespostasVisiveis((atuais) => {
        const proximas = new Set(atuais)
        proximas.delete(cardUuid)
        return proximas
      })
      await carregar()
    }
    setProcessandoUuid(null)
  }

  async function handleApagarConfirmado() {
    if (!cardParaApagar) return
    const apagado = await deletarCardRevisao(cardParaApagar)
    if (!apagado) {
      setErro('Não foi possível apagar o card.')
      return
    }
    await carregar()
  }

  async function handleArquivar(card: CardRevisao, arquivado: boolean) {
    setProcessandoUuid(card.uuid)
    const atualizado = await definirCardArquivado(card.uuid, arquivado)
    if (!atualizado) {
      setErro(`Não foi possível ${arquivado ? 'arquivar' : 'restaurar'} o card.`)
    } else {
      await carregar()
    }
    setProcessandoUuid(null)
  }

  function alternarResposta(uuid: string) {
    setRespostasVisiveis((atuais) => {
      const proximas = new Set(atuais)
      if (proximas.has(uuid)) proximas.delete(uuid)
      else proximas.add(uuid)
      return proximas
    })
  }

  return (
    <PageShell>
      <div className="mb-5">
        <BackLink href="/">Voltar ao início</BackLink>
      </div>
      <PageHeader
        title="Revisão Espaçada"
        description="Revise o que está pendente e registre o resultado para calcular o próximo intervalo."
      />

      <div role="tablist" aria-label="Filtros de revisão" className="mt-7 flex flex-wrap gap-2 border-b border-border pb-3">
        <Button
          type="button"
          role="tab"
          aria-selected={aba === 'ativos'}
          variant={aba === 'ativos' ? 'default' : 'ghost'}
          onClick={() => setAba('ativos')}
        >
          Ativos
          <Badge variant="outline">{cards.length}</Badge>
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={aba === 'arquivados'}
          variant={aba === 'arquivados' ? 'default' : 'ghost'}
          onClick={() => setAba('arquivados')}
        >
          <Archive className="size-3.5" />
          Arquivados
          <Badge variant="outline">{arquivados.length}</Badge>
        </Button>
        <Select value={filtroModulo} onChange={(event) => setFiltroModulo(event.target.value)} className="ml-auto w-40" aria-label="Filtrar por módulo">
          <option value="todos">Todos os módulos</option>
          {modulosDisponiveis.map((modulo) => <option key={modulo} value={modulo}>{modulo === 'manual' ? 'Manual' : modulo}</option>)}
        </Select>
        <Select value={filtroMateria} onChange={(event) => { setFiltroMateria(event.target.value); setFiltroConteudo('todos'); setConteudosFiltro([]) }} className="w-44" aria-label="Filtrar por matéria">
          <option value="todos">Todas as matérias</option>
          {materias.map((materia) => <option key={materia.uuid} value={materia.uuid}>{materia.nome}</option>)}
        </Select>
        <Select value={filtroConteudo} onChange={(event) => setFiltroConteudo(event.target.value)} className="w-44" aria-label="Filtrar por conteúdo" disabled={filtroMateria === 'todos'}>
          <option value="todos">Todos os conteúdos</option>
          {conteudosFiltro.map((conteudo) => <option key={conteudo.uuid} value={conteudo.uuid}>{conteudo.nome}</option>)}
        </Select>
      </div>

      <div className={`${aba === 'ativos' ? '' : 'hidden'} mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3`}>
        <ResumoCard icon={Clock3} label="Atrasadas" value={atrasadas} />
        <ResumoCard icon={CheckCircle2} label="Para hoje" value={paraHoje} />
        <ResumoCard icon={CalendarClock} label="Futuras" value={futuras.length} />
      </div>

      {aba === 'ativos' && pendentes.length > 0 ? (
        <div className="mt-5 flex justify-end">
          <Link
            className={buttonVariants()}
            href={`/revisao/sessao?materia=${filtroMateria === 'todos' ? '' : filtroMateria}&conteudo=${filtroConteudo === 'todos' ? '' : filtroConteudo}`}
          >
            <Play className="size-4" /> Iniciar sessão focada
          </Link>
        </div>
      ) : null}

      {erro ? (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <div className={`${aba === 'ativos' ? '' : 'hidden'} mt-10 flex flex-col gap-10`}>
        <Section label="Prioridade" title="Vencidas e para hoje" count={pendentes.length}>
          {carregando ? (
            <ListaSkeleton />
          ) : pendentes.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nenhuma revisão pendente" compact />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {pendentes.map((card) => (
                <RevisaoCard
                  key={card.uuid}
                  card={card}
                  hoje={hoje}
                  respostaVisivel={respostasVisiveis.has(card.uuid)}
                  processando={processandoUuid === card.uuid}
                  onAlternarResposta={() => alternarResposta(card.uuid)}
                  onAvaliar={(qualidade) => handleAvaliar(card.uuid, qualidade)}
                  onArquivar={() => void handleArquivar(card, true)}
                  onApagar={() => setCardParaApagar(card)}
                />
              ))}
            </div>
          )}
        </Section>

        <Section label="Calendário" title="Próximas revisões" count={futuras.length}>
          {carregando ? (
            <ListaSkeleton />
          ) : futuras.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nenhuma revisão futura" compact />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {futuras.map((card) => (
                <RevisaoCard
                  key={card.uuid}
                  card={card}
                  hoje={hoje}
                  respostaVisivel={respostasVisiveis.has(card.uuid)}
                  processando={processandoUuid === card.uuid}
                  onAlternarResposta={() => alternarResposta(card.uuid)}
                  onAvaliar={(qualidade) => handleAvaliar(card.uuid, qualidade)}
                  onArquivar={() => void handleArquivar(card, true)}
                  onApagar={() => setCardParaApagar(card)}
                />
              ))}
            </div>
          )}
        </Section>

        <Section label="Novo" title="Card manual">
          <Card className="p-4">
            <form onSubmit={handleCriarCard} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Pergunta">
                <Input
                  value={novoCard.pergunta}
                  onChange={(event) => setNovoCard((atual) => ({ ...atual, pergunta: event.target.value }))}
                  placeholder="O que você quer lembrar?"
                />
              </Field>
              <Field label="Resposta" optional>
                <Textarea
                  value={novoCard.resposta}
                  onChange={(event) => setNovoCard((atual) => ({ ...atual, resposta: event.target.value }))}
                  placeholder="Resposta ou observação"
                  className="min-h-9"
                />
              </Field>
              <Button type="submit" size="sm" className="sm:col-span-2 sm:justify-self-start">
                <Plus className="size-3.5" />
                Criar card
              </Button>
            </form>
          </Card>
        </Section>

        <Section label="Lote" title="Importar CSV, TSV ou Anki .apkg">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium">Importação com prévia e deduplicação</p><p className="mt-1 text-xs text-muted-foreground">CSV/TSV: 1 MB. Anki: .apkg de até 25 MB, seleção de deck e até 500 cards por importação. Mídias do pacote não são copiadas.</p>{resultadoImportacao ? <p role="status" className="mt-2 text-xs text-success">{resultadoImportacao}</p> : null}</div>
            <label className={buttonVariants({ variant: 'outline', size: 'sm', className: importando ? 'pointer-events-none opacity-60' : 'cursor-pointer' })}><FileUp className="size-3.5" />Selecionar arquivo<input type="file" accept=".csv,.tsv,.apkg,text/csv,text/tab-separated-values,application/zip" className="sr-only" onChange={(event) => void handleSelecionarImportacao(event)} disabled={importando} /></label></div>
            {decksAnki.length > 0 ? <div className="mt-4"><Field label="Deck do Anki" htmlFor="deck-anki"><Select id="deck-anki" value={deckAnki} onChange={(event) => void selecionarDeckAnki(event.target.value)}><option value="">Selecione um deck</option>{decksAnki.map((deck) => <option key={deck.id} value={deck.id}>{deck.nome} ({deck.quantidade})</option>)}</Select></Field></div> : null}
            {previewImportacao.length > 0 ? <div className="mt-4 border-t border-border pt-4"><div className="grid gap-3 sm:grid-cols-3"><Field label="Matéria" htmlFor="materia-importacao"><Select id="materia-importacao" value={materiaImportacao} onChange={(event) => { setMateriaImportacao(event.target.value); setConteudoImportacao(''); setConteudosImportacao([]) }}><option value="">Sem vínculo acadêmico</option>{materias.map((materia) => <option key={materia.uuid} value={materia.uuid}>{materia.nome}</option>)}</Select></Field><Field label="Conteúdo" htmlFor="conteudo-importacao" optional><Select id="conteudo-importacao" value={conteudoImportacao} onChange={(event) => setConteudoImportacao(event.target.value)} disabled={!materiaImportacao}><option value="">Toda a matéria</option>{conteudosImportacao.map((conteudo) => <option key={conteudo.uuid} value={conteudo.uuid}>{conteudo.nome}</option>)}</Select></Field><Field label="Módulo padrão" htmlFor="modulo-padrao" optional><Select id="modulo-padrao" value={moduloPadrao} onChange={(event) => setModuloPadrao(event.target.value)} disabled={Boolean(materiaImportacao)}><option value="manual">Manual</option><option value="estudos">Estudos</option><option value="idiomas">Idiomas</option><option value="treino">Treino</option></Select></Field></div><p className="mt-2 text-xs text-muted-foreground">Estes cards serão atribuídos à matéria e ao conteúdo escolhidos acima. O vínculo vale para todo o lote e permite filtrar a sessão.</p><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-2 pr-3">Pergunta</th><th className="pb-2 pr-3">Resposta</th><th className="pb-2">Destino</th></tr></thead><tbody>{previewImportacao.slice(0, 10).map((card, indice) => <tr key={`${card.pergunta}-${indice}`} className="border-t border-border"><td className="max-w-56 truncate py-2 pr-3">{card.pergunta}</td><td className="max-w-56 truncate py-2 pr-3">{card.resposta || '—'}</td><td className="py-2">{materias.find((materia) => materia.uuid === materiaImportacao)?.nome || card.modulo || moduloPadrao}</td></tr>)}</tbody></table></div>{previewImportacao.length > 10 ? <p className="mt-2 text-xs text-muted-foreground">Mostrando 10 de {previewImportacao.length} cards.</p> : null}<div className="mt-4 flex gap-2"><Button type="button" size="sm" disabled={importando || (decksAnki.length > 0 && !deckAnki)} onClick={() => void confirmarImportacao()}>{importando ? 'Importando...' : `Importar ${previewImportacao.length} cards`}</Button><Button type="button" size="sm" variant="outline" disabled={importando} onClick={() => { setPreviewImportacao([]); setArquivoAnki(null); setDecksAnki([]); setDeckAnki('') }}>Cancelar</Button></div></div> : null}
          </Card>
        </Section>
      </div>

      {aba === 'arquivados' ? (
        <div className="mt-10">
          <Section label="Guardados" title="Cards arquivados" count={arquivadosFiltrados.length}>
            {carregando ? (
              <ListaSkeleton />
            ) : arquivadosFiltrados.length === 0 ? (
              <EmptyState icon={Archive} title="Nenhum card arquivado" compact />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {arquivadosFiltrados.map((card) => (
                  <RevisaoCard
                    key={card.uuid}
                    card={card}
                    hoje={hoje}
                    arquivado
                    respostaVisivel={respostasVisiveis.has(card.uuid)}
                    processando={processandoUuid === card.uuid}
                    onAlternarResposta={() => alternarResposta(card.uuid)}
                    onRestaurar={() => void handleArquivar(card, false)}
                    onApagar={() => setCardParaApagar(card)}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      ) : null}

      <ConfirmDialog
        open={cardParaApagar !== null}
        title="Apagar card?"
        description={cardParaApagar?.modulo === 'estudos' && cardParaApagar.referencia_uuid
          ? `O lembrete de revisão de "${cardParaApagar.pergunta}" será removido. O conteúdo continuará existindo em Estudos.`
          : `O card "${cardParaApagar?.pergunta ?? ''}" será removido da revisão.`}
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setCardParaApagar(null)
        }}
        onConfirm={handleApagarConfirmado}
      />
    </PageShell>
  )
}

function RevisaoCard({
  card,
  hoje,
  respostaVisivel,
  processando,
  arquivado = false,
  onAlternarResposta,
  onAvaliar,
  onArquivar,
  onRestaurar,
  onApagar,
}: {
  card: CardRevisao
  hoje: string
  respostaVisivel: boolean
  processando: boolean
  arquivado?: boolean
  onAlternarResposta: () => void
  onAvaliar?: (qualidade: Qualidade) => void
  onArquivar?: () => void
  onRestaurar?: () => void
  onApagar: () => void
}) {
  const origemEstudos = card.modulo === 'estudos' && Boolean(card.referencia_uuid)
  const atrasado = card.proxima_revisao < hoje
  const temResposta = Boolean(card.resposta?.trim())

  return (
    <Card className="flex min-w-0 flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <Brain className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={origemEstudos ? 'success' : 'outline'}>
              {origemEstudos ? 'Conteúdo de Estudos' : card.modulo && card.modulo !== 'manual' ? card.modulo : 'Card manual'}
            </Badge>
            <Badge variant={atrasado ? 'warning' : 'outline'}>
              {atrasado ? 'Atrasada' : formatarData(card.proxima_revisao)}
            </Badge>
          </div>
          <h2 className="mt-2 break-words text-base font-semibold">{card.pergunta}</h2>
        </div>
        <div className="flex shrink-0 gap-1">
          {arquivado ? (
            <Button type="button" variant="ghost" size="icon-sm" disabled={processando} onClick={onRestaurar} aria-label="Restaurar card">
              <ArchiveRestore className="size-3.5" />
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="icon-sm" disabled={processando} onClick={onArquivar} aria-label="Arquivar card">
              <Archive className="size-3.5" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon-sm" onClick={onApagar} aria-label="Apagar card">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {temResposta ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={onAlternarResposta}>
            {respostaVisivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {respostaVisivel ? 'Ocultar resposta' : 'Mostrar resposta'}
          </Button>
          {respostaVisivel ? (
            <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/50 p-3 text-sm leading-relaxed">
              {card.resposta}
            </p>
          ) : null}
        </div>
      ) : null}

      {!arquivado ? <div className="mt-auto border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <MonoLabel>Como foi?</MonoLabel>
          <MonoLabel>{card.repeticoes} repetições · intervalo {card.intervalo_dias}d</MonoLabel>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RESULTADOS.map((resultado) => (
            <Button
              key={resultado.qualidade}
              type="button"
              variant="outline"
              size="sm"
              disabled={processando}
              onClick={() => onAvaliar?.(resultado.qualidade)}
            >
              {resultado.label}
            </Button>
          ))}
        </div>
      </div> : (
        <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
          Arquivado sem perder o histórico do SM-2. Restaure para voltar à fila.
        </p>
      )}
    </Card>
  )
}

function ResumoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: number
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Icon className="size-4 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <MonoLabel>{label}</MonoLabel>
      </div>
    </Card>
  )
}

function ListaSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {[0, 1].map((item) => (
        <Card key={item} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-8 w-full" />
        </Card>
      ))}
    </div>
  )
}
