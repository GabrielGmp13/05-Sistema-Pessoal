'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'

import { EmptyState } from '@/components/study/empty-state'
import { Section } from '@/components/study/section'
import { TopicoCard } from '@/components/study/topico-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  criarTopicoEstudo,
  listarTopicosPorMateria,
  type EscopoEstudo,
  type TopicoComDados,
} from '@/lib/topicos-estudo'

export function TopicosMateria({ materiaUuid, escopo }: { materiaUuid: string; escopo: EscopoEstudo }) {
  const [topicos, setTopicos] = useState<TopicoComDados[]>([])
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const resultado = await listarTopicosPorMateria(materiaUuid, escopo)
    if (resultado === null) {
      setErro('Não foi possível carregar os tópicos. Recarregue a página.')
      return
    }
    setTopicos(resultado)
    setErro('')
  }, [escopo, materiaUuid])

  useEffect(() => {
    let ativo = true
    async function carregarInicial() {
      const resultado = await listarTopicosPorMateria(materiaUuid, escopo)
      if (!ativo) return
      if (resultado === null) {
        setErro('Não foi possível carregar os tópicos. Recarregue a página.')
      } else {
        setTopicos(resultado)
        setErro('')
      }
      setCarregando(false)
    }
    void carregarInicial()
    return () => { ativo = false }
  }, [escopo, materiaUuid])

  async function criar(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim() || salvando) return
    setSalvando(true)
    const criado = await criarTopicoEstudo({ materiaUuid, nome, escopo })
    if (criado) {
      setNome('')
      await carregar()
    } else {
      setErro('O tópico não foi salvo. Confira o estado antes de tentar novamente.')
    }
    setSalvando(false)
  }

  const inferidos = topicos.filter((topico) => topico.vinculo.escopo_origem === 'inferido_materia').length
  return (
    <Section title="Tópicos principais" count={topicos.length}>
      {inferidos > 0 ? (
        <div className="flex gap-2 rounded-lg border border-warning/35 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p><strong>{inferidos} {inferidos === 1 ? 'tópico teve' : 'tópicos tiveram'} o escopo herdado da matéria.</strong> Relações marcadas como ambíguas precisam de confirmação; nenhum escopo foi tratado como certeza histórica.</p>
        </div>
      ) : null}
      {erro ? <div role="alert" className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">{erro}</div> : null}
      {carregando ? (
        <div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
      ) : topicos.length === 0 ? (
        <EmptyState title="Nenhum tópico principal neste contexto" compact />
      ) : (
        <div className="space-y-3">{topicos.map((topico) => <TopicoCard key={topico.uuid} topico={topico} materiaUuid={materiaUuid} />)}</div>
      )}
      <Card className="p-3">
        <form onSubmit={criar} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input value={nome} onChange={(event) => setNome(event.target.value)} maxLength={200} placeholder="Nome do tópico principal (ex: Funções)" />
          <Button type="submit" disabled={salvando || !nome.trim()}><Plus />{salvando ? 'Salvando...' : 'Adicionar tópico'}</Button>
        </form>
      </Card>
    </Section>
  )
}
