'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { seedModulosSeNecessario, getModulosTreino, type ModuloTreino } from '@/lib/modulos-treinos'
import styles from './page.module.css'

export default function TreinoHubPage() {
  const [modulos, setModulos] = useState<ModuloTreino[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function init() {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return // middleware já protege, isso é só defesa extra

      await seedModulosSeNecessario(sb, session.user.id)
      const lista = await getModulosTreino(sb, session.user.id)
      setModulos(lista)
      setCarregando(false)
    }
    init()
  }, [])

  if (carregando) return <p className={styles.carregando}>Carregando módulos…</p>

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Treino</h1>
      <div className={styles.grid}>
        {modulos.map((m) => (
          <Link
            key={m.uuid}
            href={`/treino/${m.uuid}`}
            className={styles.card}
            style={{ borderColor: m.cor }}
          >
            <span className={styles.nome}>{m.nome}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}