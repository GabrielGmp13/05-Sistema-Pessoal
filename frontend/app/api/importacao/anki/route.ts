import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { unzipSync } from 'fflate'
import { NextRequest, NextResponse } from 'next/server'
import initSqlJs from 'sql.js'

import { camposParaCardAnki } from '@/lib/anki-import'
import { getApiUser } from '@/lib/server/supabase'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_APKG_BYTES = 25 * 1024 * 1024
const MAX_DATABASE_BYTES = 60 * 1024 * 1024
const MAX_CARDS = 500

interface CollectionMetadata {
  decks?: string
  models?: string
}

function namesFromJson(value?: string) {
  if (!value) return new Map<string, string>()
  try {
    const parsed = JSON.parse(value) as Record<string, { name?: string }>
    return new Map(Object.entries(parsed).map(([id, item]) => [id, item.name || id]))
  } catch {
    return new Map<string, string>()
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  const form = await request.formData().catch(() => null)
  const file = form?.get('arquivo')
  const selectedDeck = form?.get('deckId')
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.apkg')) {
    return NextResponse.json({ erro: 'Selecione um arquivo .apkg.' }, { status: 400 })
  }
  if (file.size > MAX_APKG_BYTES) return NextResponse.json({ erro: 'O .apkg deve ter no máximo 25 MB.' }, { status: 413 })

  try {
    const archive = new Uint8Array(await file.arrayBuffer())
    let collectionSelected = false
    const extracted = unzipSync(archive, {
      filter: (entry) => {
        if (!/^collection\.anki(?:2|21|21b)$/i.test(entry.name) || collectionSelected) return false
        if (entry.originalSize > MAX_DATABASE_BYTES) throw new Error('A coleção descompactada excede 60 MB.')
        collectionSelected = true
        return true
      },
    })
    const database = Object.entries(extracted).find(([name]) => /^collection\.anki(?:2|21|21b)$/i.test(name))?.[1]
    if (!database) throw new Error('O pacote não contém uma coleção Anki reconhecida.')
    if (database.byteLength > MAX_DATABASE_BYTES) throw new Error('A coleção descompactada excede 60 MB.')

    const wasmFile = await readFile(path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'))
    const wasmBinary = wasmFile.buffer.slice(wasmFile.byteOffset, wasmFile.byteOffset + wasmFile.byteLength) as ArrayBuffer
    const SQL = await initSqlJs({ wasmBinary })
    const db = new SQL.Database(database)
    try {
      const metadataResult = db.exec('SELECT decks, models FROM col LIMIT 1')
      const metadataRow = metadataResult[0]?.values[0] ?? []
      const metadata: CollectionMetadata = {
        decks: typeof metadataRow[0] === 'string' ? metadataRow[0] : undefined,
        models: typeof metadataRow[1] === 'string' ? metadataRow[1] : undefined,
      }
      const deckNames = namesFromJson(metadata.decks)
      const modelNames = namesFromJson(metadata.models)
      const rows = db.exec('SELECT CAST(c.did AS TEXT), CAST(n.mid AS TEXT), n.flds FROM cards c JOIN notes n ON n.id = c.nid ORDER BY c.id')
      const values = rows[0]?.values ?? []
      const counts = new Map<string, number>()
      for (const row of values) {
        const deckId = String(row[0])
        counts.set(deckId, (counts.get(deckId) ?? 0) + 1)
      }
      const decks = [...counts].map(([id, quantidade]) => ({ id, nome: deckNames.get(id) ?? `Deck ${id}`, quantidade })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      const deckFilter = typeof selectedDeck === 'string' && selectedDeck ? selectedDeck : null
      const unique = new Set<string>()
      const cards = values.flatMap((row) => {
        const deckId = String(row[0])
        if (deckFilter && deckId !== deckFilter) return []
        const card = camposParaCardAnki(String(row[2] ?? ''), deckId, deckNames.get(deckId) ?? `Deck ${deckId}`, modelNames.get(String(row[1])) ?? `Modelo ${row[1]}`)
        if (!card) return []
        const key = `${card.pergunta}\u0000${card.resposta ?? ''}`.toLocaleLowerCase('pt-BR')
        if (unique.has(key)) return []
        unique.add(key)
        return [card]
      }).slice(0, deckFilter ? MAX_CARDS : 20)
      return NextResponse.json({ decks, cards, total: deckFilter ? counts.get(deckFilter) ?? 0 : values.length, limite: MAX_CARDS })
    } finally {
      db.close()
    }
  } catch (error) {
    return NextResponse.json({ erro: error instanceof Error ? error.message : 'Não foi possível ler o .apkg.' }, { status: 422 })
  }
}
