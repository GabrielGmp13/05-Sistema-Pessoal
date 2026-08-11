'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getTreinosPorModulo, criarTreino, softDeleteTreino, type Treino } from '@/lib/treino'
import styles from './page.module.css'

export default function PlanoModuloPage() {
  const { moduloUuid } = useParams<{ moduloUuid: string }>()
  const [userId, setUserId] = useState<string | null>(null)
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nomeNovo, setNomeNovo] = useState('')
  const [descNova, setDescNova] = useState('')
  const [treinoParaApagar, setTreinoParaApagar] = useState<string | null>(null)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function recarregar(uid: string) {
    const lista = await getTreinosPorModulo(sb, uid, moduloUuid)
    setTreinos(lista)
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      await recarregar(session.user.id)
      setCarregando(false)
    }
    init()
  }, [moduloUuid])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !nomeNovo.trim()) return
    const { error } = await criarTreino(sb, userId, moduloUuid, nomeNovo.trim(), descNova.trim())
    if (!error) {
      setNomeNovo('')
      setDescNova('')
      await recarregar(userId)
    }
  }

  async function handleApagarConfirmado() {
    if (!userId || !treinoParaApagar) return
    await softDeleteTreino(sb, treinoParaApagar)
    await recarregar(userId)
  }

  if (carregando) return <p className={styles.carregando}>Carregando…</p>

  return (
    <div className={styles.container}>
      <Link href="/treino" className={styles.voltar}>← Treino</Link>
      <h1 className={styles.titulo}>Treinos</h1>

      <form className={styles.formNovo} onSubmit={handleCriar}>
        <input
          className={styles.input}
          placeholder="Nome do treino"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Descrição (opcional)"
          value={descNova}
          onChange={(e) => setDescNova(e.target.value)}
        />
        <button className={styles.btnSalvar} type="submit">Adicionar</button>
      </form>

      {treinos.length === 0 && <p className={styles.vazio}>Nenhum treino ainda. Crie o primeiro acima.</p>}

      <div className={styles.lista}>
        {treinos.map((t) => (
          <div key={t.uuid} className={styles.card}>
            <div>
              <p className={styles.nome}>{t.nome}</p>
              {t.descricao && <p className={styles.desc}>{t.descricao}</p>}
            </div>
            <div className={styles.acoes}>
              <Link href={`/treino/${moduloUuid}/${t.uuid}`} className={styles.btnGhost}>
                Exercícios
              </Link>
              <Link href={`/treino/${moduloUuid}/${t.uuid}/academia`} className={styles.btnPrimario}>
                Treinar
              </Link>
              <button className={styles.btnDanger} onClick={() => setTreinoParaApagar(t.uuid)}>
                Apagar
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={treinoParaApagar !== null}
        title="Apagar treino?"
        description="Os exercícios deste treino também deixarão de aparecer. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setTreinoParaApagar(null)
        }}
        onConfirm={handleApagarConfirmado}
      />
    </div>
  )
}
