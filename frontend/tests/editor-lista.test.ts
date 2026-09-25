import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { validarCamposLista } from '../lib/editor-lista.ts'

test('resultado incerto exige recarregar a lista antes de permitir reenvio', () => {
  const source = readFileSync(new URL('../components/EditorListaTextual.tsx', import.meta.url), 'utf8')
  assert.match(source, /if \(!await operacao\(\)\) \{ setListaPronta\(false\)/)
  assert.match(source, /if \(emOperacao\.current \|\| !listaPronta\) return/)
})

test('editor diferencia ausência, zero e valor obrigatório', () => {
  assert.ok(validarCamposLista([{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }], { nome: '  ' }))
  const campos = [{ chave: 'nota', rotulo: 'Nota', numero: true, min: 0, max: 5, passo: 0.5 }]
  for (const nota of ['', '0', '4.5', '5']) assert.equal(validarCamposLista(campos, { nota }), null)
  for (const nota of ['-1', '5.5', '1.2', 'Infinity', 'abc']) assert.ok(validarCamposLista(campos, { nota }))
})

test('editor rejeita protocolos executáveis e aceita remoção de URL opcional', () => {
  const campos = [{ chave: 'link', rotulo: 'Link', url: true }]
  for (const link of ['', 'https://example.org/a', 'http://example.org']) assert.equal(validarCamposLista(campos, { link }), null)
  for (const link of ['javascript:alert(1)', 'data:text/html,x', '//example.org', 'inválido']) assert.ok(validarCamposLista(campos, { link }))
})

test('editor valida números inteiros e limite de texto', () => {
  const campos = [{ chave: 'numero', rotulo: 'Número', numero: true, obrigatorio: true, min: 1, max: 2147483647, passo: 1 }]
  for (const numero of ['0', '2.2', '2147483648', 'NaN']) assert.ok(validarCamposLista(campos, { numero }))
  assert.equal(validarCamposLista(campos, { numero: '2' }), null)
  assert.ok(validarCamposLista([{ chave: 'nome', rotulo: 'Nome' }], { nome: 'a'.repeat(2001) }))
})
