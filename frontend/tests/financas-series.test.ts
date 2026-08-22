import assert from 'node:assert/strict'
import test from 'node:test'
import { gerarSerieLancamentos } from '../lib/financas-series.ts'

test('parcelamento distribui centavos e preserva o total', () => {
  const parcelas = gerarSerieLancamentos({ valor: 100, data: '2026-01-31', descricao: 'Notebook', modo: 'parcelado', quantidade: 3 })
  assert.deepEqual(parcelas.map((item) => item.valor), [33.34, 33.33, 33.33])
  assert.deepEqual(parcelas.map((item) => item.data), ['2026-01-31', '2026-02-28', '2026-03-31'])
  assert.equal(parcelas.reduce((total, item) => total + item.valor, 0), 100)
  assert.equal(parcelas[2].descricao, 'Notebook (3/3)')
})

test('recorrência mensal é finita e mantém o valor de cada mês', () => {
  const serie = gerarSerieLancamentos({ valor: 1250, data: '2026-08-10', descricao: 'Aluguel', modo: 'recorrente', quantidade: 12 })
  assert.equal(serie.length, 12)
  assert.equal(serie[11].data, '2027-07-10')
  assert.equal(serie[11].valor, 1250)
  assert.equal(serie[11].descricao, 'Aluguel (12/12)')
})

test('rejeita série sem limite finito válido', () => {
  assert.throws(() => gerarSerieLancamentos({ valor: 1, data: '2026-08-10', descricao: null, modo: 'recorrente', quantidade: 121 }))
})
