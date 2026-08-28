import assert from 'node:assert/strict'
import test from 'node:test'

import { classificarImportacaoCalendar, dataHoraRecife, type EventoGoogleImportacao } from '../lib/calendar-import.ts'

const remoto: EventoGoogleImportacao = {
  id: 'google-1', titulo: 'Evento', descricao: null, data: '2026-08-27', horaInicio: '09:00',
  duracaoMinutos: 60, atualizadoEm: '2026-08-27T13:00:00Z', cancelado: false, link: null, agendaUuid: null,
}

test('classifica novo, atualização, cancelamento e conflito sem sobrescrever edição local', () => {
  assert.equal(classificarImportacaoCalendar(remoto, null), 'novo')
  const local = { uuid: 'local-1', google_calendar_event_id: 'google-1', google_calendar_synced_at: '2026-08-27T12:00:00Z', updated_at: '2026-08-27T12:00:00Z' }
  assert.equal(classificarImportacaoCalendar(remoto, local), 'atualizar')
  assert.equal(classificarImportacaoCalendar({ ...remoto, cancelado: true }, local), 'cancelar')
  assert.equal(classificarImportacaoCalendar({ ...remoto, cancelado: true }, { ...local, updated_at: '2026-08-27T12:30:00Z' }), 'conflito')
  assert.equal(classificarImportacaoCalendar({ ...remoto, cancelado: true }, { ...local, deleted: true }), 'sem_alteracao')
})

test('normaliza data e hora do Calendar para America/Recife', () => {
  assert.deepEqual(dataHoraRecife('2026-08-27T15:30:00Z'), { data: '2026-08-27', hora: '12:30' })
})
