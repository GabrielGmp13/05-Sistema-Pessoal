'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, FolderKanban, Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  atualizarProjeto,
  atualizarTarefaProjeto,
  criarProjeto,
  criarTarefaProjeto,
  deletarProjeto,
  deletarTarefaProjeto,
  listarProjetos,
  listarTarefasProjeto,
  Projeto,
  StatusProjeto,
  StatusTarefaProjeto,
  TarefaProjeto,
} from '@/lib/projetos'
import { cn } from '@/lib/utils'

const COLUNAS: Array<{ status: StatusTarefaProjeto; label: string }> = [
  { status: 'a_fazer', label: 'A fazer' },
  { status: 'fazendo', label: 'Fazendo' },
  { status: 'feito', label: 'Feito' },
]

const PROJETO_VAZIO = { nome: '', descricao: '', status: 'ativo' as StatusProjeto, data_prazo: '' }

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [tarefas, setTarefas] = useState<TarefaProjeto[]>([])
  const [selecionadoUuid, setSelecionadoUuid] = useState<string | null>(null)
  const [novoProjeto, setNovoProjeto] = useState(PROJETO_VAZIO)
  const [edicao, setEdicao] = useState(PROJETO_VAZIO)
  const [novaTarefa, setNovaTarefa] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmacao, setConfirmacao] = useState<{ title: string; description: string; action: () => Promise<void> } | null>(null)

  const selecionado = useMemo(
    () => projetos.find((projeto) => projeto.uuid === selecionadoUuid) ?? null,
    [projetos, selecionadoUuid],
  )

  const carregarProjetos = useCallback(async (preferirUuid?: string) => {
    const atuais = await listarProjetos()
    if (atuais === null) {
      setErro('Não foi possível carregar os projetos.')
      setCarregando(false)
      return
    }
    setProjetos(atuais)
    setSelecionadoUuid((atual) => {
      const candidato = preferirUuid ?? atual
      return atuais.some((item) => item.uuid === candidato) ? candidato : atuais[0]?.uuid ?? null
    })
    setCarregando(false)
  }, [])

  const carregarTarefas = useCallback(async (projetoUuid: string) => {
    const atuais = await listarTarefasProjeto(projetoUuid)
    if (atuais === null) {
      setErro('Não foi possível carregar as tarefas.')
      return
    }
    setTarefas(atuais)
  }, [])

  useEffect(() => {
    void carregarProjetos()
  }, [carregarProjetos])

  useEffect(() => {
    if (!selecionado) {
      setTarefas([])
      setEdicao(PROJETO_VAZIO)
      return
    }
    setEdicao({
      nome: selecionado.nome,
      descricao: selecionado.descricao ?? '',
      status: selecionado.status,
      data_prazo: selecionado.data_prazo ?? '',
    })
    void carregarTarefas(selecionado.uuid)
  }, [carregarTarefas, selecionado])

  async function adicionarProjeto(event: React.FormEvent) {
    event.preventDefault()
    if (!novoProjeto.nome.trim()) return
    setSalvando(true)
    const criado = await criarProjeto({
      nome: novoProjeto.nome.trim(),
      descricao: novoProjeto.descricao.trim() || null,
      status: novoProjeto.status,
      data_prazo: novoProjeto.data_prazo || null,
    })
    setSalvando(false)
    if (!criado) {
      setErro('Não foi possível criar o projeto.')
      return
    }
    setErro('')
    setNovoProjeto(PROJETO_VAZIO)
    await carregarProjetos(criado.uuid)
  }

  async function salvarProjeto() {
    if (!selecionado || !edicao.nome.trim()) return
    setSalvando(true)
    const atualizado = await atualizarProjeto(selecionado.uuid, {
      nome: edicao.nome.trim(),
      descricao: edicao.descricao.trim() || null,
      status: edicao.status,
      data_prazo: edicao.data_prazo || null,
    })
    setSalvando(false)
    if (!atualizado) {
      setErro('Não foi possível salvar o projeto.')
      return
    }
    setErro('')
    await carregarProjetos(atualizado.uuid)
  }

  async function adicionarTarefa(event: React.FormEvent) {
    event.preventDefault()
    if (!selecionado || !novaTarefa.trim()) return
    const criada = await criarTarefaProjeto(selecionado.uuid, novaTarefa.trim(), tarefas.length)
    if (!criada) {
      setErro('Não foi possível criar a tarefa.')
      return
    }
    setNovaTarefa('')
    setErro('')
    await carregarTarefas(selecionado.uuid)
  }

  async function moverTarefa(tarefa: TarefaProjeto, direcao: -1 | 1) {
    const indice = COLUNAS.findIndex((coluna) => coluna.status === tarefa.status)
    const proxima = COLUNAS[indice + direcao]
    if (!proxima) return
    const atualizada = await atualizarTarefaProjeto(tarefa.uuid, { status: proxima.status })
    if (!atualizada) {
      setErro('Não foi possível mover a tarefa.')
      return
    }
    setTarefas((atuais) => atuais.map((item) => item.uuid === atualizada.uuid ? atualizada : item))
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <h1 className="text-3xl font-semibold">Projetos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe iniciativas e mova tarefas entre etapas simples.</p>
        </header>

        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

        <Card className="mt-7 p-4">
          <form onSubmit={adicionarProjeto} className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,2fr)_10rem_auto] md:items-end">
            <div className="space-y-2"><Label htmlFor="novo-projeto">Novo projeto</Label><Input id="novo-projeto" value={novoProjeto.nome} onChange={(e) => setNovoProjeto((atual) => ({ ...atual, nome: e.target.value }))} placeholder="Nome" /></div>
            <div className="space-y-2"><Label htmlFor="nova-descricao">Descrição</Label><Input id="nova-descricao" value={novoProjeto.descricao} onChange={(e) => setNovoProjeto((atual) => ({ ...atual, descricao: e.target.value }))} placeholder="Opcional" /></div>
            <div className="space-y-2"><Label htmlFor="novo-prazo">Prazo</Label><Input id="novo-prazo" type="date" value={novoProjeto.data_prazo} onChange={(e) => setNovoProjeto((atual) => ({ ...atual, data_prazo: e.target.value }))} /></div>
            <Button type="submit" disabled={salvando}><Plus />Adicionar</Button>
          </form>
        </Card>

        {carregando ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[16rem_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
        ) : projetos.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-y border-border py-12 text-center text-muted-foreground"><FolderKanban className="size-8" /><p>Nenhum projeto criado.</p></div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="border-r-0 border-border lg:border-r lg:pr-5">
              <p className="mb-2 font-mono text-xs uppercase text-muted-foreground">Seus projetos</p>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
                {projetos.map((projeto) => (
                  <button key={projeto.uuid} type="button" onClick={() => setSelecionadoUuid(projeto.uuid)} className={cn('min-w-48 rounded-lg px-3 py-3 text-left outline-none transition-colors lg:min-w-0', selecionadoUuid === projeto.uuid ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')}>
                    <strong className="block truncate text-sm">{projeto.nome}</strong>
                    <span className="mt-1 block text-xs capitalize text-muted-foreground">{projeto.status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </aside>

            {selecionado ? (
              <section className="min-w-0">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] md:items-end">
                  <div className="space-y-2"><Label htmlFor="projeto-nome">Nome</Label><Input id="projeto-nome" value={edicao.nome} onChange={(e) => setEdicao((atual) => ({ ...atual, nome: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="projeto-status">Status</Label><Select id="projeto-status" value={edicao.status} onChange={(e) => setEdicao((atual) => ({ ...atual, status: e.target.value as StatusProjeto }))}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option></Select></div>
                  <div className="space-y-2"><Label htmlFor="projeto-prazo">Prazo</Label><Input id="projeto-prazo" type="date" value={edicao.data_prazo} onChange={(e) => setEdicao((atual) => ({ ...atual, data_prazo: e.target.value }))} /></div>
                  <div className="flex gap-2"><Button type="button" onClick={salvarProjeto} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />}Salvar</Button><Button type="button" variant="ghost" size="icon" aria-label="Apagar projeto" onClick={() => setConfirmacao({ title: 'Apagar projeto?', description: `O projeto “${selecionado.nome}” deixará de aparecer.`, action: async () => { if (await deletarProjeto(selecionado.uuid)) await carregarProjetos() } })}><Trash2 /></Button></div>
                </div>
                <div className="mt-3"><Textarea value={edicao.descricao} onChange={(e) => setEdicao((atual) => ({ ...atual, descricao: e.target.value }))} placeholder="Descrição do projeto" rows={2} /></div>

                <form onSubmit={adicionarTarefa} className="mt-7 flex gap-2"><Input value={novaTarefa} onChange={(e) => setNovaTarefa(e.target.value)} placeholder="Nova tarefa" /><Button type="submit"><Plus />Tarefa</Button></form>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {COLUNAS.map((coluna, colunaIndice) => {
                    const itens = tarefas.filter((tarefa) => tarefa.status === coluna.status)
                    return (
                      <div key={coluna.status} className="min-w-0 rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{coluna.label}</h2><span className="font-mono text-xs text-muted-foreground">{itens.length}</span></div>
                        <div className="mt-3 space-y-2">
                          {itens.length === 0 ? <p className="py-5 text-center text-xs text-muted-foreground">Sem tarefas.</p> : itens.map((tarefa) => (
                            <Card key={tarefa.uuid} className="p-3">
                              <p className={cn('break-words text-sm', tarefa.status === 'feito' && 'text-muted-foreground line-through')}>{tarefa.titulo}</p>
                              <div className="mt-3 flex justify-end gap-1">
                                <Button type="button" variant="ghost" size="icon-xs" aria-label="Mover para etapa anterior" disabled={colunaIndice === 0} onClick={() => void moverTarefa(tarefa, -1)}><ArrowLeft /></Button>
                                <Button type="button" variant="ghost" size="icon-xs" aria-label="Mover para próxima etapa" disabled={colunaIndice === COLUNAS.length - 1} onClick={() => void moverTarefa(tarefa, 1)}><ArrowRight /></Button>
                                <Button type="button" variant="ghost" size="icon-xs" aria-label="Apagar tarefa" onClick={() => setConfirmacao({ title: 'Apagar tarefa?', description: `A tarefa “${tarefa.titulo}” será removida.`, action: async () => { if (await deletarTarefaProjeto(tarefa.uuid)) await carregarTarefas(selecionado.uuid) } })}><Trash2 /></Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
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
