import assert from 'node:assert/strict'
import test from 'node:test'
import { compararEventosAgenda } from '../lib/agenda-order.ts'
import type { EventoAgendaOrdenavel } from '../lib/agenda-order.ts'

const base: EventoAgendaOrdenavel = { uuid: 'b', data: '2026-08-21', hora_inicio: '10:00', prioridade: 'normal', titulo: 'Evento' }

test('ordena agenda por data, hora e só então prioridade', () => {
  const eventos: EventoAgendaOrdenavel[] = [
    { ...base, uuid: '2', prioridade: 'baixa' },
    { ...base, uuid: '1', prioridade: 'alta' },
    { ...base, uuid: '3', data: '2026-08-20', prioridade: 'baixa' },
    { ...base, uuid: '4', hora_inicio: '09:00', prioridade: 'normal' },
  ]
  assert.deepEqual(eventos.sort(compararEventosAgenda).map((item) => item.uuid), ['3', '4', '1', '2'])
})

test('eventos sem horário ficam depois dos eventos com horário', () => {
  assert.equal(compararEventosAgenda({ ...base, hora_inicio: null }, base) > 0, true)
})
