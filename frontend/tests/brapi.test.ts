import assert from 'node:assert/strict'
import test from 'node:test'
import { extrairCotacaoBrapi, normalizarTickerBrapi } from '../lib/brapi.ts'

test('normaliza ticker e rejeita caracteres inseguros', () => {
  assert.equal(normalizarTickerBrapi(' petr4 '), 'PETR4')
  assert.equal(normalizarTickerBrapi('AAPL34.SA'), 'AAPL34.SA')
  assert.equal(normalizarTickerBrapi('../segredo'), null)
})

test('extrai cotação com defaults seguros', () => {
  assert.deepEqual(extrairCotacaoBrapi({ results: [{ symbol: 'PETR4', regularMarketPrice: 31.25 }] }), {
    ticker: 'PETR4', nome: 'PETR4', moeda: 'BRL', preco: 31.25, variacao_percentual: null,
  })
  assert.equal(extrairCotacaoBrapi({ results: [] }), null)
})
