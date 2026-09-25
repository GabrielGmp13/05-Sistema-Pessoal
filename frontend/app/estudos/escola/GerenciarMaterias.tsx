'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { atualizarMateria, criarMateriaEscolar, type Materia } from '@/lib/materias'
import { sb } from '@/lib/supabase'
import { rotuloAcademico } from '@/lib/contexto-academico'

export function GerenciarMaterias({ materias, rotulo, recarregar }: {
  materias: Materia[]; rotulo: 'Escola' | 'Faculdade'; recarregar: () => Promise<void>
}) {
  const [nome, setNome] = useState('')
  const [editando, setEditando] = useState<Materia | null>(null)
  const [removendo, setRemovendo] = useState<Materia | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [precisaRecarregar, setPrecisaRecarregar] = useState(false)
  const trava = useRef(false)
  const bloqueado = ocupado || precisaRecarregar

  async function conferirEstado() {
    if (trava.current) return
    trava.current = true; setOcupado(true)
    try {
      await recarregar()
      setPrecisaRecarregar(false); setErro('')
    } catch { setErro('Ainda não foi possível conferir os dados. Verifique a conexão e tente atualizar novamente.') }
    finally { trava.current = false; setOcupado(false) }
  }

  async function executar(acao: () => Promise<boolean>) {
    if (trava.current || precisaRecarregar) return
    trava.current = true; setOcupado(true); setErro('')
    try {
      if (!await acao()) throw new Error('gravação não confirmada')
      setEditando(null); setNome('')
      await recarregar()
    } catch {
      setPrecisaRecarregar(true)
      setErro('Não foi possível confirmar a operação. Ela pode ter sido salva. Atualize os dados antes de editar novamente para evitar duplicatas.')
    }
    finally { trava.current = false; setOcupado(false) }
  }

  function salvar() {
    const limpo = nome.trim()
    if (!limpo) { setErro('Informe o nome da matéria.'); return }
    if (materias.some(m => m.uuid !== editando?.uuid && m.nome.trim().toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'))) {
      setErro('Essa matéria já existe. Use a opção de reincluir se ela estiver fora deste contexto.'); return
    }
    void executar(async () => Boolean(editando ? await atualizarMateria(editando.uuid, { nome: limpo }) : await criarMateriaEscolar(limpo)))
  }

  return <section className="space-y-4 rounded-xl border border-border p-4" aria-label="Gerenciar matérias">
    <h2 className="font-semibold">Personalizar {rotulo}</h2>
    <label className="flex items-center gap-3">Nome deste contexto
      <select className="rounded border border-border bg-background p-2" value={rotulo} disabled={bloqueado} onChange={event => {
        const novo = rotuloAcademico(event.target.value)
        void executar(async () => { const { error } = await sb.auth.updateUser({ data: { app_contexto_academico: novo } }); return !error })
      }}><option>Escola</option><option>Faculdade</option></select>
    </label>
    {erro && <p role="alert" className="text-destructive">{erro}</p>}
    {precisaRecarregar && <Button type="button" variant="outline" disabled={ocupado} onClick={() => void conferirEstado()}>Atualizar dados</Button>}
    <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); salvar() }}>
      <Input aria-label="Nome da matéria" maxLength={120} value={nome} onChange={event => setNome(event.target.value)} disabled={bloqueado} required />
      <Button disabled={bloqueado} type="submit">{editando ? 'Salvar nome' : 'Criar matéria'}</Button>
      {editando && <Button type="button" variant="outline" disabled={ocupado} onClick={() => { setEditando(null); setNome('') }}>Cancelar</Button>}
    </form>
    <p className="text-sm text-muted-foreground">O nome é compartilhado com o ENEM quando a matéria aparece nos dois contextos. Retirar daqui não apaga histórico nem remove do ENEM.</p>
    <ul className="space-y-2">{materias.map(m => <li key={m.uuid} className="flex flex-wrap items-center gap-2">
      <span className="mr-auto">{m.nome}{m.mostra_enem ? ' · também no ENEM' : ''}</span>
      <Button type="button" variant="outline" disabled={bloqueado} onClick={() => { setEditando(m); setNome(m.nome) }}>Editar nome</Button>
      {m.mostra_escola ? <Button type="button" variant="outline" disabled={bloqueado} onClick={() => setRemovendo(m)}>Retirar de {rotulo}</Button>
        : <Button type="button" variant="outline" disabled={bloqueado} onClick={() => void executar(async () => Boolean(await atualizarMateria(m.uuid, { mostra_escola: true })))}>Reincluir em {rotulo}</Button>}
    </li>)}</ul>
    <ConfirmDialog open={Boolean(removendo)} title={`Retirar de ${rotulo}?`} description="A matéria e seu histórico serão preservados, inclusive no ENEM. Você pode reincluí-la nesta mesma tela."
      onOpenChange={aberto => { if (!aberto && !ocupado) setRemovendo(null) }} confirmLabel="Retirar"
      onConfirm={async () => { if (removendo) await executar(async () => Boolean(await atualizarMateria(removendo.uuid, { mostra_escola: false }))); setRemovendo(null) }} />
  </section>
}
