import assert from 'node:assert/strict'
import test from 'node:test'
import { hasValidImageSignature, parseSupportInput } from '../lib/support.ts'

test('normaliza relato e descarta campos desconhecidos', () => {
  assert.deepEqual(parseSupportInput({ tipo: 'bug', titulo: '  Falha real  ', descricao: '  Algo deixou de funcionar  ', status: 'resolvido' }), {
    tipo: 'bug', titulo: 'Falha real', descricao: 'Algo deixou de funcionar', modulo: undefined,
    esperado: undefined, passos: undefined, ambiente: undefined, tema: undefined, versao: undefined,
  })
})

test('rejeita tipo, título e descrição inválidos', () => {
  assert.throws(() => parseSupportInput({ tipo: 'admin', titulo: 'Título', descricao: 'Descrição válida' }))
  assert.throws(() => parseSupportInput({ tipo: 'sugestao', titulo: 'Oi', descricao: 'Descrição válida' }))
  assert.throws(() => parseSupportInput({ tipo: 'bug', titulo: 'Título', descricao: 'curto' }))
})

test('limita texto antes de persistir', () => {
  const parsed = parseSupportInput({ tipo: 'sugestao', titulo: 'T'.repeat(200), descricao: 'D'.repeat(5000) })
  assert.equal(parsed.titulo.length, 120)
  assert.equal(parsed.descricao.length, 4000)
})

test('confere assinatura real das imagens em vez de confiar apenas no MIME', () => {
  assert.equal(hasValidImageSignature(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'), true)
  assert.equal(hasValidImageSignature(Uint8Array.from([60, 115, 99, 114, 105, 112, 116, 62]), 'image/png'), false)
  assert.equal(hasValidImageSignature(Uint8Array.from([255, 216, 255]), 'image/jpeg'), true)
  assert.equal(hasValidImageSignature(Uint8Array.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]), 'image/webp'), true)
})
