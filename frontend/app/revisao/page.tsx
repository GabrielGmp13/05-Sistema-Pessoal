'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react'

import { BackLink, PageHeader, PageShell } from '@/components/study/page-shell'
import { EmptyState } from '@/components/study/empty-state'
import { Field } from '@/components/study/field'
import { MonoLabel } from '@/components/study/mono-label'
import { Section } from '@/components/study/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { dataLocalIso } from '@/lib/date'
import {
  avaliarCard,
  CardRevisao,
  criarCardManual,
  deletarCardRevisao,
  listarCardsRevisao,
  Qualidade,
} from '@/lib/revisao'

const RESULTADOS: { label: string; qualidade: Qualidade }[] = [
  { label: 'Errei', qualidade: 1 },
  { label: 'Difícil', qualidade: 3 },
  { label: 'Bom', qualidade: 4 },
  { label: 'Fácil', qualidade: 5 },
]

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RevisaoPage() {
  const [cards, setCards] = useState<CardRevisao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processandoUuid, setProcessandoUuid] = useState<string | null>(null)
  const [respostasVisiveis, setRespostasVisiveis] = useState<Set<string>>(new Set())
  const [cardParaApagar, setCardParaApagar] = useState<CardRevisao | null>(null)
  const [erro, setErro] = useState('')
  const [novoCard, setNovoCard] = useState({ pergunta: '', resposta: '' })

  const carregar = useCallback(async () => {
    const atuais = await listarCardsRevisao()
    if (atuais === null) {
      setErro('Não foi possível carregar as revisões.')
    } else {
      setCards(atuais)
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

  const hoje = dataLocalIso()
  const { pendentes, futuras, atrasadas, paraHoje } = useMemo(() => {
    const atrasados = cards.filter((card) => card.proxima_revisao < hoje)
    const hojeCards = cards.filter((card) => card.proxima_revisao === hoje)
    return {
      pendentes: [...atrasados, ...hojeCards],
      futuras: cards.filter((card) => card.proxima_revisao > hoje),
      atrasadas: atrasados.length,
      paraHoje: hojeCards.length,
    }
  }, [cards, hoje])

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
        eyebrow="Módulo"
        title="Revisão Espaçada"
        description="Revise o que está pendente e registre o resultado para calcular o próximo intervalo."
      />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResumoCard icon={Clock3} label="Atrasadas" value={atrasadas} />
        <ResumoCard icon={CheckCircle2} label="Para hoje" value={paraHoje} />
        <ResumoCard icon={CalendarClock} label="Futuras" value={futuras.length} />
      </div>

      {erro ? (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-10">
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
      </div>

      <ConfirmDialog
        open={cardParaApagar !== null}
        title="Apagar card?"
        description={cardParaApagar?.modulo === 'estudos'
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
  onAlternarResposta,
  onAvaliar,
  onApagar,
}: {
  card: CardRevisao
  hoje: string
  respostaVisivel: boolean
  processando: boolean
  onAlternarResposta: () => void
  onAvaliar: (qualidade: Qualidade) => void
  onApagar: () => void
}) {
  const origemEstudos = card.modulo === 'estudos'
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
              {origemEstudos ? 'Conteúdo de Estudos' : 'Card manual'}
            </Badge>
            <Badge variant={atrasado ? 'warning' : 'outline'}>
              {atrasado ? 'Atrasada' : formatarData(card.proxima_revisao)}
            </Badge>
          </div>
          <h2 className="mt-2 break-words text-base font-semibold">{card.pergunta}</h2>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onApagar} aria-label="Apagar card">
          <Trash2 className="size-3.5" />
        </Button>
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

      <div className="mt-auto border-t border-border pt-3">
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
              onClick={() => onAvaliar(resultado.qualidade)}
            >
              {resultado.label}
            </Button>
          ))}
        </div>
      </div>
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
