'use client'

import { ChevronDown, Cloud, CloudSun, Moon, Sparkles, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { useTema, type Tema } from './ThemeProvider'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const temas: Array<{ valor: Tema; label: string; icon: typeof Sun }> = [
  { valor: 'claro', label: 'Claro', icon: Sun },
  { valor: 'suave', label: 'Suave', icon: CloudSun },
  { valor: 'nublado', label: 'Nublado', icon: Cloud },
  { valor: 'estrelado', label: 'Estrelado', icon: Sparkles },
  { valor: 'escuro', label: 'Escuro', icon: Moon },
]

export function ThemeToggle({ className, open, onOpenChange }: ThemeToggleProps) {
  const { tema, definirTema } = useTema()
  const [abertoInterno, setAbertoInterno] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelId = useId()
  const aberto = open ?? abertoInterno
  const temaAtual = temas.find((opcao) => opcao.valor === tema) ?? temas[0]
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
        aria-label={`Tema ${temaAtual.label}. Abrir seletor de aparência`}
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
        <div id={painelId} role="dialog" aria-label="Escolher aparência" className={styles.painel}>
          <div className={styles.cabecalho}>
            <span>Aparência</span>
            <strong>{temaAtual.label}</strong>
          </div>
          <div className={styles.linha} role="radiogroup" aria-label="Temas disponíveis">
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
          <p className={styles.nota}>Acessibilidade e ajustes finos serão adicionados aqui.</p>
        </div>
      ) : null}
    </div>
  )
}
