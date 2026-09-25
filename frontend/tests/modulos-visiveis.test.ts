import assert from 'node:assert/strict'
import test from 'node:test'
import { MODULOS_OPCIONAIS, normalizarModulosOcultos } from '../lib/modulos-visiveis.ts'
import { MODULOS_PAUSADOS, moduloPausadoDaRota, moduloPausadoPorSlug } from '../lib/modulos-pausados.ts'

test('visibilidade aceita somente atalhos conhecidos sem ocultar início ou configurações', () => {
  assert.deepEqual(normalizarModulosOcultos(undefined), [])
  assert.deepEqual(normalizarModulosOcultos('/treino'), [])
  assert.deepEqual(normalizarModulosOcultos(['/treino', '/treino', '/', '/configuracoes', 'javascript:x', null]), ['/treino'])
  assert.equal(normalizarModulosOcultos(MODULOS_OPCIONAIS.map((item) => item.rota)).length, MODULOS_OPCIONAIS.length)
})

test('pausa V2.1 cobre apenas os cômodos autorizados e inclui todos os caminhos do Diário', () => {
  assert.deepEqual(MODULOS_PAUSADOS.map((item) => item.slug), ['idiomas', 'projetos', 'programacao', 'diario'])
  assert.equal(moduloPausadoDaRota('/financas')?.slug, 'diario')
  assert.equal(moduloPausadoDaRota('/saude/medidas')?.slug, 'diario')
  assert.equal(moduloPausadoDaRota('/receitas')?.slug, 'diario')
  assert.equal(moduloPausadoDaRota('/estudos'), null)
  assert.equal(moduloPausadoPorSlug('programacao')?.nome, 'Programação')
  assert.equal(moduloPausadoPorSlug('desconhecido'), null)
})
