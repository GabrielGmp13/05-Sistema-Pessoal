'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { dataLocalIso } from '@/lib/date'
import styles from './page.module.css'

interface RegistroShape {
  uuid: string
  data: string
  peso: number | null
  foto_path: string | null
  observacoes: string | null
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

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function recarregar(uid: string) {
    const { data, error } = await sb
      .from('shape')
      .select('uuid, data, peso, foto_path, observacoes')
      .eq('user_id', uid)
      .eq('deleted', false)
      .order('data', { ascending: false })

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

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setErro(null)
    setEnviando(true)

    const uuid = crypto.randomUUID()
    const hoje = dataLocalIso()
    let fotoPath: string | null = null

    if (arquivo) {
      fotoPath = `${userId}/${hoje}-${uuid}.jpg`
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
      await recarregar(userId)
    }
    setEnviando(false)
  }

  function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = e.target.files?.[0] ?? null
    setErro(null)

    if (selecionado && !['image/jpeg', 'image/png', 'image/webp'].includes(selecionado.type)) {
      setArquivo(null)
      setErro('Use uma imagem JPG, PNG ou WebP.')
      e.target.value = ''
      return
    }
    if (selecionado && selecionado.size > 10 * 1024 * 1024) {
      setArquivo(null)
      setErro('A foto deve ter no máximo 10 MB.')
      e.target.value = ''
      return
    }

    setArquivo(selecionado)
  }

  return (
    <div className={styles.container}>
      <Link href="/treino" className={styles.voltar}>← Treino</Link>
      <h1 className={styles.titulo}>Shape</h1>

      <form className={styles.form} onSubmit={handleSalvar}>
        <input type="number" inputMode="decimal" className={styles.input} placeholder="Peso (kg)" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <input type="text" className={styles.input} placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleArquivoSelecionado} />
        <button className={styles.btnSalvar} disabled={enviando} type="submit">
          {enviando ? 'Salvando…' : 'Registrar'}
        </button>
        {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
      </form>

      <div className={styles.grid}>
        {registros.map((r) => (
          <div key={r.uuid} className={styles.card}>
            {urlsFotos[r.uuid] && <img src={urlsFotos[r.uuid]} alt="" className={styles.foto} />}
            <p className={styles.data}>{r.data}</p>
            {r.peso && <p className={styles.peso}>{r.peso}kg</p>}
            {r.observacoes && <p className={styles.obs}>{r.observacoes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
