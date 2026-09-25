import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { rotuloAcademico } from '../lib/contexto-academico.ts'

test('contexto usa lista permitida e não aceita rótulo arbitrário do perfil', () => {
  assert.equal(rotuloAcademico('Faculdade'), 'Faculdade')
  for (const valor of [undefined, null, {}, 'outro', '<script>', 'Escola']) assert.equal(rotuloAcademico(valor), 'Escola')
})

test('seed não ressuscita matérias removidas ou renomeadas e grava lote idempotente', () => {
  const fonte = readFileSync(new URL('../lib/materias.ts', import.meta.url), 'utf8')
  const trecho = fonte.slice(fonte.indexOf('export async function seedMateriasEnemEscolaSeNecessario'))
  assert.match(trecho, /if \(data\?\.length\) return/)
  assert.doesNotMatch(trecho, /\.eq\('deleted', false\)/)
  assert.match(trecho, /ignoreDuplicates: true/)
  assert.match(trecho, /academica-inicial:\$\{userId\}/)
})

test('retirar contexto não apaga matéria, ENEM nem vínculos', () => {
  const fonte = readFileSync(new URL('../app/estudos/escola/GerenciarMaterias.tsx', import.meta.url), 'utf8')
  assert.match(fonte, /mostra_escola: false/)
  assert.match(fonte, /mostra_escola: true/)
  assert.doesNotMatch(fonte, /deletarMateria|softDelete|mostra_enem: false/)
  assert.match(fonte, /<ConfirmDialog/)
})

test('gravação acadêmica incerta bloqueia reenvio até conferir estado persistido', () => {
  const fonte = readFileSync(new URL('../app/estudos/escola/GerenciarMaterias.tsx', import.meta.url), 'utf8')
  assert.match(fonte, /trava.current \|\| precisaRecarregar/)
  assert.match(fonte, /if \(!await acao\(\)\) throw/)
  assert.match(fonte, /setPrecisaRecarregar\(true\)/)
  assert.match(fonte, /await recarregar\(\)\s+setPrecisaRecarregar\(false\)/)
  assert.match(fonte, /Atualizar dados/)
  assert.doesNotMatch(fonte, /Seus dados foram preservados/)
})
