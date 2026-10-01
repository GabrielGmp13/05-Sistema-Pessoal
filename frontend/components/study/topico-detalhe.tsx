'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookCheck, Brain, Save } from 'lucide-react'

import { GraficoDonut } from '@/components/study/grafico-donut'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { atualizarConteudo } from '@/lib/conteudos'
import { avaliarCardPorConteudo } from '@/lib/revisao'
import {
  atualizarEscopoTopico,
  buscarTopicoComDados,
  type TopicoComDados,
} from '@/lib/topicos-estudo'

const AVALIACOES = [
  { label: 'Falhou', qualidade: 1 },
  { label: 'Difícil', qualidade: 3 },
  { label: 'Bom', qualidade: 4 },
  { label: 'Fácil', qualidade: 5 },
] as const

export function TopicoDetalhe({ materiaUuid, topicoUuid }: { materiaUuid: string; topicoUuid: string }) {
  const router = useRouter()
  const [topico, setTopico] = useState<TopicoComDados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState<string | null>(null)
  const [mostraEscola, setMostraEscola] = useState(false)
  const [mostraEnem, setMostraEnem] = useState(false)

  const carregar = useCallback(async () => {
    const resultado = await buscarTopicoComDados(materiaUuid, topicoUuid)
    if (!resultado) { setErro('Não foi possível carregar este tópico.'); return }
    setTopico(resultado)
    setMostraEscola(resultado.vinculo.mostra_escola)
    setMostraEnem(resultado.vinculo.mostra_enem)
    setErro('')
  }, [materiaUuid, topicoUuid])

  useEffect(() => {
    let ativo = true
    async function carregarInicial() {
      const resultado = await buscarTopicoComDados(materiaUuid, topicoUuid)
      if (!ativo) return
      if (!resultado) {
        setErro('Não foi possível carregar este tópico.')
      } else {
        setTopico(resultado)
        setMostraEscola(resultado.vinculo.mostra_escola)
        setMostraEnem(resultado.vinculo.mostra_enem)
        setErro('')
      }
      setCarregando(false)
    }
    void carregarInicial()
    return () => { ativo = false }
  }, [materiaUuid, topicoUuid])

  async function alternarTeoria(uuid: string, atual: boolean) {
    setSalvando(uuid)
    const salvo = await atualizarConteudo(uuid, { teoria_vista: !atual })
    if (salvo) await carregar()
    else setErro('A alteração não foi confirmada. Recarregue antes de tentar novamente.')
    setSalvando(null)
  }

  async function avaliar(uuid: string, qualidade: number) {
    setSalvando(uuid)
    const salvo = await avaliarCardPorConteudo(uuid, qualidade)
    if (salvo) await carregar()
    else setErro('A revisão não foi confirmada. Recarregue antes de tentar novamente.')
    setSalvando(null)
  }

  async function salvarEscopo() {
    if (!topico || (!mostraEscola && !mostraEnem)) return
    setSalvando('escopo')
    const salvo = await atualizarEscopoTopico(topico.vinculo.uuid, mostraEscola, mostraEnem)
    if (salvo) await carregar()
    else setErro('O escopo não foi confirmado.')
    setSalvando(null)
  }

  const titulo = topico?.nome ?? 'Tópico'
  return (
    <Dialog open onOpenChange={(aberto) => { if (!aberto) router.back() }} title={titulo} description="Tópico principal e seus subtópicos">
      <div className="mt-5 space-y-5">
        {erro ? <div role="alert" className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">{erro}</div> : null}
        {carregando ? <><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></> : topico ? (
          <>
            <section aria-labelledby="subtopicos-titulo">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h3 id="subtopicos-titulo" className="font-semibold">Subtópicos</h3><p className="text-sm text-muted-foreground">O progresso do tópico é agregado pela teoria vista destes itens.</p></div>
                <span className="text-sm font-medium">{topico.metricas.progresso ?? 0}%</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                {topico.subtopicos.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Nenhum subtópico cadastrado.</p> : topico.subtopicos.map((subtopico) => {
                  const metricas = topico.metricasSubtopicos[subtopico.uuid]
                  const card = topico.cardsRevisao.find((item) => item.conteudo_uuid === subtopico.uuid)
                  return (
                    <article key={subtopico.uuid} className="border-b border-border p-4 last:border-b-0">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div><h4 className="font-medium">{subtopico.nome}</h4><p className="mt-1 text-xs text-muted-foreground">{card ? `Próxima revisão: ${new Date(`${card.proxima_revisao}T00:00:00`).toLocaleDateString('pt-BR')} · sequência ${card.repeticoes}` : 'Sem revisão agendada'}</p></div>
                        <Button type="button" size="sm" variant={subtopico.teoria_vista ? 'secondary' : 'outline'} disabled={salvando === subtopico.uuid} onClick={() => void alternarTeoria(subtopico.uuid, subtopico.teoria_vista)}>
                          <BookCheck />{subtopico.teoria_vista ? 'Teoria vista' : 'Marcar teoria vista'}
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <GraficoDonut label="Revisão" dados={metricas.revisao} />
                        <GraficoDonut label="Provas" dados={metricas.prova} />
                        <GraficoDonut label="Simulados" dados={metricas.simulado} />
                        <GraficoDonut label="Geral" dados={metricas.geral} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                        <Link href={`/revisao?materia=${materiaUuid}&conteudo=${subtopico.uuid}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}><Brain />Abrir revisão</Link>
                        <span className="ml-auto text-xs text-muted-foreground">Registrar recordação:</span>
                        {AVALIACOES.map((item) => <Button key={item.qualidade} type="button" size="xs" variant="outline" disabled={salvando === subtopico.uuid} onClick={() => void avaliar(subtopico.uuid, item.qualidade)}>{item.label}</Button>)}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section aria-labelledby="escopo-titulo" className="rounded-lg border border-border p-4">
              <h3 id="escopo-titulo" className="font-semibold">Escopo do tópico</h3>
              <p className="mt-1 text-sm text-muted-foreground">Confirme onde este tópico deve aparecer. A confirmação substitui a inferência feita na migração.</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostraEnem} onChange={(event) => setMostraEnem(event.target.checked)} />ENEM</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mostraEscola} onChange={(event) => setMostraEscola(event.target.checked)} />Escola</label>
                <Button type="button" size="sm" className="ml-auto" disabled={salvando === 'escopo' || (!mostraEnem && !mostraEscola)} onClick={() => void salvarEscopo()}><Save />Confirmar escopo</Button>
              </div>
              {!mostraEnem && !mostraEscola ? <p role="alert" className="mt-2 text-xs text-destructive">Selecione ao menos um escopo.</p> : null}
            </section>
          </>
        ) : null}
      </div>
    </Dialog>
  )
}
