'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  getExerciciosForca, criarExercicioForca, softDeleteExercicioForca,
  getExerciciosCardio, criarExercicioCardio, softDeleteExercicioCardio,
  type ExercicioForca, type ExercicioCardio,
} from '@/lib/treino'
import styles from './page.module.css'

export default function PlanoTreinoPage() {
  const { moduloUuid, treinoUuid } = useParams<{ moduloUuid: string; treinoUuid: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [forca, setForca] = useState<ExercicioForca[]>([])
  const [cardio, setCardio] = useState<ExercicioCardio[]>([])
  const [tipoNovo, setTipoNovo] = useState<'forca' | 'cardio'>('forca')
  const [nome, setNome] = useState('')
  const [series, setSeries] = useState(3)
  const [reps, setReps] = useState(10)
  const [carga, setCarga] = useState(0)
  const [descanso, setDescanso] = useState(60)
  const [distancia, setDistancia] = useState(0)
  const [duracao, setDuracao] = useState(0)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function recarregar(uid: string) {
    setForca(await getExerciciosForca(sb, uid, treinoUuid))
    setCardio(await getExerciciosCardio(sb, uid, treinoUuid))
  }

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      await recarregar(session.user.id)
    }
    init()
  }, [treinoUuid])

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !nome.trim()) return
    const ordem = tipoNovo === 'forca' ? forca.length : cardio.length

    if (tipoNovo === 'forca') {
      await criarExercicioForca(sb, userId, treinoUuid, {
        nome: nome.trim(), series_alvo: series, reps_alvo: reps, carga_alvo: carga, descanso_segundos: descanso, ordem,
      })
    } else {
      await criarExercicioCardio(sb, userId, treinoUuid, {
        nome: nome.trim(), distancia_alvo_km: distancia || null, duracao_alvo_minutos: duracao || null, ordem,
      })
    }
    setNome('')
    await recarregar(userId)
  }

  async function handleApagarForca(uuid: string) {
    if (!userId) return
    if (!confirm('Apagar este exercício?')) return
    await softDeleteExercicioForca(sb, uuid)
    await recarregar(userId)
  }

  async function handleApagarCardio(uuid: string) {
    if (!userId) return
    if (!confirm('Apagar este exercício?')) return
    await softDeleteExercicioCardio(sb, uuid)
    await recarregar(userId)
  }

  return (
    <div className={styles.container}>
      <button className={styles.voltar} onClick={() => router.push(`/treino/${moduloUuid}`)}>← Treinos</button>
      <h1 className={styles.titulo}>Exercícios</h1>

      <form className={styles.form} onSubmit={handleAdicionar}>
        <div className={styles.tipoToggle}>
          <button type="button" className={tipoNovo === 'forca' ? styles.tipoAtivo : styles.tipo} onClick={() => setTipoNovo('forca')}>Força</button>
          <button type="button" className={tipoNovo === 'cardio' ? styles.tipoAtivo : styles.tipo} onClick={() => setTipoNovo('cardio')}>Cardio</button>
        </div>

        <input className={styles.input} placeholder="Nome do exercício" value={nome} onChange={(e) => setNome(e.target.value)} />

        {tipoNovo === 'forca' ? (
          <div className={styles.grid4}>
            <label>Séries<input type="number" inputMode="numeric" value={series} onChange={(e) => setSeries(Number(e.target.value))} /></label>
            <label>Reps<input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(Number(e.target.value))} /></label>
            <label>Carga (kg)<input type="number" inputMode="decimal" value={carga} onChange={(e) => setCarga(Number(e.target.value))} /></label>
            <label>Descanso (s)<input type="number" inputMode="numeric" value={descanso} onChange={(e) => setDescanso(Number(e.target.value))} /></label>
          </div>
        ) : (
          <div className={styles.grid4}>
            <label>Distância (km)<input type="number" inputMode="decimal" value={distancia} onChange={(e) => setDistancia(Number(e.target.value))} /></label>
            <label>Duração (min)<input type="number" inputMode="numeric" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} /></label>
          </div>
        )}

        <button className={styles.btnSalvar} type="submit">Adicionar exercício</button>
      </form>

      {forca.length > 0 && (
        <>
          <h2 className={styles.subtitulo}>Força</h2>
          <div className={styles.lista}>
            {forca.map((ex) => (
              <div key={ex.uuid} className={styles.card}>
                <div>
                  <p className={styles.nome}>{ex.nome}</p>
                  <p className={styles.meta}>{ex.series_alvo}x{ex.reps_alvo} · {ex.carga_alvo}kg · {ex.descanso_segundos}s descanso</p>
                </div>
                <button className={styles.btnDanger} onClick={() => handleApagarForca(ex.uuid)}>Apagar</button>
              </div>
            ))}
          </div>
        </>
      )}

      {cardio.length > 0 && (
        <>
          <h2 className={styles.subtitulo}>Cardio</h2>
          <div className={styles.lista}>
            {cardio.map((ex) => (
              <div key={ex.uuid} className={styles.card}>
                <div>
                  <p className={styles.nome}>{ex.nome}</p>
                  <p className={styles.meta}>{ex.distancia_alvo_km ? `${ex.distancia_alvo_km}km` : ''} {ex.duracao_alvo_minutos ? `· ${ex.duracao_alvo_minutos}min` : ''}</p>
                </div>
                <button className={styles.btnDanger} onClick={() => handleApagarCardio(ex.uuid)}>Apagar</button>
              </div>
            ))}
          </div>
        </>
      )}

      {forca.length === 0 && cardio.length === 0 && (
        <p className={styles.vazio}>Nenhum exercício ainda. Adicione o primeiro acima.</p>
      )}
    </div>
  )
}