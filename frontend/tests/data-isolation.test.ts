import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { isUserOwnedStoragePath } from '../lib/data-isolation.ts'

test('Storage aceita somente caminhos dentro da pasta do usuário atual', () => {
  assert.equal(isUserOwnedStoragePath('usuario-a/arquivo.webp', 'usuario-a'), true)
  assert.equal(isUserOwnedStoragePath('usuario-b/arquivo.webp', 'usuario-a'), false)
  assert.equal(isUserOwnedStoragePath('usuario-a', 'usuario-a'), false)
  assert.equal(isUserOwnedStoragePath('usuario-a//arquivo.webp', 'usuario-a'), false)
  assert.equal(isUserOwnedStoragePath('../usuario-a/arquivo.webp', 'usuario-a'), false)
})

test('exclusão lógica compartilhada repete o escopo do usuário e ignora linhas já apagadas', () => {
  const source = readFileSync(new URL('../lib/supabase.ts', import.meta.url), 'utf8')
  const softDelete = source.match(/export async function softDelete[\s\S]*?\n}/)?.[0] ?? ''
  assert.match(softDelete, /await getUserId\(\)/)
  assert.match(softDelete, /\.eq\('uuid', uuid\)/)
  assert.match(softDelete, /\.eq\('user_id', userId\)/)
  assert.match(softDelete, /\.eq\('deleted', false\)/)
})
