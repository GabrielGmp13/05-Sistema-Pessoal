'use client'

import { useEffect, useState } from 'react'
import { Image, Loader2, Save, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { getSession, sb } from '@/lib/supabase'

interface PerfilForm {
  nome: string
  subtitulo: string
  avatarUrl: string
  backgroundUrl: string
}

const FORM_VAZIO: PerfilForm = {
  nome: '',
  subtitulo: '',
  avatarUrl: '',
  backgroundUrl: '',
}

function urlValida(valor: string) {
  if (!valor.trim()) return true
  try {
    const url = new URL(valor.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<PerfilForm>(FORM_VAZIO)
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const session = await getSession()
      if (!ativo) return
      const meta = session?.user.user_metadata
      setEmail(session?.user.email ?? '')
      setForm({
        nome: meta?.full_name || meta?.name || session?.user.email?.split('@')[0] || '',
        subtitulo: meta?.subtitle || '',
        avatarUrl: meta?.avatar_url || '',
        backgroundUrl: meta?.background_url || '',
      })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [])

  function atualizar(campo: keyof PerfilForm, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault()
    setMensagem('')
    setErro('')

    if (!form.nome.trim()) {
      setErro('Informe o nome que deve aparecer no topo.')
      return
    }
    if (!urlValida(form.avatarUrl) || !urlValida(form.backgroundUrl)) {
      setErro('As imagens precisam usar uma URL iniciada por http:// ou https://.')
      return
    }

    setSalvando(true)
    const session = await getSession()
    const metadataAtual = session?.user.user_metadata ?? {}
    const { error } = await sb.auth.updateUser({
      data: {
        ...metadataAtual,
        full_name: form.nome.trim(),
        name: form.nome.trim(),
        subtitle: form.subtitulo.trim() || null,
        avatar_url: form.avatarUrl.trim() || null,
        background_url: form.backgroundUrl.trim() || null,
      },
    })
    setSalvando(false)

    if (error) {
      setErro('Não foi possível atualizar o perfil.')
      return
    }

    setMensagem('Perfil atualizado.')
    window.dispatchEvent(new Event('perfil-atualizado'))
  }

  const inicial = form.nome.trim().charAt(0).toUpperCase() || 'U'

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Conta</p>
          <h1 className="mt-2 text-3xl font-semibold">Perfil e configurações</h1>
          <p className="mt-2 text-sm text-muted-foreground">As informações abaixo aparecem no topo do sistema.</p>
        </header>

        {carregando ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Card className="p-5">
              <form onSubmit={salvar} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="perfil-nome">Nome exibido</Label>
                  <Input id="perfil-nome" value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil-subtitulo">Descrição curta</Label>
                  <Input id="perfil-subtitulo" value={form.subtitulo} onChange={(e) => atualizar('subtitulo', e.target.value)} maxLength={120} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil-avatar">URL do avatar</Label>
                  <Input id="perfil-avatar" type="url" value={form.avatarUrl} onChange={(e) => atualizar('avatarUrl', e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil-background">URL do background</Label>
                  <Input id="perfil-background" type="url" value={form.backgroundUrl} onChange={(e) => atualizar('backgroundUrl', e.target.value)} placeholder="https://" />
                </div>

                {erro ? <p role="alert" className="text-sm text-destructive">{erro}</p> : null}
                {mensagem ? <p role="status" className="text-sm text-success-foreground">{mensagem}</p> : null}

                <Button type="submit" disabled={salvando}>
                  {salvando ? <Loader2 className="animate-spin" /> : <Save />}
                  {salvando ? 'Salvando...' : 'Salvar perfil'}
                </Button>
              </form>
            </Card>

            <aside className="space-y-3">
              <div
                className="relative flex min-h-40 flex-col justify-end overflow-hidden rounded-lg border border-border bg-secondary p-4"
                style={form.backgroundUrl ? { backgroundImage: `linear-gradient(to top, var(--background), transparent), url(${form.backgroundUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-secondary font-semibold">
                    {form.avatarUrl ? <img src={form.avatarUrl} alt="Prévia do avatar" className="size-full object-cover" /> : <span>{inicial}</span>}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate">{form.nome || 'Seu nome'}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{form.subtitulo || email}</span>
                  </div>
                </div>
              </div>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Image className="mt-0.5 size-3.5 shrink-0" /> Use imagens hospedadas por URL. Campos vazios mantêm o fallback do tema.
              </p>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <UserRound className="mt-0.5 size-3.5 shrink-0" /> {email}
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
