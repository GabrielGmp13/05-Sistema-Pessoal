'use client'

import { useState } from 'react'
import type { Genero } from '@/lib/generos'
import styles from './SeletorGenero.module.css'

interface Props {
  generos: Genero[]
  selecionados: string[]
  onChange: (uuids: string[]) => void
}

export default function SeletorGenero({ generos, selecionados, onChange }: Props) {
  const [tooltipAberto, setTooltipAberto] = useState<string | null>(null)

  function alternar(uuid: string) {
    if (selecionados.includes(uuid)) {
      onChange(selecionados.filter((u) => u !== uuid))
    } else {
      onChange([...selecionados, uuid])
    }
  }

  return (
    <div className={styles.container}>
      {generos.map((g) => {
        const ativo = selecionados.includes(g.uuid)
        return (
          <div key={g.uuid} className={styles.wrapper}>
            <button
              type="button"
              className={ativo ? styles.chipAtivo : styles.chip}
              onClick={() => alternar(g.uuid)}
              onMouseEnter={() => g.descricao && setTooltipAberto(g.uuid)}
              onMouseLeave={() => setTooltipAberto(null)}
            >
              {g.nome}
            </button>
            {tooltipAberto === g.uuid && g.descricao && (
              <div className={styles.tooltip}>{g.descricao}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}