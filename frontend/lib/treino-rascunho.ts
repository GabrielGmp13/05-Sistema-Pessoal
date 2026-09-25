export interface EstadoSerie { carga: string; reps: string; concluida: boolean }
export interface EstadoCardio { concluido: boolean; distancia: string; duracao: string }
export interface RascunhoTreino {
  versao: 1
  userId: string
  sessaoUuid: string
  treinoUuid: string
  series: Record<string, EstadoSerie[]>
  cardio: Record<string, EstadoCardio>
  ids: Array<[string, string]>
  descansoAte: number | null
  edicaoTravada: boolean
}

export function chaveRascunho(userId: string, sessaoUuid: string) {
  return `treino:rascunho:v1:${userId}:${sessaoUuid}`
}

/** Nunca descarte execuções quando um exercício saiu do plano durante a sessão. */
export function planoAlteradoDuranteSessao(
  forcaAtual: string[], cardioAtual: string[],
  forcaSalva: string[], cardioSalvo: string[],
): boolean {
  const forca = new Set(forcaAtual)
  const cardio = new Set(cardioAtual)
  return forcaSalva.some((uuid) => !forca.has(uuid)) || cardioSalvo.some((uuid) => !cardio.has(uuid))
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function lerRascunho(raw: string | null, userId: string, sessaoUuid: string, treinoUuid: string): RascunhoTreino | null {
  if (!raw) return null
  try {
    const r: unknown = JSON.parse(raw)
    if (!objeto(r) || r.versao !== 1 || r.userId !== userId || r.sessaoUuid !== sessaoUuid || r.treinoUuid !== treinoUuid || !objeto(r.series) || !objeto(r.cardio)) return null
    if (typeof r.edicaoTravada !== 'boolean' || !(r.descansoAte === null || (typeof r.descansoAte === 'number' && Number.isFinite(r.descansoAte)))) return null
    if (!Object.values(r.series).every((series) => Array.isArray(series) && series.length <= 100 && series.every((s: unknown) => objeto(s) && typeof s.carga === 'string' && typeof s.reps === 'string' && typeof s.concluida === 'boolean'))) return null
    if (!Object.values(r.cardio).every((c) => objeto(c) && typeof c.distancia === 'string' && typeof c.duracao === 'string' && typeof c.concluido === 'boolean')) return null
    if (!Array.isArray(r.ids) || !r.ids.every((par: unknown) => Array.isArray(par) && par.length === 2 && par.every((v: unknown) => typeof v === 'string'))) return null
    return r as unknown as RascunhoTreino
  } catch { return null }
}
