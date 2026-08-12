export function dataLocalIso(data = new Date()): string {
  const copia = new Date(data)
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset())
  return copia.toISOString().slice(0, 10)
}

export function dataLocalSomandoDias(dias: number, data = new Date()): string {
  const copia = new Date(data)
  copia.setDate(copia.getDate() + dias)
  return dataLocalIso(copia)
}
