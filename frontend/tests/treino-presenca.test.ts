import test from 'node:test'
import assert from 'node:assert/strict'
import { estadoTreinoAgendado } from '../lib/treino-presenca.ts'

test('falta apenas após o dia marcado; correção posterior prevalece', () => {
  assert.equal(estadoTreinoAgendado('2027-01-08', false, '2027-01-08'), 'agendado')
  assert.equal(estadoTreinoAgendado('2027-01-08', false, '2027-01-09'), 'falta')
  assert.equal(estadoTreinoAgendado('2027-01-08', true, '2027-01-09'), 'feito')
  assert.equal(estadoTreinoAgendado('2027-01-10', false, '2027-01-09'), 'agendado')
})
