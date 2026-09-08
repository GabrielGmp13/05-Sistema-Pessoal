import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const treino = readFileSync(new URL('../lib/treino.ts', import.meta.url), 'utf8')
const execucoes = readFileSync(new URL('../lib/execucoes.ts', import.meta.url), 'utf8')
const planoModulo = readFileSync(new URL('../app/treino/[moduloUuid]/page.tsx', import.meta.url), 'utf8')
const planoTreino = readFileSync(new URL('../app/treino/[moduloUuid]/[treinoUuid]/page.tsx', import.meta.url), 'utf8')
const academia = readFileSync(new URL('../app/treino/[moduloUuid]/[treinoUuid]/academia/page.tsx', import.meta.url), 'utf8')

test('rotas dinâmicas de treino validam o proprietário antes de liberar formulários', () => {
  assert.match(planoModulo, /usuarioPossuiModuloTreino/)
  assert.match(planoModulo, /if \(!permitido\)/)
  assert.match(planoTreino, /usuarioPossuiTreino/)
  assert.match(planoTreino, /if \(!permitido\) return/)
  assert.match(academia, /usuarioPossuiTreino/)
  assert.match(academia, /if \(!permitido\) return/)
})
test('alterações e exclusões de treino repetem o escopo do usuário', () => {
  for (const nome of ['atualizarTreino', 'softDeleteTreino', 'softDeleteExercicioForca', 'softDeleteExercicioCardio']) {
    const funcao = treino.match(new RegExp(`export async function ${nome}[\\s\\S]*?\\n}`))?.[0] ?? ''
    assert.match(funcao, /\.eq\('user_id', userId\)/, nome)
  }
  const finalizar = execucoes.match(/export async function finalizarSessao[\s\S]*?\n}/)?.[0] ?? ''
  assert.match(finalizar, /\.eq\('user_id', userId\)/)
  assert.match(finalizar, /\.eq\('deleted', false\)/)
})
