import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularPagina } from '../lib/leitura-progresso.ts'

test('leitura permite somar páginas ou corrigir posição absoluta', () => {
  assert.equal(calcularPagina(40, 20, 'adicionar', 200), 60)
  assert.equal(calcularPagina(40, 122, 'definir', 200), 122)
  assert.equal(calcularPagina(40, 12, 'definir', null), 12)
})
test('leitura recusa valores fracionários, negativos e acima do total', () => {
  for (const valor of [NaN, Infinity, -1, 1.5, 201]) assert.throws(() => calcularPagina(40, valor, 'definir', 200))
  assert.throws(() => calcularPagina(199, 2, 'adicionar', 200))
  assert.equal(calcularPagina(199, 1, 'adicionar', 200), 200)
})
