import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resultadoSimulado, mediaAvaliacoes } from '../lib/avaliacoes-calculo.ts'

test('anuladas saem do denominador; nenhuma válida não equivale a nota zero', () => {
  assert.deepEqual(resultadoSimulado(10, 4, 2), { validas: 8, percentual: 50 })
  assert.deepEqual(resultadoSimulado(5, 0, 5), { validas: 0, percentual: null })
  assert.deepEqual(resultadoSimulado(0, 0, 0), { validas: 0, percentual: null })
  assert.throws(() => resultadoSimulado(10, 9, 2))
  assert.throws(() => resultadoSimulado(10, 1, -1))
})

test('média normaliza escalas e exclui pendentes sem excluir zero', () => {
  assert.deepEqual(mediaAvaliacoes([
    { nota: 8, nota_maxima: 10, peso: 2 }, { nota: 40, nota_maxima: 100, peso: 1 },
    { nota: null, nota_maxima: 10, peso: 10 },
  ]), { percentual: 200 / 3, avaliadas: 2, pendentes: 1 })
  assert.equal(mediaAvaliacoes([{ nota: 0, nota_maxima: 10, peso: 1 }]).percentual, 0)
  assert.equal(mediaAvaliacoes([{ nota: null, nota_maxima: 10, peso: 1 }]).percentual, null)
})
