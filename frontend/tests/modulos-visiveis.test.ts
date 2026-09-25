import assert from 'node:assert/strict'
import test from 'node:test'
import { MODULOS_OPCIONAIS, normalizarModulosOcultos } from '../lib/modulos-visiveis.ts'

test('visibilidade aceita somente atalhos conhecidos sem ocultar início ou configurações', () => {
  assert.deepEqual(normalizarModulosOcultos(undefined), [])
  assert.deepEqual(normalizarModulosOcultos('/treino'), [])
  assert.deepEqual(normalizarModulosOcultos(['/treino', '/treino', '/', '/configuracoes', 'javascript:x', null]), ['/treino'])
  assert.equal(normalizarModulosOcultos(MODULOS_OPCIONAIS.map((item) => item.rota)).length, MODULOS_OPCIONAIS.length)
})
