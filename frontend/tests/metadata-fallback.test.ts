import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../app/api/biblioteca/metadados/route.ts', import.meta.url), 'utf8')

test('Anime e Mangá têm Kitsu como fonte paralela quando AniList ou Jikan oscilarem', () => {
  assert.match(source, /Promise\.allSettled\(\[buscarAniList\(q, manga\), buscarKitsu\(q, manga\)\]\)/)
  assert.match(source, /async function buscarKitsu\(q: string, manga: boolean\)/)
  assert.match(source, /https:\/\/kitsu\.io\/api\/edge\/\$\{tipo\}\?\$\{params\}/)
  assert.match(source, /return buscarKitsu\(q, manga\)/)
})
