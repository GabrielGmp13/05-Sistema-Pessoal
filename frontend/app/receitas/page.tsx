'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, Loader2, Plus, Save, Star, Trash2, Utensils } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { PrivateMediaField } from '@/components/PrivateMediaField'
import { apagarMidiaPessoal, persistirComMidia, urlMidiaPessoal } from '@/lib/midias-pessoais'
import { atualizarReceita, criarReceita, deletarReceita, listarReceitas, Receita, ReceitaInput } from '@/lib/receitas'
import { cn } from '@/lib/utils'

interface ReceitaForm {
  titulo: string
  ingredientes: string
  modo_preparo: string
  tempo_preparo_minutos: string
  porcoes: string
  categoria: string
  nota: string
  favorito: boolean
  fez: boolean
  foto_url: string
}

const FORM_VAZIO: ReceitaForm = {
  titulo: '', ingredientes: '', modo_preparo: '', tempo_preparo_minutos: '', porcoes: '', categoria: '', nota: '', favorito: false, fez: false, foto_url: '',
}

function paraForm(receita: Receita): ReceitaForm {
  return {
    titulo: receita.titulo,
    ingredientes: receita.ingredientes,
    modo_preparo: receita.modo_preparo,
    tempo_preparo_minutos: receita.tempo_preparo_minutos?.toString() ?? '',
    porcoes: receita.porcoes?.toString() ?? '',
    categoria: receita.categoria ?? '',
    nota: receita.nota?.toString() ?? '',
    favorito: receita.favorito,
    fez: receita.fez,
    foto_url: receita.foto_url ?? '',
  }
}

