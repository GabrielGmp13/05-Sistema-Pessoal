'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PrivateMediaField } from '@/components/PrivateMediaField'
import { deletarLugar, linkMapa, listarLugares, Lugar, salvarLugar } from '@/lib/lugares'
import { apagarMidiaPessoal, persistirComMidia, urlMidiaPessoal } from '@/lib/midias-pessoais'

const FORM_VAZIO = {
  nome: '', tipo: '', cidade: '', pais: '', latitude: '', longitude: '', data_inicio: '',
  data_fim: '', custo: '', nota: '', favorito: false, texto: '', capa_url: '',
}

export default function LugaresPage() {
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [selecionado, setSelecionado] = useState<Lugar | null>(null)
  const [editando, setEditando] = useState<Lugar | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [excluir, setExcluir] = useState<Lugar | null>(null)
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null)
  const [removerCapa, setRemoverCapa] = useState(false)
  const [urlsPrivadas, setUrlsPrivadas] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    const dados = await listarLugares()
    if (dados === null) setErro('Não foi possível carregar seus lugares.')
    else {
      setLugares(dados)
      const assinadas = await Promise.all(dados.filter((item) => item.capa_path).map(async (item) => [item.uuid, await urlMidiaPessoal(item.capa_path!)] as const))
      setUrlsPrivadas(Object.fromEntries(assinadas.filter((item): item is readonly [string, string] => Boolean(item[1]))))
      setSelecionado((atual) => dados.find((item) => item.uuid === atual?.uuid) ?? dados[0] ?? null)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregar])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return lugares
    return lugares.filter((item) => [item.nome, item.tipo, item.cidade, item.pais].some((valor) => valor?.toLocaleLowerCase('pt-BR').includes(termo)))
  }, [busca, lugares])

  function atualizar(campo: keyof typeof form, valor: string | boolean) { setForm((atual) => ({ ...atual, [campo]: valor })) }
  function limpar() { setEditando(null); setForm(FORM_VAZIO); setArquivoCapa(null); setRemoverCapa(false) }
  function editar(item: Lugar) {
    setEditando(item)
    setForm({
      nome: item.nome, tipo: item.tipo ?? '', cidade: item.cidade ?? '', pais: item.pais ?? '',
      latitude: item.latitude === null ? '' : String(item.latitude), longitude: item.longitude === null ? '' : String(item.longitude),
      data_inicio: item.data_inicio ?? '', data_fim: item.data_fim ?? '', custo: item.custo === null ? '' : String(item.custo),
      nota: item.nota === null ? '' : String(item.nota), favorito: item.favorito, texto: item.texto ?? '', capa_url: item.capa_url ?? '',
    })
    setArquivoCapa(null)
    setRemoverCapa(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvar() {
    if (!form.nome.trim()) return setErro('Informe o nome do lugar.')
    setSalvando(true)
    setErro(null)
    const capaPathAtual = removerCapa ? null : editando?.capa_path ?? null
    const input = {
      nome: form.nome.trim(), tipo: form.tipo.trim() || null, cidade: form.cidade.trim() || null,
      pais: form.pais.trim() || null, latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null, data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null, custo: form.custo ? Number(form.custo) : null,
      nota: form.nota ? Number(form.nota) : null, favorito: form.favorito,
      texto: form.texto.trim() || null, capa_url: form.capa_url.trim() || null, capa_path: capaPathAtual,
    }
    const { result: resultado, error: erroMidia } = await persistirComMidia({
      scope: 'lugares', file: arquivoCapa, currentPath: capaPathAtual,
      persist: (capaPath) => salvarLugar({ ...input, capa_path: capaPath }, editando?.uuid),
    })
    if (!resultado) setErro('Não foi possível salvar. Revise datas, coordenadas e valores.')
    else {
      if (removerCapa && editando?.capa_path) await apagarMidiaPessoal(editando.capa_path)
      limpar(); await carregar(); setSelecionado(resultado)
    }
    if (erroMidia) setErro(erroMidia)
    setSalvando(false)
  }

  async function confirmarExclusao() {
    if (!excluir) return
    const removido = await deletarLugar(excluir.uuid)
    if (!removido) {
      setErro('Não foi possível excluir o lugar.')
      return
    }
    if (excluir.capa_path) await apagarMidiaPessoal(excluir.capa_path)
    if (selecionado?.uuid === excluir.uuid) setSelecionado(null)
    setExcluir(null)
    await carregar()
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header><p className="font-mono text-xs uppercase text-muted-foreground">Memórias e planos</p><h1 className="mt-2 text-3xl font-semibold">Lugares</h1><p className="mt-2 text-muted-foreground">Guarde destinos visitados ou desejados sem depender de uma API de mapas.</p></header>
      {erro ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{erro}</p> : null}

      <section className="mt-8 border-t border-border pt-5"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase text-muted-foreground">Cadastro manual</p><h2 className="mt-1 text-xl font-semibold">{editando ? 'Editar lugar' : 'Novo lugar'}</h2></div>{editando ? <Button variant="outline" onClick={limpar}>Cancelar edição</Button> : null}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Campo label="Nome *"><Input value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} /></Campo><Campo label="Tipo"><Input placeholder="Viagem, restaurante..." value={form.tipo} onChange={(e) => atualizar('tipo', e.target.value)} /></Campo><Campo label="Cidade"><Input value={form.cidade} onChange={(e) => atualizar('cidade', e.target.value)} /></Campo><Campo label="País"><Input value={form.pais} onChange={(e) => atualizar('pais', e.target.value)} /></Campo><Campo label="Latitude"><Input type="number" min="-90" max="90" step="0.000001" value={form.latitude} onChange={(e) => atualizar('latitude', e.target.value)} /></Campo><Campo label="Longitude"><Input type="number" min="-180" max="180" step="0.000001" value={form.longitude} onChange={(e) => atualizar('longitude', e.target.value)} /></Campo><Campo label="Data inicial"><Input type="date" value={form.data_inicio} onChange={(e) => atualizar('data_inicio', e.target.value)} /></Campo><Campo label="Data final"><Input type="date" value={form.data_fim} onChange={(e) => atualizar('data_fim', e.target.value)} /></Campo><Campo label="Custo"><Input type="number" min="0" step="0.01" value={form.custo} onChange={(e) => atualizar('custo', e.target.value)} /></Campo><Campo label="Nota (0-10)"><Input type="number" min="0" max="10" step="0.5" value={form.nota} onChange={(e) => atualizar('nota', e.target.value)} /></Campo><Campo label="URL da capa"><Input type="url" value={form.capa_url} onChange={(e) => atualizar('capa_url', e.target.value)} /></Campo><label className="flex h-8 items-center gap-2 self-end text-sm"><input type="checkbox" checked={form.favorito} onChange={(e) => atualizar('favorito', e.target.checked)} className="size-4 accent-current" /><Star className="size-4" /> Favorito</label></div>
        <div className="mt-4 rounded-lg border border-border p-3"><PrivateMediaField file={arquivoCapa} onChange={(file) => { setArquivoCapa(file); if (file) setRemoverCapa(false) }} label="Capa privada" />{editando?.capa_path && !arquivoCapa ? <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={removerCapa} onChange={(event) => setRemoverCapa(event.target.checked)} />Remover capa privada ao salvar</label> : null}</div>
        <Campo label="Notas"><Textarea className="mt-1" rows={3} value={form.texto} onChange={(e) => atualizar('texto', e.target.value)} /></Campo><Button className="mt-4" onClick={() => void salvar()} disabled={salvando}><Plus /> {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar lugar'}</Button>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(17rem,.75fr)_minmax(0,1.25fr)]">
        <section className="border-t border-border pt-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Seus lugares</h2><span className="text-xs text-muted-foreground">{lugares.length}</span></div><Input className="mt-4" placeholder="Filtrar por nome ou local" value={busca} onChange={(e) => setBusca(e.target.value)} /><ul className="mt-3 divide-y divide-border border-y border-border">{filtrados.length === 0 ? <li className="py-5 text-sm text-muted-foreground">Nenhum lugar encontrado.</li> : filtrados.map((item) => <li key={item.uuid}><button type="button" onClick={() => setSelecionado(item)} className={`flex w-full items-center gap-3 px-1 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/30 ${selecionado?.uuid === item.uuid ? 'bg-accent/60' : ''}`}><MapPin className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.nome}</strong><span className="block truncate text-xs text-muted-foreground">{[item.cidade, item.pais].filter(Boolean).join(', ') || item.tipo || 'Sem localização'}</span></span>{item.favorito ? <Star className="size-4 fill-current text-warning" /> : null}</button></li>)}</ul></section>

        <section className="border-t border-border pt-5">{selecionado ? <Detalhe lugar={selecionado} imagem={urlsPrivadas[selecionado.uuid] || selecionado.capa_url} onEdit={() => editar(selecionado)} onDelete={() => setExcluir(selecionado)} /> : <div className="py-12 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-3 size-6" />Selecione ou cadastre um lugar para ver os detalhes.</div>}</section>
      </div>
    </div><ConfirmDialog open={Boolean(excluir)} onOpenChange={(open) => !open && setExcluir(null)} title="Excluir lugar?" description={`“${excluir?.nome ?? ''}” sairá da coleção por exclusão lógica.`} confirmLabel="Excluir" onConfirm={confirmarExclusao} /></main>
  )
}

function Detalhe({ lugar, imagem, onEdit, onDelete }: { lugar: Lugar; imagem: string | null; onEdit: () => void; onDelete: () => void }) {
  return <article>{imagem ? <img src={imagem} alt="" className="aspect-[16/6] w-full rounded-lg object-cover" /> : <div className="flex aspect-[16/5] items-center justify-center rounded-lg bg-secondary"><MapPin className="size-8 text-muted-foreground" /></div>}<div className="mt-5 flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase text-muted-foreground">{lugar.tipo || 'Lugar'}</p><h2 className="mt-1 text-2xl font-semibold">{lugar.nome}</h2><p className="mt-1 text-sm text-muted-foreground">{[lugar.cidade, lugar.pais].filter(Boolean).join(', ') || 'Localização não informada'}</p></div>{lugar.favorito ? <Star className="size-5 fill-current text-warning" /> : null}</div><dl className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Período" value={[formatarData(lugar.data_inicio), formatarData(lugar.data_fim)].filter(Boolean).join(' – ') || '--'} /><Info label="Custo" value={lugar.custo === null ? '--' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lugar.custo))} /><Info label="Nota" value={lugar.nota === null ? '--' : `${lugar.nota}/10`} /></dl>{lugar.texto ? <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{lugar.texto}</p> : null}<div className="mt-6 flex flex-wrap gap-2"><Button variant="outline" onClick={onEdit}><Pencil /> Editar</Button><Button variant="destructive" onClick={onDelete}><Trash2 /> Excluir</Button><a href={linkMapa(lugar)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted"><ExternalLink className="size-4" /> Abrir no Maps</a></div></article>
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-3 block text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label> }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div> }
function formatarData(data: string | null) { return data ? new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR') : '' }
