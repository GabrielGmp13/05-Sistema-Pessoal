'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
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
    setEnviando(true)

    const uuid = crypto.randomUUID()
    const hoje = new Date().toISOString().slice(0, 10)
    let fotoPath: string | null = null

    if (arquivo) {
      fotoPath = `${userId}/${hoje}-${uuid}.jpg`
      const { error: erroUpload } = await sb.storage.from('shape').upload(fotoPath, arquivo)
      if (erroUpload) {
        console.error('[upload shape]', erroUpload)
        fotoPath = null
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

    if (!error) {
      setPeso('')
      setObs('')
      setArquivo(null)
      await recarregar(userId)
    }
    setEnviando(false)
  }

  return (
    <div className={styles.container}>
      <Link href="/treino" className={styles.voltar}>← Treino</Link>
      <h1 className={styles.titulo}>Shape</h1>

      <form className={styles.form} onSubmit={handleSalvar}>
        <input type="number" inputMode="decimal" className={styles.input} placeholder="Peso (kg)" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <input type="text" className={styles.input} placeholder="Observações (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        <button className={styles.btnSalvar} disabled={enviando} type="submit">
          {enviando ? 'Salvando…' : 'Registrar'}
        </button>
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