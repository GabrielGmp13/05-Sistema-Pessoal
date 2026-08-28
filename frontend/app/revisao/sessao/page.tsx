'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ChevronLeft, RotateCcw, ThumbsUp } from 'lucide-react'

import { PageShell } from '@/components/study/page-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { dataLocalIso } from '@/lib/date'
import { avaliarCard, CardRevisao, listarCardsRevisao, Qualidade } from '@/lib/revisao'

const AVALIACOES: Array<{ label: string; qualidade: Qualidade }> = [
  { label: 'Difícil', qualidade: 3 },
  { label: 'Bom', qualidade: 4 },
  { label: 'Fácil', qualidade: 5 },
]

export default function SessaoRevisaoPage() {
  const [cards, setCards] = useState<CardRevisao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [respostaVisivel, setRespostaVisivel] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [deslocamento, setDeslocamento] = useState(0)
  const inicioArraste = useRef<number | null>(null)

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search)
    const materia = parametros.get('materia') || null
    const conteudo = parametros.get('conteudo') || null
    void listarCardsRevisao().then((itens) => {
      const hoje = dataLocalIso()
      setCards((itens ?? []).filter((card) => (
        card.proxima_revisao <= hoje
        && (!materia || card.materia_uuid === materia)
        && (!conteudo || card.conteudo_uuid === conteudo)
      )))
      setCarregando(false)
    })
  }, [])

  const atual = cards[0] ?? null
  const progresso = useMemo(() => cards.length, [cards.length])

  const avaliar = useCallback(async (qualidade: Qualidade) => {
    if (!atual || processando) return
    setProcessando(true)
    const resultado = await avaliarCard(atual.uuid, qualidade)
    if (!resultado) {
      setErro('Não foi possível salvar esta revisão.')
      setProcessando(false)
      return
    }
    setCards((itens) => itens.slice(1))
    setRespostaVisivel(false)
    setDeslocamento(0)
    setErro('')
    setProcessando(false)
  }, [atual, processando])

  function encerrarArraste(clientX: number) {
    if (inicioArraste.current === null) return
    const distancia = clientX - inicioArraste.current
    inicioArraste.current = null
    if (distancia <= -90) {
      void avaliar(1)
    } else if (distancia >= 90) {
      setRespostaVisivel(true)
      setDeslocamento(0)
    } else {
      setDeslocamento(0)
    }
  }

  return (
    <PageShell className="min-h-[calc(100vh-5rem)]">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col">
        <div className="flex items-center justify-between gap-3">
          <a href="/revisao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> Sair da sessão
          </a>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {carregando ? 'Carregando' : `${progresso} restante${progresso === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8">
          {erro ? <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p> : null}
          {carregando ? (
            <Card className="h-80 w-full animate-pulse bg-muted/50" />
          ) : !atual ? (
            <Card className="flex w-full flex-col items-center gap-4 p-10 text-center">
              <ThumbsUp className="size-9 text-primary" />
              <div><h1 className="text-xl font-semibold">Sessão concluída</h1><p className="mt-1 text-sm text-muted-foreground">Não há mais cards vencidos para este filtro.</p></div>
              <a href="/revisao" className="text-sm font-medium underline underline-offset-4">Voltar à Revisão</a>
            </Card>
          ) : (
            <div className="w-full select-none touch-pan-y">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => setRespostaVisivel(true)}
                onPointerDown={(event) => { inicioArraste.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId) }}
                onPointerMove={(event) => {
                  if (inicioArraste.current !== null) setDeslocamento(Math.max(-130, Math.min(130, event.clientX - inicioArraste.current)))
                }}
                onPointerUp={(event) => encerrarArraste(event.clientX)}
                onPointerCancel={() => { inicioArraste.current = null; setDeslocamento(0) }}
                aria-label={respostaVisivel ? 'Resposta exibida' : 'Mostrar resposta'}
              >
                <Card
                  className="flex min-h-80 flex-col items-center justify-center overflow-hidden p-8 text-center shadow-xl transition-transform duration-150"
                  style={{ transform: `translateX(${deslocamento}px) rotate(${deslocamento / 28}deg)` }}
                >
                  <Brain className="mb-5 size-7 text-primary" />
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Pergunta</p>
                  <h1 className="mt-3 text-balance text-2xl font-semibold leading-snug">{atual.pergunta}</h1>
                  {respostaVisivel ? (
                    <div className="mt-8 w-full border-t border-border pt-7">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Resposta</p>
                      <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{atual.resposta || 'Sem resposta cadastrada.'}</p>
                    </div>
                  ) : <p className="mt-8 text-sm text-muted-foreground">Toque no card ou deslize para a direita para revelar.</p>}
                </Card>
              </button>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
                <Button type="button" variant="destructive" disabled={processando} onClick={() => void avaliar(1)}>
                  <RotateCcw className="size-4" /> Errei
                </Button>
                {AVALIACOES.map((item) => (
                  <Button key={item.qualidade} type="button" variant="outline" disabled={processando || !respostaVisivel} onClick={() => void avaliar(item.qualidade)}>
                    {item.label}
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">Deslize para a esquerda para “Errei”. Revele a resposta antes das demais avaliações.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
