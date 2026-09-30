import assert from 'node:assert/strict'
import test from 'node:test'
import { chaveDescricao, restaurarDescricoes } from '../lib/page-descriptions.ts'

test('a descrição é independente por rota e restaurar não apaga outras preferências', () => {
  const valores = new Map<string, string>([
    [chaveDescricao('/estudos/enem'), '1'],
    [chaveDescricao('/estudos/enem/matematica'), '1'],
    ['tema', 'escuro'],
  ])
  const storage = {
    get length() { return valores.size },
    key(indice: number) { return [...valores.keys()][indice] ?? null },
    removeItem(chave: string) { valores.delete(chave) },
  } as Storage

  assert.notEqual(chaveDescricao('/estudos/enem'), chaveDescricao('/estudos/enem/matematica'))
  restaurarDescricoes(storage)
  assert.deepEqual([...valores], [['tema', 'escuro']])
})
