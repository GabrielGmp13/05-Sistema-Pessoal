'use client'

import { useEffect, useState } from 'react'
import { Avaliacao, listarAvaliacoes, salvarAvaliacao, removerAvaliacao } from '@/lib/avaliacoes'
import { mediaAvaliacoes } from '@/lib/avaliacoes-calculo'
import { Section } from './section'
import { Field } from './field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const vazio = { titulo: '', data: '', nota: '', nota_maxima: '10', peso: '1' }

export function AvaliacoesMateria({ materiaUuid }: { materiaUuid: string }) {
  const [itens, setItens] = useState<Avaliacao[]>([])
  const [form, setForm] = useState(vazio)
  const [edicao, setEdicao] = useState<Avaliacao | null>(null)
  const [remocao, setRemocao] = useState<Avaliacao | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [novoUuid, setNovoUuid] = useState<string | null>(null)
  const media = mediaAvaliacoes(itens)

  useEffect(() => {
    let ativo = true
    listarAvaliacoes(materiaUuid).then((dados) => {
      if (ativo) { setItens(dados); setCarregado(true) }
    }).catch((e: Error) => { if (ativo) setErro(e.message) })
    return () => { ativo = false }
  }, [materiaUuid])

  async function atualizar() {
    setOcupado(true)
    try {
      setItens(await listarAvaliacoes(materiaUuid)); setIncerto(false); setCarregado(true)
      setEdicao(null); setForm(vazio); setNovoUuid(null); setErro('')
    } catch (e) { setErro((e as Error).message) } finally { setOcupado(false) }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (ocupado || incerto) return
    setOcupado(true); setErro('')
    const uuid = edicao?.uuid ?? novoUuid ?? crypto.randomUUID()
    setNovoUuid(uuid)
    try {
      const salvo = await salvarAvaliacao(materiaUuid, uuid, {
        titulo: form.titulo, data: form.data || null, nota: form.nota === '' ? null : Number(form.nota),
        nota_maxima: Number(form.nota_maxima), peso: Number(form.peso),
      }, edicao ?? undefined)
      setItens((atuais) => [...atuais.filter((i) => i.uuid !== salvo.uuid), salvo])
      setForm(vazio); setEdicao(null); setNovoUuid(null)
    } catch (e) { setErro((e as Error).message); setIncerto(true) } finally { setOcupado(false) }
  }

  return <Section title="Avaliações e média" label="Notas">
    <p className="mb-3 text-sm text-muted-foreground">
      {media.percentual === null ? 'Sem notas avaliadas.' : `Média ponderada: ${media.percentual.toFixed(1)}% da nota máxima.`}
      {' '}{media.avaliadas} avaliadas · {media.pendentes} pendentes. Notas antigas das provas permanecem separadas.
    </p>
    {erro && <p role="alert" className="mb-2 text-sm text-destructive">{erro}</p>}
    <Button type="button" variant="ghost" disabled={ocupado} onClick={atualizar}>Atualizar lista</Button>
    <ul className="my-4 divide-y divide-border">
      {itens.map((item) => <li key={item.uuid} className="flex flex-wrap items-center gap-2 py-3">
        <span className="mr-auto">{item.titulo} · {item.nota === null ? 'Pendente' : `${item.nota}/${item.nota_maxima}`} · peso {item.peso}{item.data ? ` · ${item.data}` : ''}</span>
        <Button variant="ghost" disabled={ocupado || incerto} onClick={() => {
          setEdicao(item); setForm({ titulo: item.titulo, data: item.data ?? '', nota: item.nota === null ? '' : String(item.nota), nota_maxima: String(item.nota_maxima), peso: String(item.peso) })
        }}>Editar</Button>
        <Button variant="ghost" disabled={ocupado || incerto} onClick={() => setRemocao(item)}>Remover</Button>
      </li>)}
    </ul>
    <form onSubmit={salvar}>
      <fieldset disabled={ocupado || incerto || !carregado} className="grid gap-3 sm:grid-cols-2">
        <Field label="Título" htmlFor="avaliacao-titulo"><Input id="avaliacao-titulo" required maxLength={200} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
        <Field label="Data" htmlFor="avaliacao-data" optional><Input id="avaliacao-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
        {(['nota', 'nota_maxima', 'peso'] as const).map((campo) => <Field key={campo} label={{ nota: 'Nota (vazia = pendente)', nota_maxima: 'Nota máxima', peso: 'Peso' }[campo]} htmlFor={`avaliacao-${campo}`}>
          <Input id={`avaliacao-${campo}`} type="number" inputMode="decimal" step="0.001" min={campo === 'nota' ? 0 : 0.001} max={campo === 'nota' ? form.nota_maxima : 9999999.999} required={campo !== 'nota'} value={form[campo]} onChange={(e) => setForm({ ...form, [campo]: e.target.value })} />
        </Field>)}
        <div className="flex items-end gap-2"><Button type="submit">{edicao ? 'Salvar avaliação' : 'Adicionar avaliação'}</Button>
          {edicao && <Button type="button" variant="ghost" onClick={() => { setEdicao(null); setForm(vazio) }}>Cancelar</Button>}</div>
      </fieldset>
    </form>
    <ConfirmDialog open={!!remocao} onOpenChange={(aberto) => { if (!aberto) setRemocao(null) }} title="Remover avaliação?" description="A avaliação deixará de compor a média desta matéria." confirmLabel="Remover" onConfirm={async () => {
      if (!remocao) return
      setOcupado(true)
      try { await removerAvaliacao(remocao); setItens((atuais) => atuais.filter((i) => i.uuid !== remocao.uuid)); setRemocao(null) }
      catch (e) { setErro((e as Error).message); setIncerto(true) }
      finally { setOcupado(false) }
    }} />
  </Section>
}
