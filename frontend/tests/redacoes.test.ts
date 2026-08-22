import assert from 'node:assert/strict'
import test from 'node:test'
import { competenciaEnemValida, NOTAS_COMPETENCIA_ENEM } from '../lib/redacoes-validacao.ts'

test('aceita somente os passos reais de 40 pontos do ENEM', () => {
  assert.deepEqual(NOTAS_COMPETENCIA_ENEM, [0, 40, 80, 120, 160, 200])
  for (const nota of NOTAS_COMPETENCIA_ENEM) assert.equal(competenciaEnemValida(nota), true)
  for (const nota of [-40, 20, 201, 1000]) assert.equal(competenciaEnemValida(nota), false)
  assert.equal(competenciaEnemValida(''), true)
})
