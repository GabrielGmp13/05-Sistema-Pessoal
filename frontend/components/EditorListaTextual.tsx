'use client'

import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { validarCamposLista, type CampoLista } from '@/lib/editor-lista'
import styles from './ListaEditavel.module.css'
import StarRating from './StarRating'

type Item = { uuid: string; titulo: string; detalhe?: string; valores: Record<string, string> }
interface Props {
  titulo: string
  campos: CampoLista[]
  listar: () => Promise<Item[] | null>
  salvar: (uuid: string | null, valores: Record<string, string>) => Promise<boolean>
  apagar: (uuid: string) => Promise<boolean>
}

// Compartilhado pelos editores dentro do modal; o painel de leitura não muda.
export function EditorListaTextual({ titulo, campos, listar, salvar, apagar }: Props) {
  const [itens, setItens] = useState<Item[]>([])
  const [valores, setValores] = useState<Record<string, string>>({})
  const [editando, setEditando] = useState<string | null>(null)
  const [remover, setRemover] = useState<Item | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [listaPronta, setListaPronta] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const primeiroCampo = useRef<HTMLInputElement>(null)
  const emOperacao = useRef(false)

  useEffect(() => {
    let ativo = true
    listar().then((res) => {
      if (!ativo) return
      if (res === null) setErro('Não foi possível carregar a lista. Reabra o editor para tentar novamente.')
      else { setItens(res); setListaPronta(true) }
    }).catch(() => { if (ativo) setErro('Não foi possível carregar a lista.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [listar])

  function cancelar() { setEditando(null); setValores({}) }

  async function executar(operacao: () => Promise<boolean>, limpar: boolean) {
    if (emOperacao.current || !listaPronta) return
    emOperacao.current = true
    setOcupado(true)
    setErro('')
    try {
      if (!await operacao()) { setListaPronta(false); setErro('Não foi possível confirmar a alteração. Seus campos foram preservados. Reabra a lista para conferir o estado salvo antes de reenviar.'); return }
      if (limpar) cancelar()
      const atualizados = await listar()
      if (atualizados === null) { setListaPronta(false); setErro('Alteração salva, mas a lista não pôde ser atualizada. Reabra o editor antes de continuar.') }
      else setItens(atualizados)
    } catch { setListaPronta(false); setErro('Não foi possível confirmar a operação. Reabra a lista antes de tentar novamente.') }
    finally { emOperacao.current = false; setOcupado(false) }
  }

  function gravar() {
    const dados = Object.fromEntries(campos.map((campo) => [campo.chave, (valores[campo.chave] ?? '').trim()]))
    const falha = validarCamposLista(campos, dados)
    if (falha) { setErro(falha); return }
    void executar(() => salvar(editando, dados), true)
  }

  return <section className={styles.wrapper} aria-label={titulo}>
    <h4>{titulo}</h4>
    {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
    {carregando ? <p className={styles.vazio}>Carregando…</p> : <ul className={styles.lista}>
      {itens.map((item) => <li key={item.uuid}>
        <span><strong>{item.titulo}</strong>{item.detalhe ? ' — ' + item.detalhe : ''}</span>
        <span>
          <button type="button" disabled={ocupado} aria-label={'Editar ' + item.titulo} onClick={() => { setEditando(item.uuid); setValores(item.valores); primeiroCampo.current?.focus() }}>Editar</button>
          <button type="button" disabled={ocupado} aria-label={'Remover ' + item.titulo} onClick={() => setRemover(item)}>Remover</button>
        </span>
      </li>)}
      {!itens.length ? <li className={styles.vazio}>Nenhum item cadastrado.</li> : null}
    </ul>}
    {editando ? <p className={styles.instrucao}>Editando item existente</p> : null}
    <fieldset disabled={ocupado || carregando || !listaPronta} className={styles.linhaAdicionar} style={{ border: 0, padding: 0, margin: 0 }}>
      {campos.map((campo, i) => campo.estrelas ? <StarRating key={campo.chave} label={campo.rotulo}
        disabled={ocupado || carregando || !listaPronta}
        value={valores[campo.chave] ? Number(valores[campo.chave]) : null}
        onChange={(nota) => setValores(atuais => ({ ...atuais, [campo.chave]: nota === null ? '' : String(nota) }))} /> : <input key={campo.chave} ref={i === 0 ? primeiroCampo : undefined}
        aria-label={campo.rotulo} placeholder={campo.rotulo} maxLength={2000}
        type={campo.data ? 'date' : campo.url ? 'url' : campo.numero ? 'number' : 'text'} value={valores[campo.chave] ?? ''}
        min={campo.min} max={campo.max} step={campo.passo} inputMode={campo.numero ? (campo.passo === 1 ? 'numeric' : 'decimal') : undefined}
        onChange={(event) => setValores((atuais) => ({ ...atuais, [campo.chave]: event.target.value }))} />)}
      <button type="button" onClick={gravar}>{ocupado ? 'Salvando…' : editando ? 'Salvar alterações' : '+ Adicionar'}</button>
      {editando ? <button type="button" onClick={cancelar}>Cancelar edição</button> : null}
    </fieldset>
    <ConfirmDialog open={Boolean(remover)} onOpenChange={(aberto) => { if (!aberto && !ocupado) setRemover(null) }}
      title={'Remover ' + (remover?.titulo ?? 'item') + '?'} description="A obra e os demais itens serão preservados."
      confirmLabel="Remover" onConfirm={async () => { if (remover) { await executar(() => apagar(remover.uuid), editando === remover.uuid); setRemover(null) } }} />
  </section>
}
