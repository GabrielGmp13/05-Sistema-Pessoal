import assert from 'node:assert/strict'
import test from 'node:test'
import { dadosEdicaoTemporada, validarEdicaoTemporada, valoresEdicaoTemporada } from '../lib/temporada-edicao.ts'

test('edição faz roundtrip de metadados sem alterar identidade ou progresso', () => {
  const valores = valoresEdicaoTemporada({ uuid: 'original', anime_uuid: 'pai', anilist_id: '123', numero: 2, numero_episodios: 0, diretor: 'Teste', minha_nota: 4 })
  assert.equal(validarEdicaoTemporada(valores), null)
  const dados = dadosEdicaoTemporada(valores) as Record<string, unknown>
  assert.equal(dados.numero, 2)
  assert.equal(dados.numero_episodios, 0)
  assert.equal(dados.diretor, 'Teste')
  for (const chave of ['uuid', 'anime_uuid', 'anilist_id', 'minha_nota']) assert.equal(chave in dados, false)
  assert.equal(dados.sinopse, null)
})

test('edição rejeita período invertido, data inexistente e URL executável', () => {
  assert.ok(validarEdicaoTemporada({ numero: '1', ano_lancamento: '2025', ano_termino: '2024' }))
  assert.ok(validarEdicaoTemporada({ numero: '1', data_assisti: '2026-02-30' }))
  assert.ok(validarEdicaoTemporada({ numero: '1', capa_url: 'javascript:alert(1)' }))
  assert.equal(validarEdicaoTemporada({ numero: '1', data_assisti: '2024-02-29' }), null)
})
