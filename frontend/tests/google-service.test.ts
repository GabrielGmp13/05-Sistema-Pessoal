import assert from 'node:assert/strict'
import test from 'node:test'

import { googleScopes, parseGoogleService } from '../lib/google-service.ts'

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