function paraInput(form: ReceitaForm, fotoPath: string | null): ReceitaInput | null {
  const tempo = form.tempo_preparo_minutos ? Number(form.tempo_preparo_minutos) : null
  const porcoes = form.porcoes ? Number(form.porcoes) : null
  const nota = form.nota ? Number(form.nota) : null
  if (!form.titulo.trim() || !form.ingredientes.trim() || !form.modo_preparo.trim()) return null
  if (tempo !== null && (!Number.isInteger(tempo) || tempo <= 0)) return null
  if (porcoes !== null && (!Number.isInteger(porcoes) || porcoes <= 0)) return null
  if (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 10)) return null
  return {
    titulo: form.titulo.trim(),
    ingredientes: form.ingredientes.trim(),
    modo_preparo: form.modo_preparo.trim(),
    tempo_preparo_minutos: tempo,
    porcoes,
    categoria: form.categoria.trim() || null,
    nota,
    favorito: form.favorito,
    fez: form.fez,
    foto_url: form.foto_url.trim() || null,
    foto_path: fotoPath,
  }
}

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [selecionadaUuid, setSelecionadaUuid] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<ReceitaForm>(FORM_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null)
  const [removerFoto, setRemoverFoto] = useState(false)
  const [urlsPrivadas, setUrlsPrivadas] = useState<Record<string, string>>({})

  const selecionada = useMemo(() => receitas.find((receita) => receita.uuid === selecionadaUuid) ?? null, [receitas, selecionadaUuid])

  const carregar = useCallback(async (preferirUuid?: string) => {
    const atuais = await listarReceitas()
    if (atuais === null) {
      setErro('Não foi possível carregar as receitas.')
      setCarregando(false)
      return
    }
    setReceitas(atuais)
    const assinadas = await Promise.all(atuais.filter((item) => item.foto_path).map(async (item) => [item.uuid, await urlMidiaPessoal(item.foto_path!)] as const))
    setUrlsPrivadas(Object.fromEntries(assinadas.filter((item): item is readonly [string, string] => Boolean(item[1]))))
    setSelecionadaUuid((atual) => {
      const candidato = preferirUuid ?? atual
      return atuais.some((item) => item.uuid === candidato) ? candidato : atuais[0]?.uuid ?? null
    })
    setCarregando(false)
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  useEffect(() => {
    if (criando) return
    setForm(selecionada ? paraForm(selecionada) : FORM_VAZIO)
    setArquivoFoto(null)
    setRemoverFoto(false)
  }, [criando, selecionada])

  function atualizar<K extends keyof ReceitaForm>(campo: K, valor: ReceitaForm[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function novaReceita() {
    setCriando(true)
    setSelecionadaUuid(null)
    setForm(FORM_VAZIO)
    setArquivoFoto(null)
    setRemoverFoto(false)
    setErro('')
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault()
    const fotoPathAtual = removerFoto ? null : selecionada?.foto_path ?? null
    const input = paraInput(form, fotoPathAtual)
    if (!input) {
      setErro('Preencha título, ingredientes e preparo; revise também os campos numéricos.')
      return
    }
    setSalvando(true)
    const { result: salva, error: erroMidia } = await persistirComMidia({
      scope: 'receitas',
      file: arquivoFoto,
      currentPath: fotoPathAtual,
      persist: (fotoPath) => criando || !selecionada
        ? criarReceita({ ...input, foto_path: fotoPath })
        : atualizarReceita(selecionada.uuid, { ...input, foto_path: fotoPath }),
    })
    setSalvando(false)
    if (!salva) {
      setErro(erroMidia || 'Não foi possível salvar a receita.')
      return
    }
    if (removerFoto && selecionada?.foto_path) await apagarMidiaPessoal(selecionada.foto_path)
    setErro('')
    setCriando(false)
    await carregar(salva.uuid)
  }

  async function alternar(campo: 'favorito' | 'fez') {
    if (!selecionada) return
    const atualizada = await atualizarReceita(selecionada.uuid, { [campo]: !selecionada[campo] })
    if (!atualizada) {
      setErro('Não foi possível atualizar a receita.')
      return
    }
    await carregar(atualizada.uuid)
  }

  async function excluir() {
    if (!selecionada) return
    if (await deletarReceita(selecionada.uuid)) {
      if (selecionada.foto_path) await apagarMidiaPessoal(selecionada.foto_path)
      setConfirmarExclusao(false)
      await carregar()
    } else {
      setErro('Não foi possível apagar a receita.')
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-semibold">Receitas</h1><p className="mt-2 text-sm text-muted-foreground">Guarde preparos, favoritos e o que você já fez.</p></div>
          <Button type="button" onClick={novaReceita}><Plus />Nova receita</Button>
        </header>

        {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p> : null}

        {carregando ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[20rem_1fr]"><Skeleton className="h-[32rem]" /><Skeleton className="h-[32rem]" /></div>
        ) : receitas.length === 0 && !criando ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-y border-border py-14 text-center text-muted-foreground"><Utensils className="size-8" /><p>Nenhuma receita cadastrada.</p><Button type="button" variant="outline" onClick={novaReceita}><Plus />Adicionar receita</Button></div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="grid auto-rows-max grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {receitas.map((receita) => (
                <button key={receita.uuid} type="button" onClick={() => { setCriando(false); setSelecionadaUuid(receita.uuid) }} className={cn('overflow-hidden rounded-lg border text-left outline-none transition-all hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/30', selecionadaUuid === receita.uuid && !criando ? 'border-foreground/30 bg-accent' : 'border-border bg-card')}>
                  {urlsPrivadas[receita.uuid] || receita.foto_url ? <img src={urlsPrivadas[receita.uuid] || receita.foto_url || ''} alt="" className="h-24 w-full object-cover" /> : null}
                  <div className="p-3"><div className="flex items-start gap-2"><strong className="min-w-0 flex-1 truncate text-sm">{receita.titulo}</strong>{receita.favorito ? <Star className="size-4 fill-current text-warning" /> : null}</div><div className="mt-2 flex flex-wrap gap-2">{receita.categoria ? <Badge variant="outline">{receita.categoria}</Badge> : null}{receita.fez ? <Badge variant="success">Feita</Badge> : null}{receita.nota !== null ? <Badge variant="outline">{receita.nota}/10</Badge> : null}</div></div>
                </button>
              ))}
            </aside>

            {(selecionada || criando) ? (
              <section className="min-w-0">
                {!criando && selecionada ? (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Button type="button" variant={selecionada.favorito ? 'secondary' : 'outline'} onClick={() => void alternar('favorito')}><Star className={selecionada.favorito ? 'fill-current' : ''} />{selecionada.favorito ? 'Favorita' : 'Favoritar'}</Button>
                    <Button type="button" variant={selecionada.fez ? 'secondary' : 'outline'} onClick={() => void alternar('fez')}><Check />{selecionada.fez ? 'Já fiz' : 'Marcar como feita'}</Button>
                    <Button type="button" variant="ghost" className="ml-auto" onClick={() => setConfirmarExclusao(true)}><Trash2 />Apagar</Button>
                  </div>
                ) : null}

                <Card className="p-5">
                  <form onSubmit={salvar} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)]">
                      <div className="space-y-2"><Label htmlFor="receita-titulo">Título</Label><Input id="receita-titulo" value={form.titulo} onChange={(e) => atualizar('titulo', e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="receita-categoria">Categoria</Label><Input id="receita-categoria" value={form.categoria} onChange={(e) => atualizar('categoria', e.target.value)} placeholder="Ex: Almoço" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="receita-foto">URL da foto</Label><Input id="receita-foto" type="url" value={form.foto_url} onChange={(e) => atualizar('foto_url', e.target.value)} placeholder="https://" /></div>
                    <div className="rounded-lg border border-border p-3"><PrivateMediaField file={arquivoFoto} onChange={(file) => { setArquivoFoto(file); if (file) setRemoverFoto(false) }} label="Foto privada" />{selecionada?.foto_path && !arquivoFoto ? <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={removerFoto} onChange={(event) => setRemoverFoto(event.target.checked)} />Remover foto privada ao salvar</label> : null}</div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2"><Label htmlFor="receita-tempo">Tempo (min)</Label><Input id="receita-tempo" type="number" min="1" step="1" value={form.tempo_preparo_minutos} onChange={(e) => atualizar('tempo_preparo_minutos', e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="receita-porcoes">Porções</Label><Input id="receita-porcoes" type="number" min="1" step="1" value={form.porcoes} onChange={(e) => atualizar('porcoes', e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="receita-nota">Nota (0–10)</Label><Input id="receita-nota" type="number" min="0" max="10" step="0.1" value={form.nota} onChange={(e) => atualizar('nota', e.target.value)} /></div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="receita-ingredientes">Ingredientes</Label><Textarea id="receita-ingredientes" value={form.ingredientes} onChange={(e) => atualizar('ingredientes', e.target.value)} rows={10} placeholder="Um ingrediente por linha" /></div>
                      <div className="space-y-2"><Label htmlFor="receita-preparo">Modo de preparo</Label><Textarea id="receita-preparo" value={form.modo_preparo} onChange={(e) => atualizar('modo_preparo', e.target.value)} rows={10} placeholder="Descreva as etapas" /></div>
                    </div>
                    {form.tempo_preparo_minutos ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Preparo estimado em {form.tempo_preparo_minutos} minutos.</p> : null}
                    <div className="flex justify-end"><Button type="submit" disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />}{salvando ? 'Salvando...' : criando ? 'Criar receita' : 'Salvar alterações'}</Button></div>
                  </form>
                </Card>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmarExclusao} title="Apagar receita?" description={`A receita “${selecionada?.titulo ?? ''}” deixará de aparecer no acervo.`} confirmLabel="Apagar" onOpenChange={setConfirmarExclusao} onConfirm={excluir} />
    </main>
  )
}
