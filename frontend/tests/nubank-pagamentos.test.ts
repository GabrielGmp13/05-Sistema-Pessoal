import test from 'node:test'
import assert from 'node:assert/strict'
import { possivelPagamentoFatura } from '../lib/nubank-import.ts'

test('sugere excluir pagamentos de fatura sem excluir estornos ou compras', () => {
  for (const texto of ['Pagamento da fatura', 'Pagamento recebido', 'Pagamento cartão']) assert.equal(possivelPagamentoFatura(texto), true)
  for (const texto of ['Estorno compra', 'Mercado', 'Pix recebido']) assert.equal(possivelPagamentoFatura(texto), false)
})
