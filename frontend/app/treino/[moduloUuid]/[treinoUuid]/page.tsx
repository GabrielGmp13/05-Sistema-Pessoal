'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  getExerciciosForca, criarExercicioForca, softDeleteExercicioForca,
  getExerciciosCardio, criarExercicioCardio, softDeleteExercicioCardio,
  deleteImagemExercicio, getImagemExercicioUrl, uploadImagemExercicio,
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
  const [series, setSeries] = useState('3')
  const [reps, setReps] = useState('10')
  const [carga, setCarga] = useState('')
  const [descanso, setDescanso] = useState('60')
  const [distancia, setDistancia] = useState('')
  const [duracao, setDuracao] = useState('')
  const [imagem, setImagem] = useState<File | null>(null)
  const [erroImagem, setErroImagem] = useState('')
  const [imagensUrl, setImagensUrl] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [exercicioParaApagar, setExercicioParaApagar] = useState<{
    uuid: string
    tipo: 'forca' | 'cardio'
  } | null>(null)
  const inputImagemRef = useRef<HTMLInputElement>(null)

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function recarregar(uid: string) {
    const [listaForca, listaCardio] = await Promise.all([getExerciciosForca(sb, uid, treinoUuid), getExerciciosCardio(sb, uid, treinoUuid)])
    setForca(listaForca)
    setCardio(listaCardio)
    const urls = await Promise.all([...listaForca, ...listaCardio].filter((item) => item.imagem_path).map(async (item) => [item.uuid, await getImagemExercicioUrl(sb, item.imagem_path as string)] as const))
    setImagensUrl(Object.fromEntries(urls.filter((item): item is readonly [string, string] => Boolean(item[1]))))
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
    if (!userId || !nome.trim() || erroImagem) return
    setSalvando(true)
    setErro('')
    const ordem = tipoNovo === 'forca' ? forca.length : cardio.length
    let imagemPath: string | null = null
    if (imagem) {
      const upload = await uploadImagemExercicio(sb, userId, imagem)
      if (upload.error || !upload.path) {
        setErro(upload.error ?? 'Não foi possível enviar a imagem.')
        setSalvando(false)
        return
      }
      imagemPath = upload.path
    }

    let resultado: { error: string | null }
    if (tipoNovo === 'forca') {
      resultado = await criarExercicioForca(sb, userId, treinoUuid, {
         nome: nome.trim(),
         series_alvo: Number(series) || 0,
         reps_alvo: Number(reps) || 0,
         carga_alvo: Number(carga) || 0,
         descanso_segundos: Number(descanso) || 0,
         imagem_path: imagemPath,
         ordem,
      })
    } else {
      resultado = await criarExercicioCardio(sb, userId, treinoUuid, {
        nome: nome.trim(),
        distancia_alvo_km: distancia ? Number(distancia) : null,
        duracao_alvo_minutos: duracao ? Number(duracao) : null,
        imagem_path: imagemPath,
       ordem,
      })
    }
    if (resultado.error) {
      if (imagemPath) await deleteImagemExercicio(sb, imagemPath)
      setErro('Não foi possível salvar o exercício.')
      setSalvando(false)
      return
    }
    setNome('')
    limparImagem()
    await recarregar(userId)
    setSalvando(false)
  }

  async function handleApagarConfirmado() {
    if (!userId || !exercicioParaApagar) return
    const exercicio = exercicioParaApagar.tipo === 'forca' ? forca.find((item) => item.uuid === exercicioParaApagar.uuid) : cardio.find((item) => item.uuid === exercicioParaApagar.uuid)
    const resultado = exercicioParaApagar.tipo === 'forca'
      ? await softDeleteExercicioForca(sb, exercicioParaApagar.uuid)
      : await softDeleteExercicioCardio(sb, exercicioParaApagar.uuid)
    if (!resultado.error && exercicio?.imagem_path) {
      await deleteImagemExercicio(sb, exercicio.imagem_path)
    }
    await recarregar(userId)
  }

  function selecionarImagem(event: React.ChangeEvent<HTMLInputElement>) {
    const selecionada = event.target.files?.[0] ?? null
    setImagem(selecionada)
    setErroImagem('')
    if (!selecionada) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selecionada.type)) {
      setErroImagem('Use uma imagem JPG, PNG, WebP ou GIF.')
      return
    }
    if (selecionada.size > 5 * 1024 * 1024) {
      setErroImagem('A imagem deve ter no máximo 5 MB.')
    }
  }

  function limparImagem() {
    setImagem(null)
    setErroImagem('')
    if (inputImagemRef.current) inputImagemRef.current.value = ''
  }

  return (
    <div className={styles.container}>
      <button className={styles.voltar} onClick={() => router.push(`/treino/${moduloUuid}`)}>← Treinos</button>
      <h1 className={styles.titulo}>Exercícios</h1>
      {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}

      <form className={styles.form} onSubmit={handleAdicionar}>
        <div className={styles.tipoToggle}>
          <button type="button" className={tipoNovo === 'forca' ? styles.tipoAtivo : styles.tipo} onClick={() => setTipoNovo('forca')}>Força</button>
          <button type="button" className={tipoNovo === 'cardio' ? styles.tipoAtivo : styles.tipo} onClick={() => setTipoNovo('cardio')}>Cardio</button>
        </div>

        <input className={styles.input} placeholder="Nome do exercício" value={nome} onChange={(e) => setNome(e.target.value)} />

        {tipoNovo === 'forca' ? (
          <div className={styles.grid4}>
            <label>Séries<input type="number" inputMode="numeric" value={series} onChange={(e) => setSeries(e.target.value)} onFocus={(e) => e.target.select()} /></label>
            <label>Reps<input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} onFocus={(e) => e.target.select()} /></label>
            <label>Carga (kg)<input type="number" inputMode="decimal" value={carga} onChange={(e) => setCarga(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" /></label>
            <label>Descanso (s)<input type="number" inputMode="numeric" value={descanso} onChange={(e) => setDescanso(e.target.value)} onFocus={(e) => e.target.select()} /></label>
          </div>
        ) : (
          <div className={styles.grid4}>
            <label>Distância (km)<input type="number" inputMode="decimal" value={distancia} onChange={(e) => setDistancia(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" /></label>
            <label>Duração (min)<input type="number" inputMode="numeric" value={duracao} onChange={(e) => setDuracao(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" /></label>
          </div>
        )}

        <label className={styles.arquivo}>Imagem ou GIF opcional (JPG, PNG, WebP ou GIF · até 5 MB)<input ref={inputImagemRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selecionarImagem} /></label>
        {imagem ? (
          <div className={styles.arquivoSelecionado}>
            <span className={erroImagem ? styles.arquivoInvalido : undefined}>{imagem.name}</span>
            <button type="button" onClick={limparImagem}>Remover arquivo</button>
          </div>
        ) : null}
        {erroImagem ? <p role="alert" className={styles.erroImagem}>{erroImagem} Remova o arquivo ou escolha outro.</p> : null}

        <button className={styles.btnSalvar} type="submit" disabled={salvando || Boolean(erroImagem)}>{salvando ? 'Salvando...' : 'Adicionar exercício'}</button>
      </form>

      {forca.length > 0 && (
        <>
          <h2 className={styles.subtitulo}>Força</h2>
          <div className={styles.lista}>
            {forca.map((ex) => (
              <div key={ex.uuid} className={styles.card}>
                {imagensUrl[ex.uuid] ? <img src={imagensUrl[ex.uuid]} alt="" className={styles.imagemExercicio} /> : null}
                <div>
                  <p className={styles.nome}>{ex.nome}</p>
                  <p className={styles.meta}>{ex.series_alvo}x{ex.reps_alvo} · {ex.carga_alvo}kg · {ex.descanso_segundos}s descanso</p>
                </div>
                <button className={styles.btnDanger} onClick={() => setExercicioParaApagar({ uuid: ex.uuid, tipo: 'forca' })}>Apagar</button>
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
                {imagensUrl[ex.uuid] ? <img src={imagensUrl[ex.uuid]} alt="" className={styles.imagemExercicio} /> : null}
                <div>
                  <p className={styles.nome}>{ex.nome}</p>
                  <p className={styles.meta}>{ex.distancia_alvo_km ? `${ex.distancia_alvo_km}km` : ''} {ex.duracao_alvo_minutos ? `· ${ex.duracao_alvo_minutos}min` : ''}</p>
                </div>
                <button className={styles.btnDanger} onClick={() => setExercicioParaApagar({ uuid: ex.uuid, tipo: 'cardio' })}>Apagar</button>
              </div>
            ))}
          </div>
        </>
      )}

      {forca.length === 0 && cardio.length === 0 && (
        <p className={styles.vazio}>Nenhum exercício ainda. Adicione o primeiro acima.</p>
      )}

      <ConfirmDialog
        open={exercicioParaApagar !== null}
        title="Apagar exercício?"
        description="O exercício deixará de aparecer neste treino. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setExercicioParaApagar(null)
        }}
        onConfirm={handleApagarConfirmado}
      />
    </div>
  )
}
