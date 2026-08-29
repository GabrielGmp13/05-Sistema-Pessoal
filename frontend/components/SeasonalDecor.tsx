'use client'

import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { useTema, type Decoracao } from './ThemeProvider'
import styles from './SeasonalDecor.module.css'

const particulas = Array.from({ length: 56 }, (_, indice) => ({
  left: `${1 + ((indice * 37) % 98)}%`,
  '--particula-topo': `${4 + ((indice * 43) % 88)}%`,
  '--particula-tamanho': `${5 + ((indice * 11) % 9)}px`,
  '--particula-atraso': `${-((indice * 0.73) % 13).toFixed(2)}s`,
  '--particula-duracao': `${8 + ((indice * 7) % 9)}s`,
  '--particula-desvio': `${-24 + ((indice * 19) % 49)}px`,
  '--particula-rotacao': `${-70 + ((indice * 31) % 141)}deg`,
} as CSSProperties))

const classesDecoracao: Record<Decoracao, string> = {
  primavera: styles.primavera,
  verao: styles.verao,
  outono: styles.outono,
  inverno: styles.inverno,
  nenhum: styles.nenhum,
}

export function SeasonalDecor({ variante, className }: { variante: 'topo' | 'lateral'; className?: string }) {
  const { decoracao } = useTema()

  return (
    <span
      aria-hidden="true"
      className={cn(styles.camada, styles[variante], classesDecoracao[decoracao], className)}
    >
      {particulas.map((style, indice) => <i key={indice} className={styles.particula} style={style} />)}
    </span>
  )
}
