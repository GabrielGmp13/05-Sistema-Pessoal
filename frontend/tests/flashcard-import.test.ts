import assert from 'node:assert/strict'
import test from 'node:test'
import { analisarFlashcards } from '../lib/flashcard-import.ts'

test('lê CSV com campos entre aspas e vírgula no conteúdo', () => {
  const texto = 'pergunta,resposta,modulo\n"O que é RLS?","Política, por linha",programacao'
  assert.deepEqual(analisarFlashcards(texto, Buffer.byteLength(texto)), [{ pergunta: 'O que é RLS?', resposta: 'Política, por linha', modulo: 'programacao' }])
})

test('detecta TSV e normaliza cabeçalho com acento', () => {
  const texto = 'pergunta\tresposta\tmódulo\nCapital de PE?\tRecife\tgeografia'
  assert.deepEqual(analisarFlashcards(texto, Buffer.byteLength(texto))[0], { pergunta: 'Capital de PE?', resposta: 'Recife', modulo: 'geografia' })
})

test('rejeita aspas abertas e arquivo acima do limite', () => {
  assert.throws(() => analisarFlashcards('pergunta,resposta\n"aberta,valor', 32))
  assert.throws(() => analisarFlashcards('pergunta,resposta\na,b', 1024 * 1024 + 1))
})
