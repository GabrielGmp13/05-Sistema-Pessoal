'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { UnoptimizedExternalImage } from '@/components/UnoptimizedExternalImage'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getExerciciosForca, getExerciciosCardio, getImagemExercicioUrl, usuarioPossuiTreino, type ExercicioForca, type ExercicioCardio } from '@/lib/treino'
import { criarSessao, getSessaoAberta, getExecucoesSessao, finalizarSessao, salvarExecucoesForca, salvarExecucaoCardio, getRecordeCarga, type SerieForca } from '@/lib/execucoes'
import { chaveRascunho, lerRascunho, planoAlteradoDuranteSessao, type EstadoSerie, type RascunhoTreino } from '@/lib/treino-rascunho'
import { finalizarComExecucoes } from '@/lib/treino-finalizacao'
import { AvisoDescanso } from '@/components/treino/aviso-descanso'
import { TravaEdicaoTreino } from '@/components/treino/TravaEdicaoTreino'
import styles from './page.module.css'

export default function AcademiaPage() {
  const { treinoUuid } = useParams<{ treinoUuid: string }>()
  return <TravaEdicaoTreino treinoUuid={treinoUuid}><AcademiaConteudo /></TravaEdicaoTreino>
}

function AcademiaConteudo() {
  const { moduloUuid, treinoUuid } = useParams<{ moduloUuid: string; treinoUuid: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [sessaoUuid, setSessaoUuid] = useState<string | null>(null)
  const [forca, setForca] = useState<ExercicioForca[]>([])
  const [cardio, setCardio] = useState<ExercicioCardio[]>([])
  const [seriesPorExercicio, setSeriesPorExercicio] = useState<Record<string, EstadoSerie[]>>({})
  const [cardioFeito, setCardioFeito] = useState<Record<string, { concluido: boolean; distancia: string; duracao: string }>>({})
  const [prs, setPrs] = useState<Record<string, number>>({})
  const [imagensUrl, setImagensUrl] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [treinoPermitido, setTreinoPermitido] = useState(false)
  const [erro, setErro] = useState('')
  const [avisoRascunho, setAvisoRascunho] = useState('')
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [edicaoTravada, setEdicaoTravada] = useState(false)
  const [planoDivergente, setPlanoDivergente] = useState(false)
  const enviandoRef = useRef(false)
  const idsExecucoes = useRef(new Map<string, string>())
  const [descansoAte, setDescansoAte] = useState<number | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const iniciarCarregamento = useEffectEvent(async () => {
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const uid = session.user.id
      setUserId(uid)
      const permitido = await usuarioPossuiTreino(sb, uid, treinoUuid, moduloUuid)
      setTreinoPermitido(permitido)
      if (!permitido) { setCarregando(false); return }

      const [listaForca, listaCardio] = await Promise.all([
        getExerciciosForca(sb, uid, treinoUuid),
        getExerciciosCardio(sb, uid, treinoUuid),
      ])
      setForca(listaForca)
      setCardio(listaCardio)
      const urls = await Promise.all([...listaForca, ...listaCardio].filter((item) => item.imagem_path).map(async (item) => [item.uuid, await getImagemExercicioUrl(sb, item.imagem_path as string)] as const))
      setImagensUrl(Object.fromEntries(urls.filter((item): item is readonly [string, string] => Boolean(item[1]))))

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

      const sessao = await getSessaoAberta(sb, uid, treinoUuid)
      if (sessao) {
        const execucoes = await getExecucoesSessao(sb, uid, sessao)
        for (const serie of execucoes.forca) {
          const index = serie.serie_numero - 1
          if (estadoInicial[serie.exercicio_uuid] && index >= 0 && index < 100) {
            while (estadoInicial[serie.exercicio_uuid].length <= index) estadoInicial[serie.exercicio_uuid].push({ carga: '', reps: '', concluida: false })
            estadoInicial[serie.exercicio_uuid][index] = { carga: String(serie.carga_real ?? ''), reps: String(serie.reps_real ?? ''), concluida: serie.concluida }
            if (serie.uuid) idsExecucoes.current.set(`forca:${serie.exercicio_uuid}:${index}`, serie.uuid)
          }
        }
        for (const registro of execucoes.cardio) {
          if (estadoCardio[registro.exercicio_uuid]) {
            estadoCardio[registro.exercicio_uuid] = { distancia: String(registro.distancia_real_km ?? ''), duracao: String(registro.duracao_real_minutos ?? ''), concluido: registro.concluido }
            if (registro.uuid) idsExecucoes.current.set(`cardio:${registro.exercicio_uuid}`, registro.uuid)
          }
        }
        let rascunho: RascunhoTreino | null = null
        try { rascunho = lerRascunho(localStorage.getItem(chaveRascunho(uid, sessao)), uid, sessao, treinoUuid) }
        catch { setAvisoRascunho('O navegador não permitiu recuperar o rascunho local.') }
        const mudou = planoAlteradoDuranteSessao(
          listaForca.map((ex) => ex.uuid), listaCardio.map((ex) => ex.uuid),
          [...execucoes.forca.map((s) => s.exercicio_uuid), ...Object.keys(rascunho?.series ?? {})],
          [...execucoes.cardio.map((s) => s.exercicio_uuid), ...Object.keys(rascunho?.cardio ?? {})],
        )
        if (mudou) {
          setPlanoDivergente(true)
          setSessaoUuid(sessao)
          setErro('O plano mudou durante esta sessão. Os registros foram preservados, mas a finalização foi bloqueada para não perder exercícios. Restaure os exercícios removidos no plano e volte a este treino.')
          return
        }
        if (rascunho) {
          // Mantém apenas exercícios que ainda pertencem ao plano carregado.
          for (const ex of listaForca) if (rascunho.series[ex.uuid]) estadoInicial[ex.uuid] = rascunho.series[ex.uuid]
          for (const ex of listaCardio) if (rascunho.cardio[ex.uuid]) estadoCardio[ex.uuid] = rascunho.cardio[ex.uuid]
          for (const [chave, uuid] of rascunho.ids) if (!idsExecucoes.current.has(chave)) idsExecucoes.current.set(chave, uuid)
          setDescansoAte(rascunho.descansoAte)
          setSegundosRestantes(rascunho.descansoAte ? Math.max(0, Math.ceil((rascunho.descansoAte - Date.now()) / 1000)) : 0)
          setEdicaoTravada(rascunho.edicaoTravada)
        }
        setSeriesPorExercicio({ ...estadoInicial })
        setCardioFeito({ ...estadoCardio })
        setSessaoUuid(sessao)
      }
    } catch {
      setErro('Não foi possível carregar o treino. Recarregue a página para tentar novamente.')
    } finally {
      setCarregando(false)
    }
  })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void iniciarCarregamento(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [treinoUuid, moduloUuid])

  useEffect(() => {
    if (carregando || !userId || !sessaoUuid || finalizado || planoDivergente) return
    guardarRascunho()
  }, [carregando, userId, sessaoUuid, finalizado, planoDivergente, seriesPorExercicio, cardioFeito, descansoAte, edicaoTravada])

  const guardarRascunho = useEffectEvent(() => persistirRascunho())

  function persistirRascunho(travada = edicaoTravada) {
    if (!userId || !sessaoUuid) return false
    try {
      const rascunho: RascunhoTreino = { versao: 1, userId, sessaoUuid, treinoUuid, series: seriesPorExercicio, cardio: cardioFeito, ids: [...idsExecucoes.current], descansoAte, edicaoTravada: travada }
      localStorage.setItem(chaveRascunho(userId, sessaoUuid), JSON.stringify(rascunho))
      setAvisoRascunho('')
      return true
    } catch {
      setAvisoRascunho('Não foi possível guardar o rascunho neste navegador. Não feche a página antes de finalizar.')
      return false
    }
  }

  async function iniciarSessao() {
    if (!userId || enviandoRef.current) return
    enviandoRef.current = true
    setSalvando(true)
    try {
      const aberta = await getSessaoAberta(sb, userId, treinoUuid)
      if (aberta) { window.location.reload(); return }
      const uuid = await criarSessao(sb, userId, treinoUuid)
      if (!uuid) setErro('Não foi possível iniciar o treino. Tente novamente.')
      else { setSessaoUuid(uuid); setErro('') }
    } catch { setErro('Não foi possível iniciar o treino. Tente novamente.') }
    finally { setSalvando(false); enviandoRef.current = false }
  }

  useEffect(() => {
    if (descansoAte === null) return
    const intervalo = window.setInterval(() => {
      setSegundosRestantes(Math.max(0, Math.ceil((descansoAte - Date.now()) / 1000)))
    }, 250)
    return () => window.clearInterval(intervalo)
  }, [descansoAte])

  useEffect(() => {
    if (!sessaoUuid || finalizado) return
    const avisar = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sessaoUuid, finalizado])

  function atualizarSerie(exercicioUuid: string, index: number, campo: keyof EstadoSerie, valor: string | boolean, agora = 0) {
    if (edicaoTravada) return
    if (campo === 'concluida' && valor === true) {
      const segundos = Math.max(0, forca.find((ex) => ex.uuid === exercicioUuid)?.descanso_segundos ?? 0)
      setSegundosRestantes(segundos)
      setDescansoAte(segundos ? agora + segundos * 1000 : null)
    }
    setSeriesPorExercicio((prev) => {
      const copia = [...prev[exercicioUuid]]
      copia[index] = { ...copia[index], [campo]: valor }
      return { ...prev, [exercicioUuid]: copia }
    })
  }

  function bateuPR(exercicioUuid: string): boolean {
    const recorde = prs[exercicioUuid] ?? 0
    const cargas = (seriesPorExercicio[exercicioUuid] ?? []).filter((s) => s.concluida).map((s) => Number(s.carga) || 0)
    return Math.max(0, ...cargas) > recorde
  }

  async function handleFinalizar() {
    if (!userId || !sessaoUuid || planoDivergente || enviandoRef.current) return
    const seriesAtuais = Object.values(seriesPorExercicio).flat()
    const cardioAtual = Object.values(cardioFeito)
    if (seriesAtuais.some((s) => (s.carga !== '' && (!Number.isFinite(Number(s.carga)) || Number(s.carga) < 0)) || (s.reps !== '' && (!Number.isInteger(Number(s.reps)) || Number(s.reps) < 0))) ||
        cardioAtual.some((s) => (s.distancia !== '' && (!Number.isFinite(Number(s.distancia)) || Number(s.distancia) < 0)) || (s.duracao !== '' && (!Number.isInteger(Number(s.duracao)) || Number(s.duracao) < 0)))) {
      setErro('Use valores positivos ou zero; repetições e minutos devem ser inteiros.')
      return
    }
    enviandoRef.current = true
    setSalvando(true)
    setEdicaoTravada(true)
    setErro('')
    setDescansoAte(null)
    const gravacoes: Array<() => Promise<{ error: string | null }>> = []
    const idExecucao = (chave: string) => {
      if (!idsExecucoes.current.has(chave)) idsExecucoes.current.set(chave, crypto.randomUUID())
      return idsExecucoes.current.get(chave)!
    }

    for (const ex of forca) {
      const series: SerieForca[] = (seriesPorExercicio[ex.uuid] ?? []).map((s, i) => ({
        uuid: idExecucao(`forca:${ex.uuid}:${i}`),
        exercicio_uuid: ex.uuid,
        serie_numero: i + 1,
        carga_real: s.carga ? Number(s.carga) : null,
        reps_real: s.reps ? Number(s.reps) : null,
        concluida: s.concluida,
      }))
      if (series.length > 0) gravacoes.push(() => salvarExecucoesForca(sb, userId, sessaoUuid, series))
    }

    for (const ex of cardio) {
      const estado = cardioFeito[ex.uuid]
      if (estado?.concluido) {
        const uuid = idExecucao(`cardio:${ex.uuid}`)
        gravacoes.push(() => salvarExecucaoCardio(sb, userId, sessaoUuid, {
          uuid,
          exercicio_uuid: ex.uuid,
          concluido: true,
          distancia_real_km: estado.distancia ? Number(estado.distancia) : null,
          duracao_real_minutos: estado.duracao ? Number(estado.duracao) : null,
        }))
      }
    }

    // UUIDs são persistidos antes de qualquer envio, inclusive na primeira tentativa.
    if (!persistirRascunho(true)) {
      setSalvando(false)
      setEdicaoTravada(false)
      enviandoRef.current = false
      setErro('Libere o armazenamento local do navegador antes de enviar, para permitir uma repetição segura se a conexão cair.')
      return
    }
    const resultado = await finalizarComExecucoes(gravacoes, () => finalizarSessao(sb, userId, sessaoUuid, ''))
    setSalvando(false)
    enviandoRef.current = false
    if (resultado.error) setErro(resultado.error)
    else {
      setErro(resultado.aviso ?? '')
      try { localStorage.removeItem(chaveRascunho(userId, sessaoUuid)) } catch { /* A sessão finalizada não é retomada. */ }
      setFinalizado(true)
    }
  }

  if (carregando) return <p className={styles.carregando}>Carregando…</p>

  if (!treinoPermitido) return (
    <div className={styles.container}>
      <button className={styles.voltar} onClick={() => router.push('/treino')}>← Treino</button>
      {erro ? <p role="alert">{erro}</p> : null}
      {planoDivergente ? <button type="button" className={styles.voltar} onClick={() => router.push(`/treino/${moduloUuid}/${treinoUuid}`)}>Abrir plano para restaurar exercícios</button> : null}
      <p className={styles.fim}>Este conteúdo não existe ou não pertence à sua conta.</p>
    </div>
  )

  if (finalizado) {
    return (
      <div className={styles.container}>
        <p className={styles.fim}>Treino salvo. 💪</p>
        {erro && <p role="status">{erro}</p>}
        {erro && <button className={styles.voltar} onClick={() => router.push('/agenda')}>Conferir Agenda</button>}
        <button className={styles.btnSalvar} onClick={() => router.push(`/treino/${moduloUuid}`)}>Voltar</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button className={styles.voltar} disabled={salvando} onClick={() => sessaoUuid ? setConfirmarSaida(true) : router.push(`/treino/${moduloUuid}/${treinoUuid}`)}>← Sair</button>
      <h1 className={styles.titulo}>Modo academia</h1>
      {avisoRascunho ? <p role="alert">{avisoRascunho}</p> : sessaoUuid ? <p>Rascunho neste navegador. Retome usando a mesma conta e navegador; os dados completos vão para o banco ao finalizar. Evite abrir a mesma sessão em duas abas.</p> : <button className={styles.btnSalvar} disabled={salvando || Boolean(erro) || (!forca.length && !cardio.length)} onClick={iniciarSessao}>{salvando ? 'Iniciando…' : 'Iniciar treino'}</button>}
      {erro ? <p role="alert">{erro}</p> : null}
      {edicaoTravada && !salvando ? <p>Os valores estão preservados para repetir o envio sem duplicar as execuções.</p> : null}
      <AvisoDescanso prazo={descansoAte} />
      {descansoAte !== null ? <section className={styles.exercicio} aria-label="Descanso entre séries">
        <p className={styles.nome}>Descanso</p>
        <p role="timer">{Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, '0')}</p>
        {segundosRestantes === 0 ? <p role="status">Descanso concluído. Pode iniciar a próxima série.</p> : null}
        <button type="button" className={styles.voltar} onClick={() => setDescansoAte(null)}>{segundosRestantes ? 'Encerrar descanso' : 'Continuar'}</button>
      </section> : null}
      <fieldset disabled={edicaoTravada || planoDivergente || !sessaoUuid} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      {forca.map((ex) => (
        <div key={ex.uuid} className={styles.exercicio}>
          <div className={styles.exercicioHeader}>
            {imagensUrl[ex.uuid] ? <UnoptimizedExternalImage src={imagensUrl[ex.uuid]} alt="" className={styles.imagemExercicio} /> : null}
            <p className={styles.nome}>{ex.nome}</p>
            {bateuPR(ex.uuid) && <span className={styles.badgePR}>PR</span>}
          </div>
          {ex.grupo_muscular ? <p>{ex.grupo_muscular}</p> : null}
          {ex.instrucoes ? <p style={{ whiteSpace: 'pre-wrap' }}>{ex.instrucoes}</p> : null}
          {(seriesPorExercicio[ex.uuid] ?? []).map((s, i) => (
            <div key={i} className={styles.linhaSerie}>
              <span className={styles.numSerie}>{i + 1}</span>
              <input type="number" inputMode="decimal" className={styles.inputSerie} value={s.carga}
                min="0" step="0.01" aria-label={`Carga em kg — ${ex.nome}, série ${i + 1}`}
                onChange={(e) => atualizarSerie(ex.uuid, i, 'carga', e.target.value)} onFocus={(e) => e.target.select()} placeholder="kg" />
              <input type="number" inputMode="numeric" className={styles.inputSerie} value={s.reps}
                min="0" step="1" aria-label={`Repetições — ${ex.nome}, série ${i + 1}`}
                onChange={(e) => atualizarSerie(ex.uuid, i, 'reps', e.target.value)} onFocus={(e) => e.target.select()} placeholder="reps" />
              <button
                type="button" aria-pressed={s.concluida} aria-label={`Concluir série ${i + 1} de ${ex.nome}`}
                className={s.concluida ? styles.checkOn : styles.checkOff}
                onClick={() => atualizarSerie(ex.uuid, i, 'concluida', !s.concluida, Date.now())}
              >✓</button>
            </div>
          ))}
        </div>
      ))}

      {cardio.map((ex) => (
        <div key={ex.uuid} className={styles.exercicio}>
          {imagensUrl[ex.uuid] ? <UnoptimizedExternalImage src={imagensUrl[ex.uuid]} alt="" className={styles.imagemExercicio} /> : null}
          <p className={styles.nome}>{ex.nome}</p>
          {ex.instrucoes ? <p style={{ whiteSpace: 'pre-wrap' }}>{ex.instrucoes}</p> : null}
          <div className={styles.linhaCardio}>
            <input type="number" inputMode="decimal" className={styles.inputSerie}
              min="0" step="0.001" aria-label={`Distância em km — ${ex.nome}`}
              value={cardioFeito[ex.uuid]?.distancia ?? ''} placeholder="km"
              onChange={(e) => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], distancia: e.target.value } }))} />
            <input type="number" inputMode="numeric" className={styles.inputSerie}
              min="0" step="1" aria-label={`Duração em minutos — ${ex.nome}`}
              value={cardioFeito[ex.uuid]?.duracao ?? ''} placeholder="min"
              onChange={(e) => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], duracao: e.target.value } }))} />
            <button
              type="button" aria-pressed={Boolean(cardioFeito[ex.uuid]?.concluido)} aria-label={`Concluir ${ex.nome}`}
              className={cardioFeito[ex.uuid]?.concluido ? styles.checkOn : styles.checkOff}
              onClick={() => setCardioFeito((p) => ({ ...p, [ex.uuid]: { ...p[ex.uuid], concluido: !p[ex.uuid]?.concluido } }))}
            >✓</button>
          </div>
        </div>
      ))}

      </fieldset>
      <button className={styles.btnSalvar} disabled={salvando || planoDivergente || !sessaoUuid || (!forca.length && !cardio.length)} onClick={handleFinalizar}>
        {salvando ? 'Salvando…' : 'Finalizar treino'}
      </button>
      <ConfirmDialog
        open={confirmarSaida}
        onOpenChange={setConfirmarSaida}
        title="Sair do treino?"
        description={avisoRascunho || 'O rascunho fica neste navegador. Abra o mesmo treino para retomar; a sessão só será contabilizada depois de finalizar. O tempo entre início e fim inclui esta pausa.'}
        confirmLabel="Sair sem finalizar"
        cancelLabel="Continuar treino"
        onConfirm={() => { persistirRascunho(); router.push(`/treino/${moduloUuid}/${treinoUuid}`) }}
      />
    </div>
  )
}
