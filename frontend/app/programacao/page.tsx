'use client'

import { useCallback, useEffect, useState } from 'react'
import { Code2, ExternalLink, Loader2, Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
  criarProjeto,
  deletarProjeto,
  listarProjetosProgramacao,
  Projeto,
  StatusProjeto,
} from '@/lib/projetos'

const FORMULARIO_VAZIO = {
  nome: '',
  descricao: '',
  status: 'ativo' as StatusProjeto,
  repositorio_url: '',
  linguagem_principal: '',
  destaque: false,
}

function urlRepositorioValida(valor: string) {
  if (!valor) return true
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProgramacaoPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [editando, setEditando] = useState<Projeto | null>(null)
  const [paraApagar, setParaApagar] = useState<Projeto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const atuais = await listarProjetosProgramacao()
    if (atuais === null) setErro('Não foi possível carregar os projetos de programação.')
    else setProjetos(atuais)
    setCarregando(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  function limparFormulario() {
    setEditando(null)
    setFormulario(FORMULARIO_VAZIO)
  }

  function iniciarEdicao(projeto: Projeto) {
    setEditando(projeto)
    setFormulario({
      nome: projeto.nome,
      descricao: projeto.descricao ?? '',
      status: projeto.status,
      repositorio_url: projeto.repositorio_url ?? '',
      linguagem_principal: projeto.linguagem_principal ?? '',
      destaque: projeto.destaque,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault()
    const nome = formulario.nome.trim()
    const linguagem = formulario.linguagem_principal.trim()
    const repositorio = formulario.repositorio_url.trim()
    if (!nome || (!linguagem && !repositorio)) {
      setErro('Informe o nome e pelo menos a linguagem ou o repositório.')
      return
    }
    if (!urlRepositorioValida(repositorio)) {
      setErro('O repositório precisa usar uma URL http ou https válida.')
      return
    }

    setSalvando(true)
    const input = {
      nome,
      descricao: formulario.descricao.trim() || null,
      status: formulario.status,
      data_prazo: editando?.data_prazo ?? null,
      repositorio_url: repositorio || null,
      linguagem_principal: linguagem || null,
      destaque: formulario.destaque,
    }
    const salvo = editando
      ? await atualizarProjeto(editando.uuid, input)
      : await criarProjeto(input)
    setSalvando(false)
    if (!salvo) {
      setErro('Não foi possível salvar o projeto de programação.')
      return
    }
    setErro('')
    limparFormulario()
    await carregar()
  }

  async function alternarDestaque(projeto: Projeto) {
    const atualizado = await atualizarProjeto(projeto.uuid, { destaque: !projeto.destaque })
    if (!atualizado) return setErro('Não foi possível atualizar o destaque.')
    await carregar()
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Visão especializada de Projetos</p>
          <h1 className="mt-2 text-3xl font-semibold">Programação</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Acompanhe projetos de software, linguagem principal, repositório e status sem criar um catálogo paralelo.</p>
        </header>

        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

        <Card className="mt-7 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase text-muted-foreground">{editando ? 'Edição' : 'Novo'}</p><h2 className="mt-1 font-semibold">{editando ? editando.nome : 'Projeto de programação'}</h2></div>{editando ? <Button type="button" variant="ghost" size="sm" onClick={limparFormulario}><X />Cancelar</Button> : null}</div>
          <form onSubmit={salvar} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="programacao-nome">Nome</Label><Input id="programacao-nome" value={formulario.nome} onChange={(event) => setFormulario((atual) => ({ ...atual, nome: event.target.value }))} placeholder="Ex.: Sistema Pessoal" /></div>
            <div className="space-y-2"><Label htmlFor="programacao-linguagem">Linguagem principal</Label><Input id="programacao-linguagem" value={formulario.linguagem_principal} onChange={(event) => setFormulario((atual) => ({ ...atual, linguagem_principal: event.target.value }))} placeholder="Ex.: TypeScript" /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="programacao-repositorio">Repositório ou link</Label><Input id="programacao-repositorio" type="url" value={formulario.repositorio_url} onChange={(event) => setFormulario((atual) => ({ ...atual, repositorio_url: event.target.value }))} placeholder="https://github.com/..." /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="programacao-descricao">Descrição</Label><Textarea id="programacao-descricao" rows={2} value={formulario.descricao} onChange={(event) => setFormulario((atual) => ({ ...atual, descricao: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="programacao-status">Status</Label><Select id="programacao-status" value={formulario.status} onChange={(event) => setFormulario((atual) => ({ ...atual, status: event.target.value as StatusProjeto }))}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option></Select></div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={formulario.destaque} onChange={(event) => setFormulario((atual) => ({ ...atual, destaque: event.target.checked }))} />Projeto em destaque</label>
            <Button type="submit" className="md:col-span-2 md:justify-self-start" disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : editando ? <Save /> : <Plus />}{editando ? 'Salvar projeto' : 'Adicionar projeto'}</Button>
          </form>
        </Card>

        {carregando ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : projetos.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-y border-border py-12 text-center text-muted-foreground"><Code2 className="size-8" /><p>Nenhum projeto de programação cadastrado.</p></div>
        ) : (
          <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Projetos de programação">
            {projetos.map((projeto) => (
              <Card key={projeto.uuid} className="flex min-h-48 flex-col p-4">
                <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Code2 className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="capitalize">{projeto.status}</Badge>{projeto.destaque ? <Badge variant="success"><Star className="size-3 fill-current" />Destaque</Badge> : null}</div><h2 className="mt-2 break-words font-semibold">{projeto.nome}</h2></div></div>
                {projeto.descricao ? <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{projeto.descricao}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">{projeto.linguagem_principal ? <Badge>{projeto.linguagem_principal}</Badge> : null}{projeto.repositorio_url ? <a href={projeto.repositorio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium hover:underline">Abrir repositório <ExternalLink className="size-3" /></a> : null}</div>
                <div className="mt-auto flex justify-end gap-1 border-t border-border pt-3"><Button type="button" variant="ghost" size="icon-sm" aria-label={projeto.destaque ? 'Remover destaque' : 'Destacar projeto'} onClick={() => void alternarDestaque(projeto)}><Star className={projeto.destaque ? 'fill-current' : ''} /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${projeto.nome}`} onClick={() => iniciarEdicao(projeto)}><Pencil /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Apagar ${projeto.nome}`} onClick={() => setParaApagar(projeto)}><Trash2 /></Button></div>
              </Card>
            ))}
          </section>
        )}
      </div>

      <ConfirmDialog open={paraApagar !== null} title="Apagar projeto?" description={paraApagar ? `“${paraApagar.nome}” também deixará de aparecer no módulo Projetos.` : ''} confirmLabel="Apagar" onOpenChange={(open) => { if (!open) setParaApagar(null) }} onConfirm={async () => { if (!paraApagar) return; if (await deletarProjeto(paraApagar.uuid)) { setParaApagar(null); await carregar() } else setErro('Não foi possível apagar o projeto.') }} />
    </main>
  )
}
