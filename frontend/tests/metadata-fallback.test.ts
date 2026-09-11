import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { firstNonempty } from '../lib/first-nonempty.ts'

const source = readFileSync(new URL('../app/api/biblioteca/metadados/route.ts', import.meta.url), 'utf8')

test('Anime e Mangá têm Kitsu como fonte paralela quando AniList ou Jikan oscilarem', () => {
  assert.match(source, /return firstNonempty\(/)
  assert.match(source, /\(\) => buscarKitsu\(q, manga\)/)
  assert.match(source, /\(\) => buscarJikanDireto\(q, manga\)/)
  assert.match(source, /async function buscarKitsu\(q: string, manga: boolean\)/)
  assert.match(source, /https:\/\/kitsu\.io\/api\/edge\/\$\{tipo\}\?\$\{params\}/)
})

test('fonte rápida responde sem esperar fonte travada ou vazia', async () => {
  const items = await firstNonempty([() => new Promise<string[]>(() => {}), async () => [], async () => ['Kitsu']])
  assert.deepEqual(items, ['Kitsu'])
})

test('falha de todas as fontes permite cadastro manual sem rejeição não tratada', async () => {
  assert.deepEqual(await firstNonempty([async () => { throw new Error('offline') }, async () => []]), [])
})
