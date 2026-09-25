import assert from 'node:assert/strict'
import test from 'node:test'
import { pontosSaude } from '../lib/saude-tendencias.ts'

test('tendência filtra período, ordena e não inventa dados nos dias ausentes', () => {
  const itens = [{ data: '2026-09-16', n: 0 }, { data: '2026-09-14', n: 8 }, { data: '2026-08-14', n: 5 }, { data: '2026-09-15', n: null }, { data: '2026-09-17', n: 9 }]
  assert.deepEqual(pontosSaude(itens, (item) => item.n, '2026-09-14', '2026-09-16'), [{ label: '14/09/2026', valor: 8 }, { label: '16/09/2026', valor: 0 }])
  assert.equal(itens[0].data, '2026-09-16')
})
