'use client'

import { useEffect, useRef, useState } from 'react'
import { AvisoNavegador } from '@/components/avisos-navegador'

/** Áudio opcional, liberado por gesto explícito. Não depende de rede ou assets. */
export function AvisoDescanso({ prazo }: { prazo: number | null }) {
  const contexto = useRef<AudioContext | null>(null)
  const avisado = useRef<number | null>(null)
  const [ativo, setAtivo] = useState(false)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  function tocar(ctx: AudioContext) {
    const oscilador = ctx.createOscillator()
    const volume = ctx.createGain()
    oscilador.frequency.value = 660
    volume.gain.setValueAtTime(0, ctx.currentTime)
    volume.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02)
    volume.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
    oscilador.connect(volume)
    volume.connect(ctx.destination)
    oscilador.onended = () => { oscilador.disconnect(); volume.disconnect() }
    oscilador.start()
    oscilador.stop(ctx.currentTime + 0.65)
  }

  async function alternar() {
    if (ocupado) return
    if (ativo) { setAtivo(false); return }
    setOcupado(true)
    try {
      const ctx = contexto.current ?? new AudioContext()
      contexto.current = ctx
      await ctx.resume()
      if (ctx.state !== 'running') throw new Error('audio indisponível')
      tocar(ctx)
      setErro('')
      setAtivo(true)
    } catch { setErro('Som indisponível neste navegador. O aviso visual continua funcionando.') }
    finally { setOcupado(false) }
  }

  useEffect(() => {
    if (!ativo || prazo === null) return
    const verificar = () => {
      if (Date.now() < prazo || avisado.current === prazo) return
      avisado.current = prazo
      const ctx = contexto.current
      if (ctx?.state === 'running') {
        try { tocar(ctx) }
        catch { setErro('Não foi possível tocar o aviso. Confira o descanso na tela.') }
      } else { setErro('O navegador suspendeu o áudio. Desative e ative o som novamente.') }
    }
    const intervalo = window.setInterval(verificar, 250)
    return () => window.clearInterval(intervalo)
  }, [ativo, prazo])

  useEffect(() => () => { void contexto.current?.close().catch(() => {}) }, [])

  return <div>
    <button type="button" aria-pressed={ativo} disabled={ocupado} onClick={() => void alternar()}>
      {ativo ? 'Desativar som do descanso' : 'Ativar e testar som do descanso'}
    </button>
    <p>O som depende do volume do aparelho e da página aberta. Tela bloqueada ou navegador suspenso podem atrasar o aviso.</p>
    <AvisoNavegador
      chave="descanso"
      titulo="Descanso concluído"
      corpo="Você pode iniciar a próxima série."
      pronto={prazo !== null && Date.now() >= prazo}
      disparador={prazo}
    />
    {erro && <p role="status">{erro}</p>}
  </div>
}
