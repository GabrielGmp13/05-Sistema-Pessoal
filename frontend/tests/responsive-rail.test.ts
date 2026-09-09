import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const raiz = process.cwd()
const globalNav = readFileSync(join(raiz, 'components', 'GlobalNav.tsx'), 'utf8')
const rightRailCss = readFileSync(join(raiz, 'components', 'RightRail.module.css'), 'utf8')

test('menu compacto controla a coluna pessoal completa', () => {
  assert.match(globalNav, /aria-controls="painel-lateral-pessoal"/)
  assert.match(globalNav, /Abrir coluna pessoal/)
  assert.match(rightRailCss, /\.railMovelAberto/)
})

test('navegação compacta não executa a transformação longa da Biblioteca', () => {
  const desvioCompacto = globalNav.indexOf("matchMedia('(max-width: 1023px)')")
  const transicaoBiblioteca = globalNav.indexOf("const entrando = !biblioteca && destino === '/biblioteca'")

  assert.ok(desvioCompacto >= 0)
  assert.ok(transicaoBiblioteca > desvioCompacto)
})
