import assert from 'node:assert/strict'
import test from 'node:test'
import { blocosRelogioProva } from '../lib/relogio-prova.ts'

test('relógio acompanha o prazo existente sem arredondar conclusão antes da hora', () => {
  assert.equal(blocosRelogioProva(330, 330 * 60).length, 11)
  assert.equal(blocosRelogioProva(300, 300 * 60).length, 10)
  assert.equal(blocosRelogioProva(60, 1801)[0].concluido, false)
  assert.equal(blocosRelogioProva(60, 1800)[0].concluido, true)
  assert.equal(blocosRelogioProva(60, 1800)[1].atual, true)
  assert.ok(blocosRelogioProva(45, 0).every((bloco) => bloco.concluido && !bloco.atual))
  assert.equal(blocosRelogioProva(45, 0)[1].fim, 45)
  assert.deepEqual(blocosRelogioProva(Infinity, 0), [])
})
