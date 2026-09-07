import assert from 'node:assert/strict'
import test from 'node:test'

import { DELETE_CONFIRMATION, parsePrivacyRequest } from '../lib/privacy-request.ts'

test('aceita pedido de cópia sem frase destrutiva', () => {
  assert.equal(parsePrivacyRequest({ tipo: 'copia' }), 'copia')
})

test('exclusão exige a frase exata e rejeita tipos desconhecidos', () => {
  assert.throws(() => parsePrivacyRequest({ tipo: 'exclusao', confirmacao: 'excluir' }))
  assert.equal(parsePrivacyRequest({ tipo: 'exclusao', confirmacao: DELETE_CONFIRMATION }), 'exclusao')
  assert.throws(() => parsePrivacyRequest({ tipo: 'baixar tudo' }))
})
