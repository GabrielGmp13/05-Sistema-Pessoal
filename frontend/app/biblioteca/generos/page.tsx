'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { seedGenerosSeNecessario, getGeneros, criarGenero, atualizarGenero, softDeleteGenero, type Genero } from '@/lib/generos'
import styles from './page.module.css'

export default function GenerosPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [generos, setGeneros] = useState<Genero[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nomeNovo, setNomeNovo] = useState('')
  const [descNova, setDescNova] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [nomeEdit, setNomeEdit] = useState('')
  const [descEdit, setDescEdit] = useState('')
  const [generoParaApagar, setGeneroParaApagar] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const sb = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const recarregar = useCallback(async (uid: string) => {
    setGeneros(await getGeneros(sb, uid))
  }, [sb])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      await seedGenerosSeNecessario(sb, uid)
      await recarregar(uid)
      setCarregando(false)
    }
    init()
  }, [recarregar, sb])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !nomeNovo.trim()) return
    const { error } = await criarGenero(sb, userId, nomeNovo, descNova)
    if (!error) {
      setNomeNovo('')
      setDescNova('')
      await recarregar(userId)
    }
  }

  function iniciarEdicao(g: Genero) {
    setEditando(g.uuid)
    setNomeEdit(g.nome)
    setDescEdit(g.descricao ?? '')
  }

  async function handleSalvarEdicao(uuid: string) {
    if (!userId || !nomeEdit.trim()) return
    const { error } = await atualizarGenero(sb, uuid, nomeEdit, descEdit)
    if (!error) {
      setEditando(null)
      await recarregar(userId)
    }
  }

  async function handleApagarConfirmado() {
    if (!userId || !generoParaApagar) return
    await softDeleteGenero(sb, generoParaApagar)
    await recarregar(userId)
  }

  if (carregando) return <p className={styles.carregando}>Carregando…</p>

  return (
    <div className={styles.container}>
      <Link href="/biblioteca" className={styles.voltar}>← Biblioteca</Link>
      <h1 className={styles.titulo}>Gêneros</h1>

      <form className={styles.form} onSubmit={handleCriar}>
        <input className={styles.input} placeholder="Nome do gênero" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} />
        <input className={styles.input} placeholder="Descrição (opcional — vira tooltip)" value={descNova} onChange={(e) => setDescNova(e.target.value)} />
        <button className={styles.btnSalvar} type="submit">Adicionar gênero</button>
      </form>

      <input className={styles.input} type="search" placeholder="Pesquisar gênero" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Pesquisar gênero" />

      <div className={styles.lista}>
        {generos.filter((g) => `${g.nome} ${g.descricao ?? ''}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))).map((g) => (
          <div key={g.uuid} className={styles.card}>
            {editando === g.uuid ? (
              <div className={styles.edicao}>
                <input className={styles.input} value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} />
                <input className={styles.input} value={descEdit} onChange={(e) => setDescEdit(e.target.value)} placeholder="Descrição" />
                <div className={styles.acoes}>
                  <button className={styles.btnSalvar} onClick={() => handleSalvarEdicao(g.uuid)}>Salvar</button>
                  <button className={styles.btnGhost} onClick={() => setEditando(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className={styles.nome}>{g.nome}</p>
                  {g.descricao && <p className={styles.desc}>{g.descricao}</p>}
                </div>
                <div className={styles.acoes}>
                  <button className={styles.btnGhost} onClick={() => iniciarEdicao(g)}>Editar</button>
                  <button className={styles.btnDanger} onClick={() => setGeneroParaApagar(g.uuid)}>Apagar</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={generoParaApagar !== null}
        title="Apagar gênero?"
        description="O gênero deixará de aparecer nas obras que já o utilizam. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setGeneroParaApagar(null)
        }}
        onConfirm={handleApagarConfirmado}
      />
    </div>
  )
}
