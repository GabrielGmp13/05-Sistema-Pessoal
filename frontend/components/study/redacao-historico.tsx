'use client'

import { useState } from 'react'
import { Redacao, atualizarRedacao, getUrlImagemRedacao } from '@/lib/redacoes'
import { AvaliacaoRedacao, VersaoRedacao, historicoRedacao, preservarVersaoRedacao, adicionarAvaliacaoRedacao, removerAvaliacaoRedacao } from '@/lib/redacoes-historico'
import { dataLocalIso } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field } from './field'

export function RedacaoHistorico({ redacao, onAtualizado }: { redacao: Redacao; onAtualizado: () => Promise<void> }) {
  const [aberto, setAberto] = useState(false)
  const [versoes, setVersoes] = useState<VersaoRedacao[]>([])
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRedacao[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [incerto, setIncerto] = useState(false)
  const [remocao, setRemocao] = useState<AvaliacaoRedacao | null>(null)
  const [oficial, setOficial] = useState(String(redacao.nota_oficial ?? ''))
  const [foto, setFoto] = useState<{ uuid: string; url: string } | null>(null)
  const [form, setForm] = useState({ avaliador: '', origem: '', data: dataLocalIso(), nota: '', versao: '', comentario: '', competencias: ['', '', '', '', ''] })
  const prefixo = `redacao-${redacao.uuid}`

  async function atualizar() {
    const dados = await historicoRedacao(redacao.uuid)
    setVersoes(dados.versoes); setAvaliacoes(dados.avaliacoes); setIncerto(false)
  }
  async function executar(acao: () => Promise<void>, escrita = false) {
    if (ocupado) return
    setOcupado(true); setErro('')
    try { await acao() } catch (e) { setErro((e as Error).message); if (escrita) setIncerto(true) }
    finally { setOcupado(false) }
  }

  return <div className="border-t border-border pt-4">
    <Button variant="outline" disabled={ocupado} onClick={() => {
      if (aberto) setAberto(false)
      else void executar(async () => { await atualizar(); setAberto(true) })
    }}>{aberto ? 'Fechar histórico' : 'Versões e avaliações'}</Button>
    {erro && <p role="alert" className="mt-2 text-sm text-destructive">{erro}</p>}
    {incerto && <Button variant="ghost" disabled={ocupado} onClick={() => void executar(atualizar)}>Conferir histórico antes de reenviar</Button>}
    {aberto && <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Média pessoal: {avaliacoes.length ? `${(avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)}/1000 (${avaliacoes.length} avaliações)` : 'sem avaliações'}. A nota oficial é registrada separadamente. Notas antigas do cartão não são convertidas automaticamente.</p>
      <Button variant="outline" disabled={ocupado || incerto || (!redacao.texto && !redacao.imagem_path)} onClick={() => void executar(async () => { await preservarVersaoRedacao(redacao); await atualizar() }, true)}>Guardar versão atual</Button>
      <p className="text-xs text-muted-foreground">Editar texto ou remover/substituir foto preserva a versão anterior. Fotos do histórico permanecem privadas.</p>
      {versoes.map((v) => <details key={v.uuid} className="text-sm">
        <summary className="cursor-pointer">Versão {v.numero} · {new Date(v.criada_em).toLocaleString('pt-BR')}</summary>
        {v.texto && <p className="my-2 whitespace-pre-wrap">{v.texto}</p>}
        {v.imagem_path && <Button variant="ghost" disabled={ocupado} onClick={() => void executar(async () => {
          const url = await getUrlImagemRedacao(v.imagem_path!)
          if (!url) throw new Error('Não foi possível abrir a imagem privada.')
          setFoto({ uuid: v.uuid, url })
        })}>Preparar foto privada</Button>}
        {foto?.uuid === v.uuid && <a href={foto.url} target="_blank" rel="noopener noreferrer" className="underline">Abrir foto desta versão</a>}
      </details>)}
      <ul className="divide-y divide-border">{avaliacoes.map((a) => <li key={a.uuid} className="py-3 text-sm">
        <p>{a.avaliador} · {a.origem} · {a.data_avaliacao} · {a.nota}/1000{a.versao_uuid ? ` · versão ${versoes.find((v) => v.uuid === a.versao_uuid)?.numero ?? '—'}` : ''}</p>
        <p className="text-muted-foreground">{[a.competencia_1, a.competencia_2, a.competencia_3, a.competencia_4, a.competencia_5].map((n, i) => `C${i + 1}: ${n ?? '—'}`).join(' · ')}</p>
        {a.comentario && <p className="whitespace-pre-wrap">{a.comentario}</p>}
        <Button variant="ghost" disabled={ocupado || incerto} onClick={() => setRemocao(a)}>Remover avaliação</Button>
      </li>)}</ul>
      <form onSubmit={(e) => {
        e.preventDefault()
        void executar(async () => {
          const notas = form.competencias.map((n) => n === '' ? null : Number(n))
          const nota = Number(form.nota)
          if (!Number.isFinite(nota) || nota < 0 || nota > 1000 || notas.some((n) => n !== null && (!Number.isFinite(n) || n < 0 || n > 200))) throw new Error('Confira nota geral e competências.')
          await adicionarAvaliacaoRedacao({ uuid: crypto.randomUUID(), redacao_uuid: redacao.uuid, versao_uuid: form.versao || null,
            avaliador: form.avaliador.trim(), origem: form.origem.trim(), data_avaliacao: form.data, nota,
            competencia_1: notas[0], competencia_2: notas[1], competencia_3: notas[2], competencia_4: notas[3], competencia_5: notas[4], comentario: form.comentario || null,
          }, redacao.user_id)
          await atualizar(); setForm({ avaliador: '', origem: '', data: dataLocalIso(), nota: '', versao: '', comentario: '', competencias: ['', '', '', '', ''] })
        }, true)
      }}>
        <fieldset disabled={ocupado || incerto} className="grid gap-3 sm:grid-cols-2">
          {(['avaliador', 'origem', 'data', 'nota'] as const).map((campo) => <Field key={campo} htmlFor={`${prefixo}-${campo}`} label={{ avaliador: 'Avaliador', origem: 'Origem da avaliação', data: 'Data da avaliação', nota: 'Nota geral (0–1000)' }[campo]}>
            <Input id={`${prefixo}-${campo}`} required maxLength={120} type={campo === 'data' ? 'date' : campo === 'nota' ? 'number' : 'text'} min={0} max={1000} step="0.1" value={form[campo]} onChange={(e) => setForm({ ...form, [campo]: e.target.value })} />
          </Field>)}
          <Field label="Versão avaliada" htmlFor={`${prefixo}-versao`}><Select id={`${prefixo}-versao`} value={form.versao} onChange={(e) => setForm({ ...form, versao: e.target.value })}>
            <option value="">Sem versão específica</option>{versoes.map((v) => <option key={v.uuid} value={v.uuid}>Versão {v.numero}</option>)}
          </Select></Field>
          {form.competencias.map((n, i) => <Field key={i} label={`Competência ${i + 1}`} htmlFor={`${prefixo}-c${i}`} optional><Input id={`${prefixo}-c${i}`} type="number" min="0" max="200" step="0.1" value={n} onChange={(e) => setForm({ ...form, competencias: form.competencias.map((anterior, j) => j === i ? e.target.value : anterior) })} /></Field>)}
          <Field label="Comentário" htmlFor={`${prefixo}-comentario`} optional><Input id={`${prefixo}-comentario`} value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} /></Field>
          <Button type="submit">Adicionar avaliação</Button>
        </fieldset>
      </form>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
        e.preventDefault(); void executar(async () => {
          const salva = await atualizarRedacao(redacao.uuid, { nota_oficial: oficial === '' ? null : Number(oficial) })
          if (!salva) throw new Error('Nota oficial não confirmada. Atualize a página.')
          await onAtualizado()
        }, true)
      }}>
        <Field label="Nota oficial (se disponível)" htmlFor={`${prefixo}-oficial`}><Input id={`${prefixo}-oficial`} type="number" min="0" max="1000" step="0.1" value={oficial} disabled={ocupado || incerto} onChange={(e) => setOficial(e.target.value)} /></Field>
        <Button disabled={ocupado || incerto} type="submit">Salvar nota oficial</Button>
      </form>
    </div>}
    <ConfirmDialog open={!!remocao} onOpenChange={(v) => { if (!v) setRemocao(null) }} title="Remover avaliação?" description="Ela deixará de compor a média pessoal. A versão da redação será preservada." confirmLabel="Remover" onConfirm={() => executar(async () => { if (remocao) { await removerAvaliacaoRedacao(remocao); setRemocao(null); await atualizar() } }, true)} />
  </div>
}
