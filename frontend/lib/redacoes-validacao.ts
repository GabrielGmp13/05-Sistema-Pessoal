export const NOTAS_COMPETENCIA_ENEM = [0, 40, 80, 120, 160, 200] as const

export function competenciaEnemValida(valor: string | number | null): boolean {
  if (valor === null || (typeof valor === 'string' && valor.trim() === '')) return true
  const numero = typeof valor === 'number' ? valor : Number(valor)
  return NOTAS_COMPETENCIA_ENEM.some((nota) => nota === numero)
}
