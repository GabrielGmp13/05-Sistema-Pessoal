'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { dataLocalIso } from '@/lib/date'
import styles from './page.module.css'

interface RegistroShape {
  uuid: string
  data: string
  peso: number | null
  foto_path: string | null
  observacoes: string | null
  updated_at: string
}

export default function ShapePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [registros, setRegistros] = useState<RegistroShape[]>([])
  const [urlsFotos, setUrlsFotos] = useState<Record<string, string>>({})
  const [peso, setPeso] = useState('')
  const [obs, setObs] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [registroEditando, setRegistroEditando] = useState<RegistroShape | null>(null)
  const [registroParaExcluir, setRegistroParaExcluir] = useState<RegistroShape | null>(null)
  const [edicao, setEdicao] = useState({ data: '', peso: '', observacoes: '' })
  const [arquivoEdicao, setArquivoEdicao] = useState<File | null>(null)
  const [removerFotoAtual, setRemoverFotoAtual] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const inputArquivoEdicaoRef = useRef<HTMLInputElement>(null)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function recarregar(uid: string) {
    const { data, error } = await sb
      .from('shape')
      .select('uuid, data, peso, foto_path, observacoes, updated_at')
      .eq('user_id', uid)
      .eq('deleted', false)
      .order('data', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[shape recarregar]', error)
      return
    }
    setRegistros(data ?? [])

    const urls: Record<string, string> = {}
    for (const r of data ?? []) {
      if (r.foto_path) {
        const { data: signed } = await sb.storage.from('shape').createSignedUrl(r.foto_path, 3600)
        if (signed) urls[r.uuid] = signed.signedUrl
      }
    }
    setUrlsFotos(urls)
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      await recarregar(session.user.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!registroEditando) return
    function fechar(event: KeyboardEvent) {
      if (event.key === 'Escape') setRegistroEditando(null)
    }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [registroEditando])

  function extensaoArquivo(file: File) {
    return file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  }

  function erroArquivo(file: File | null) {
    if (!file) return null
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Use uma imagem JPG, PNG ou WebP.'
    if (file.size > 10 * 1024 * 1024) return 'A foto deve ter no máximo 10 MB.'
    return null
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setErro(null)
    setEnviando(true)

    const uuid = crypto.randomUUID()
    const hoje = dataLocalIso()
    let fotoPath: string | null = null

    if (arquivo) {
      fotoPath = `${userId}/${hoje}-${uuid}.${extensaoArquivo(arquivo)}`
      const { error: erroUpload } = await sb.storage.from('shape').upload(fotoPath, arquivo)
      if (erroUpload) {
        console.error('[upload shape]', erroUpload)
        setErro('Não foi possível enviar a foto. Confira o formato e o tamanho do arquivo.')
        setEnviando(false)
        return
      }
    }

    const { error } = await sb.from('shape').insert({
      uuid,
      user_id: userId,
      data: hoje,
      peso: peso ? Number(peso) : null,
      foto_path: fotoPath,
      observacoes: obs || null,
    })

    if (error) {
      console.error('[shape salvar]', error)
      if (fotoPath) {
        const { error: erroLimpeza } = await sb.storage.from('shape').remove([fotoPath])
        if (erroLimpeza) console.error('[shape limpar upload]', erroLimpeza)
      }
      setErro('Não foi possível salvar o registro de Shape.')
    } else {
      setPeso('')
      setObs('')
      setArquivo(null)
      if (inputArquivoRef.current) inputArquivoRef.current.value = ''
      await recarregar(userId)
    }
    setEnviando(false)
  }

  function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = e.target.files?.[0] ?? null
    setErro(null)

    const mensagem = erroArquivo(selecionado)
    if (mensagem) {
      setArquivo(null)
      setErro(mensagem)
      e.target.value = ''
      return
    }

    setArquivo(selecionado)
  }

  function abrirEdicao(registro: RegistroShape) {
    setRegistroEditando(registro)
    setEdicao({
      data: registro.data,
      peso: registro.peso?.toString() ?? '',
      observacoes: registro.observacoes ?? '',
    })
    setArquivoEdicao(null)
    setRemoverFotoAtual(false)
    setErro(null)
    if (inputArquivoEdicaoRef.current) inputArquivoEdicaoRef.current.value = ''
  }

  function handleArquivoEdicaoSelecionado(event: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = event.target.files?.[0] ?? null
    const mensagem = erroArquivo(selecionado)
    setErro(mensagem)
    if (mensagem) {
      setArquivoEdicao(null)
      event.target.value = ''
      return
    }
    setArquivoEdicao(selecionado)
    if (selecionado) setRemoverFotoAtual(false)
  }

  async function salvarEdicao(event: React.FormEvent) {
    event.preventDefault()
    if (!userId || !registroEditando || !edicao.data) return
    setSalvandoEdicao(true)
    setErro(null)

    let novoFotoPath = registroEditando.foto_path
    if (arquivoEdicao) {
      novoFotoPath = `${userId}/${edicao.data}-${registroEditando.uuid}-${crypto.randomUUID()}.${extensaoArquivo(arquivoEdicao)}`
      const { error: erroUpload } = await sb.storage.from('shape').upload(novoFotoPath, arquivoEdicao)
      if (erroUpload) {
        console.error('[shape editar upload]', erroUpload)
        setErro('Não foi possível enviar a nova foto.')
        setSalvandoEdicao(false)
        return
      }
    } else if (removerFotoAtual) {
      novoFotoPath = null
    }

    const { error: erroAtualizacao } = await sb
      .from('shape')
      .update({
        data: edicao.data,
        peso: edicao.peso ? Number(edicao.peso) : null,
        observacoes: edicao.observacoes.trim() || null,
        foto_path: novoFotoPath,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', registroEditando.uuid)
      .eq('user_id', userId)
      .eq('deleted', false)

    if (erroAtualizacao) {
      console.error('[shape editar]', erroAtualizacao)
      if (arquivoEdicao && novoFotoPath) await sb.storage.from('shape').remove([novoFotoPath])
      setErro('Não foi possível salvar as alterações do Shape.')
      setSalvandoEdicao(false)
      return
    }

    if (registroEditando.foto_path && registroEditando.foto_path !== novoFotoPath) {
      const { error: erroRemocao } = await sb.storage.from('shape').remove([registroEditando.foto_path])
      if (erroRemocao) console.error('[shape remover foto anterior]', erroRemocao)
    }
    setRegistroEditando(null)
    await recarregar(userId)
    setSalvandoEdicao(false)
  }

  async function excluirRegistro() {
    if (!userId || !registroParaExcluir) return
    const { error: erroExclusao } = await sb
      .from('shape')
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq('uuid', registroParaExcluir.uuid)
      .eq('user_id', userId)
      .eq('deleted', false)
    if (erroExclusao) {
      console.error('[shape excluir]', erroExclusao)
      setErro('Não foi possível excluir o registro de Shape.')
      return
    }
    if (registroParaExcluir.foto_path) {
      const { error: erroFoto } = await sb.storage.from('shape').remove([registroParaExcluir.foto_path])
      if (erroFoto) console.error('[shape excluir foto]', erroFoto)
    }
    setRegistroEditando(null)
    setRegistroParaExcluir(null)
    await recarregar(userId)
  }

  return (
    <div className={styles.container}>
      <Link href="/treino" className={styles.voltar}>← Treino</Link>
      <h1 className={styles.titulo}>Shape</h1>

      <form className={styles.form} onSubmit={handleSalvar}>
        <input type="number" inputMode="decimal" className={styles.input} placeholder="Peso (kg)" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <input type="text" className={styles.input} placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
        <input ref={inputArquivoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleArquivoSelecionado} />
        <button className={styles.btnSalvar} disabled={enviando} type="submit">
          {enviando ? 'Salvando…' : 'Registrar'}
        </button>
        {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
      </form>

      <div className={styles.grid}>
        {registros.map((r) => (
          <button key={r.uuid} type="button" className={styles.card} onClick={() => abrirEdicao(r)} aria-label={`Editar Shape de ${r.data}`}>
            {urlsFotos[r.uuid] && <img src={urlsFotos[r.uuid]} alt="" className={styles.foto} />}
            <p className={styles.data}>{r.data}</p>
            {r.peso && <p className={styles.peso}>{r.peso}kg</p>}
            {r.observacoes && <p className={styles.obs}>{r.observacoes}</p>}
            <span className={styles.editarDica}>Clique para editar</span>
          </button>
        ))}
      </div>

      {registroEditando ? (
        <div className={styles.modalFundo} role="presentation" onMouseDown={() => setRegistroEditando(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="shape-editar-titulo" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalCabecalho}>
              <div><p className={styles.modalEyebrow}>Registro de Shape</p><h2 id="shape-editar-titulo">Editar evolução</h2></div>
              <button type="button" onClick={() => setRegistroEditando(null)} aria-label="Fechar edição">×</button>
            </div>
            {urlsFotos[registroEditando.uuid] && !removerFotoAtual ? <img src={urlsFotos[registroEditando.uuid]} alt="" className={styles.fotoEdicao} /> : null}
            <form className={styles.formEdicao} onSubmit={salvarEdicao}>
              <label>Data<input className={styles.input} type="date" required value={edicao.data} onChange={(event) => setEdicao((atual) => ({ ...atual, data: event.target.value }))} /></label>
              <label>Peso (kg)<input className={styles.input} type="number" inputMode="decimal" value={edicao.peso} onChange={(event) => setEdicao((atual) => ({ ...atual, peso: event.target.value }))} /></label>
              <label>Observações<input className={styles.input} type="text" value={edicao.observacoes} onChange={(event) => setEdicao((atual) => ({ ...atual, observacoes: event.target.value }))} /></label>
              <label>Substituir foto<input ref={inputArquivoEdicaoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleArquivoEdicaoSelecionado} /></label>
              {registroEditando.foto_path && !arquivoEdicao ? <label className={styles.removerFoto}><input type="checkbox" checked={removerFotoAtual} onChange={(event) => setRemoverFotoAtual(event.target.checked)} />Remover foto atual ao salvar</label> : null}
              {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
              <div className={styles.acoesEdicao}>
                <button type="button" className={styles.btnExcluir} onClick={() => setRegistroParaExcluir(registroEditando)}>Excluir registro</button>
                <button type="button" className={styles.btnSecundario} onClick={() => setRegistroEditando(null)}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar} disabled={salvandoEdicao}>{salvandoEdicao ? 'Salvando…' : 'Salvar alterações'}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={registroParaExcluir !== null}
        title="Excluir registro de Shape?"
        description="O peso, as observações e a foto deste registro deixarão de aparecer no histórico."
        confirmLabel="Excluir"
        onOpenChange={(open) => { if (!open) setRegistroParaExcluir(null) }}
        onConfirm={excluirRegistro}
      />
    </div>
  )
}
