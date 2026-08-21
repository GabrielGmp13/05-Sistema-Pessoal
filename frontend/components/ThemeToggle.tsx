'use client'

import { ChevronDown, CircleOff, Cloud, CloudSun, Flower2, Leaf, Moon, Snowflake, Sparkles, Sun, SunMedium } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { useTema, type Decoracao, type Tema } from './ThemeProvider'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const temas: Array<{ valor: Tema; label: string; icon: typeof Sun }> = [
  { valor: 'claro', label: 'Sol', icon: Sun },
  { valor: 'suave', label: 'Suave', icon: CloudSun },
  { valor: 'nublado', label: 'Nublado', icon: Cloud },
  { valor: 'estrelado', label: 'Estrelado', icon: Sparkles },
  { valor: 'escuro', label: 'Lua', icon: Moon },
]

const decoracoes: Array<{ valor: Decoracao; label: string; icon: typeof Sun }> = [
  { valor: 'primavera', label: 'Primavera', icon: Flower2 },
  { valor: 'verao', label: 'Verão', icon: SunMedium },
  { valor: 'outono', label: 'Outono', icon: Leaf },
  { valor: 'inverno', label: 'Inverno', icon: Snowflake },
  { valor: 'nenhum', label: 'Nenhum', icon: CircleOff },
]

export function ThemeToggle({ className, open, onOpenChange }: ThemeToggleProps) {
  const { tema, definirTema, decoracao, definirDecoracao } = useTema()
  const [abertoInterno, setAbertoInterno] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelId = useId()
  const aberto = open ?? abertoInterno
  const temaAtual = temas.find((opcao) => opcao.valor === tema) ?? temas[0]
  const decoracaoAtual = decoracoes.find((opcao) => opcao.valor === decoracao) ?? decoracoes[0]
  const IconeAtual = temaAtual.icon

  function alterarAberto(proximo: boolean) {
    if (onOpenChange) onOpenChange(proximo)
    else setAbertoInterno(proximo)
  }

  useEffect(() => {
    if (!aberto) return

    function fechar() {
      if (onOpenChange) onOpenChange(false)
      else setAbertoInterno(false)
    }

    function fecharAoClicarFora(event: PointerEvent) {
      if (!raizRef.current?.contains(event.target as Node)) fechar()
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      fechar()
      gatilhoRef.current?.focus()
    }

    document.addEventListener('pointerdown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto, onOpenChange])

  return (
    <div ref={raizRef} className={cn(styles.raiz, className)}>
      <button
        ref={gatilhoRef}
        type="button"
        className={styles.gatilho}
        aria-label={`Iluminação ${temaAtual.label}, decoração ${decoracaoAtual.label}. Abrir atmosfera`}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-controls={painelId}
        onClick={() => alterarAberto(!aberto)}
      >
        <IconeAtual aria-hidden="true" className={styles.gatilhoIcone} />
        <span className={styles.gatilhoTexto}>{temaAtual.label}</span>
        <ChevronDown aria-hidden="true" className={cn(styles.seta, aberto && styles.setaAberta)} />
      </button>

      {aberto ? (
        <div id={painelId} role="dialog" aria-label="Escolher atmosfera" className={styles.painel}>
          <div className={styles.cabecalho}>
            <span>Atmosfera</span>
            <strong>{temaAtual.label} · {decoracaoAtual.label}</strong>
          </div>
          <span className={styles.rotulo}>Iluminação</span>
          <div className={styles.linha} role="radiogroup" aria-label="Iluminações disponíveis">
            {temas.map(({ valor, label, icon: Icon }) => {
              const selecionado = tema === valor
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  className={cn(styles.opcao, selecionado && styles.opcaoSelecionada)}
                  onClick={() => definirTema(valor)}
                >
                  <span className={styles.iconeCirculo}><Icon aria-hidden="true" /></span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
          <span className={styles.rotulo}>Estação / decoração</span>
          <div className={styles.decoracoes} role="radiogroup" aria-label="Decorações disponíveis">
            {decoracoes.map(({ valor, label, icon: Icon }) => {
              const selecionado = decoracao === valor
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  className={cn(styles.decoracao, selecionado && styles.decoracaoSelecionada)}
                  onClick={() => definirDecoracao(valor)}
                >
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
          <p className={styles.nota}>Animações respeitam a redução de movimento do dispositivo.</p>
        </div>
      ) : null}
    </div>
  )
}
