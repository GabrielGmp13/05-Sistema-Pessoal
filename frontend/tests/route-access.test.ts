import assert from 'node:assert/strict'
import test from 'node:test'
import { loginDestination, unauthenticatedAction } from '../lib/route-access.ts'

test('somente rotas de autenticação são públicas; APIs retornam 401 em vez de HTML', () => {
  for (const path of ['/login', '/recuperar-senha', '/nova-senha', '/auth/confirm', '/auth/erro', '/ajuda', '/privacidade']) {
    assert.equal(unauthenticatedAction(path), 'allow', path)
  }
  for (const path of ['/', '/biblioteca', '/configuracoes', '/login-admin', '/login/segredo', '/api-falso']) {
    assert.equal(unauthenticatedAction(path), 'login', path)
  }
  for (const path of ['/api', '/api/biblioteca/metadados', '/api/integracoes/google/status']) {
    assert.equal(unauthenticatedAction(path), 'json-401', path)
  }
})

test('redirecionamento não preserva queries ou fragmentos privados', () => {
  const destination = loginDestination('https://example.invalid/agenda?code=privado&state=privado#detalhe')
  assert.equal(destination.href, 'https://example.invalid/login')
})
