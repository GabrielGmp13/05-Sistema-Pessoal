'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { getExerciciosForca, getExerciciosCardio, type ExercicioForca, type ExercicioCardio } from '@/lib/treino'
import { criarSessao, finalizarSessao, salvarExecucoesForca, salvarExecucaoCardio, getRecordeCarga, type SerieForca } from '@/lib/execucoes'
import styles from './page.module.css'

interface EstadoSerie { carga: string; reps: string; concluida: boolean }

export default function AcademiaPage() {
  const { moduloUuid, treinoUuid } = useParams<{ moduloUuid: string; treinoUuid: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [sessaoUuid, setSessaoUuid] = useState<string | null>(null)
  const [forca, setForca] = useState<ExercicioForca[]>([])
  const [cardio, setCardio] = useState<ExercicioCardio[]>([])
  const [seriesPorExercicio, setSeriesPorExercicio] = useState<Record<string, EstadoSerie[]>>({})
  const [cardioFeito, setCardioFeito] = useState<Record<string, { concluido: boolean; distancia: string; duracao: string }>>({})
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [salvando, setSalvando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) return
      const uid = session.user.id
      setUserId(uid)

      const [listaForca, listaCardio] = await Promise.all([
        getExerciciosForca(sb, uid, treinoUuid),
        getExerciciosCardio(sb, uid, treinoUuid),
      ])
      setForca(listaForca)
      setCardio(listaCardio)

      const estadoInicial: Record<string, EstadoSerie[]> = {}
      const recordes: Record<string, number> = {}
      for (const ex of listaForca) {
        estadoInicial[ex.uuid] = Array.from({ length: ex.series_alvo ?? 3 }, () => ({
          carga: String(ex.carga_alvo ?? ''), reps: String(ex.reps_alvo ?? ''), concluida: false,
        }))
        recordes[ex.uuid] = await getRecordeCarga(sb, uid, ex.uuid)
      }
      setSeriesPorExercicio(estadoInicial)
      setPrs(recordes)

      const estadoCardio: Record<string, { concluido: boolean; distancia: string; duracao: string }> = {}
      for (const ex of listaCardio) {
        estadoCardio[ex.uuid] = { concluido: false, distancia: String(ex.distancia_alvo_km ?? ''), duracao: String(ex.duracao_alvo_minutos ?? '') }
      }
      setCardioFeito(estadoCardio)

      const sessao = await criarSessao(sb, uid, treinoUuid)
      setSessaoUuid(sessao)
    }
    init()
  }, [treinoUuid])

  function atualizarSerie(exercicioUuid: string, index: number, campo: keyof EstadoSerie, valor: string | boolean) {
    setSeriesPorExercicio((prev) => {
      const copia = [...prev[exercicioUuid]]
      copia[index] = { ...copia[index], [campo]: valor }
      return { ...prev, [exercicioUuid]: copia }
    })
  }

  function bateuPR(exercicioUuid: string): boolean {
    const recorde = prs[exercicioUuid] ?? 0
    const cargas = (seriesPorExercicio[exercicioUuid] ?? []).map((s) => Number(s.carga) || 0)
    return Math.max(0, ...cargas) > recorde
  }

  async function handleFinalizar() {
    if (!userId || !sessaoUuid) return
    setSalvando(true)

    for (const ex of forca) {
      const series: SerieForca[] = (seriesPorExercicio[ex.uuid] ?? []).map((s, i) => ({
        exercicio_uuid: ex.uuid,
        serie_numero: i + 1,
        carga_real: s.carga ? Number(s.carga) : null,
        reps_real: s.reps ? Number(s.reps) : null,
        concluida: s.concluida,
      }))
      if (series.length > 0) await salvarExecucoesForca(sb, userId, sessaoUuid, series)
    }

    for (const ex of cardio) {
      const estado = cardioFeito[ex.uuid]
      if (estado?.concluido) {
        await salvarExecucaoCardio(sb, userId, sessaoUuid, {
          exercicio_uuid: ex.uuid,
          concluido: true,
          distancia_real_km: estado.distancia ? Number(estado.distancia) : null,
          duracao_real_minutos: estado.duracao ? Number(estado.duracao) : null,
        })
      }
    }

    await finalizarSessao(sb, sessaoUuid, '')
    setSalvando(false)
    setFinalizado(true)
  }

  if (finalizado) {
    return (
      <div className={styles.container}>
        <p className={styles.fim}>Treino salvo. 💪</p>
        <button className={styles.btnSalvar} onClick={() => router.push(`/treino/${moduloUuid}`)}>Voltar</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button className={styles.voltar} onClick={() => router.push(`/treino/${moduloUuid}/${treinoUuid}`)}>← Sair</button>
      <h1 className={styles.titulo}>Modo academia</h1>

      {forca.map((ex) => (
        <div key={ex.uuid} className={styles.exercicio}>
          <div className={styles.exercicioHeader}>
            <p className={styles.nome}>{ex.nome}</p>
            {bateuPR(ex.uuid) && <span className={styles.badgePR}>PR</span>}
          </div>
          {(seriesPorExercicio[ex.uuid] ?? []).map((s, i) => (
            <div key={i} className={styles.linhaSerie}>
              <span className={styles.numSerie}>{i + 1}</span>
              <input type="number" inputMode="decimal" className={styles.inputSerie} value={s.carga}
                onChange={(e) => atualizarSerie(ex.uuid, i, 'carga', e.target.value)} onFocus={(e) => e.target.select()} placeholder="kg" />
              <input type="number" inputMode="numeric" className={styles.inputSerie} value={s.reps}
                onChange={(e) => atualizarSerie(ex.uuid, i, 'reps', e.target.value)} onFocus={(e) => e.target.select()} placeholder="reps" />
              <button
                className={s.concluida ? styles.checkOn : styles.checkOff}
                onClick={() => atualizarSerie(ex.uuid, i, 'concluida', !s.concluida)}
              >✓</button>
            </div>
          ))}
        </div>
      ))}

      {cardio.map((ex) => (
        <div key={ex.uuid} className={styles.exercicio}>
          <p className={styles.nome}>{ex.nome}</p>
          <div className={styles.linhaCardio}>
            <input type="number" inputMode="decimal" className={styles.inputSerie}
              value={cardioFeito[ex.uuid]?.distancia ?? ''} placeholder="km"
              onChange={(e) => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], distancia: e.target.value } }))} />
            <input type="number" inputMode="numeric" className={styles.inputSerie}
              value={cardioFeito[ex.uuid]?.duracao ?? ''} placeholder="min"
              onChange={(e) => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], duracao: e.target.value } }))} />
            <button
              className={cardioFeito[ex.uuid]?.concluido ? styles.checkOn : styles.checkOff}
              onClick={() => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], concluido: !p[ex.uuid]?.concluido } }))}
            >✓</button>
          </div>
        </div>
      ))}

      <button className={styles.btnSalvar} disabled={salvando} onClick={handleFinalizar}>
        {salvando ? 'Salvando…' : 'Finalizar treino'}
      </button>
    </div>
  )
}