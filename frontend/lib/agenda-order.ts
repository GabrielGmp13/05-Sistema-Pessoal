export type PrioridadeOrdenavel = 'baixa' | 'normal' | 'alta'

export interface EventoAgendaOrdenavel {
  uuid: string
  data: string
  hora_inicio: string | null
  prioridade: PrioridadeOrdenavel
  titulo: string
}

const ORDEM_PRIORIDADE: Record<PrioridadeOrdenavel, number> = { alta: 0, normal: 1, baixa: 2 }

export function compararEventosAgenda(a: EventoAgendaOrdenavel, b: EventoAgendaOrdenavel) {
  const porData = a.data.localeCompare(b.data)
  if (porData !== 0) return porData
  const porHora = (a.hora_inicio ?? '99:99').localeCompare(b.hora_inicio ?? '99:99')
  if (porHora !== 0) return porHora
  const porPrioridade = ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]
  if (porPrioridade !== 0) return porPrioridade
  return a.titulo.localeCompare(b.titulo, 'pt-BR') || a.uuid.localeCompare(b.uuid)
}
