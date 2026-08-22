import assert from 'node:assert/strict'
import test from 'node:test'
import { resumirGabaritoEnem } from '../lib/enem-gabarito.ts'

test('uma prova totalmente em branco não aparece como lançada corretamente', () => {
  const questoes = Array.from({ length: 90 }, (_, indice) => ({ numero: indice + 1, letra_marcada: null, acertou: false }))
  assert.deepEqual(resumirGabaritoEnem(questoes, {}), { respondidas: 0, emBranco: 90, acertos: 0, erros: 90, total: 90 })
})

test('não duplica resposta selecionada de questão já persistida', () => {
  const questoes = [{ numero: 1, letra_marcada: 'A', acertou: true }]
  assert.deepEqual(resumirGabaritoEnem(questoes, { 1: 'B', 2: 'C' }, 3), { respondidas: 2, emBranco: 1, acertos: 1, erros: 0, total: 3 })
})
