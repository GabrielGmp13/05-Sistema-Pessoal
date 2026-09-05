import assert from 'node:assert/strict'
import test from 'node:test'

import { googleRefreshToken, googleScopes, matchesGoogleOAuthContext, parseGoogleService } from '../lib/google-service.ts'

test('aceita somente os dois serviços Google suportados', () => {
  assert.equal(parseGoogleService('youtube'), 'youtube')
  assert.equal(parseGoogleService('calendar'), 'calendar')
  assert.equal(parseGoogleService('photos'), null)
  assert.equal(parseGoogleService(null), null)
})

test('cada serviço solicita apenas seu escopo funcional', () => {
  const youtube = googleScopes('youtube')
  const calendar = googleScopes('calendar')
  assert.ok(youtube.includes('https://www.googleapis.com/auth/youtube.readonly'))
  assert.ok(!youtube.includes('https://www.googleapis.com/auth/calendar.events'))
  assert.ok(calendar.includes('https://www.googleapis.com/auth/calendar.events'))
  assert.ok(!calendar.includes('https://www.googleapis.com/auth/youtube.readonly'))
})

test('OAuth só retorna ao mesmo usuário e estado que iniciaram a autorização', () => {
  assert.ok(matchesGoogleOAuthContext('usuario-a', 'usuario-a', 'estado-a', 'estado-a'))
  assert.ok(!matchesGoogleOAuthContext('usuario-a', 'usuario-b', 'estado-a', 'estado-a'))
  assert.ok(!matchesGoogleOAuthContext(undefined, 'usuario-a', 'estado-a', 'estado-a'))
  assert.ok(!matchesGoogleOAuthContext('usuario-a', 'usuario-a', undefined, null))
  assert.ok(!matchesGoogleOAuthContext('usuario-a', 'usuario-a', 'estado-a', 'estado-b'))
})

test('troca de conta não herda refresh token de outra conta Google', () => {
  assert.equal(googleRefreshToken('novo-token-ficticio', 'antigo', 'a@example.invalid', 'b@example.invalid'), 'novo-token-ficticio')
  assert.equal(googleRefreshToken(undefined, 'antigo', 'A@example.invalid', 'a@example.invalid'), 'antigo')
  assert.throws(() => googleRefreshToken(undefined, 'antigo', 'a@example.invalid', 'b@example.invalid'), /permanente/)
  assert.throws(() => googleRefreshToken(undefined, 'antigo', null, 'b@example.invalid'), /permanente/)
  assert.throws(() => googleRefreshToken(undefined, null, null, 'b@example.invalid'), /permanente/)
})
