import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { diagnosticCode, diagnosticSummary, logDiagnostic } from '../lib/safe-diagnostics.ts'

test('diagnóstico não repassa mensagens, URLs, chaves ou linhas do banco', () => {
  const error = { message: 'dado pessoal', details: 'linha privada', hint: 'URL privada', token: 'segredo fictício', code: '42501', status: 403 }
  assert.deepEqual(diagnosticSummary(error), { code: '42501', status: 403 })
  assert.equal(diagnosticCode({ code: 'Bearer segredo-ficticio' }), null)
  assert.deepEqual(diagnosticSummary(null), { code: null, status: null })
  assert.equal(diagnosticSummary({ status: '403' }).status, null)
  assert.equal(diagnosticSummary({ status: 200 }).status, null)
  assert.equal(diagnosticCode({ code: 'PGRST205' }), 'PGRST205')
  assert.equal(diagnosticCode({ code: 'SERVER_KEY_TYPE_INVALID' }), 'SERVER_KEY_TYPE_INVALID')
})

test('logger elimina paths e UUIDs de contextos legados', (t) => {
  const logger = t.mock.method(console, 'error', () => {})
  logDiagnostic('getSignedUrl(documentos, usuario/arquivo.pdf)', { code: '42501', message: 'segredo' })
  assert.deepEqual(logger.mock.calls[0].arguments, ['[getSignedUrl] Falha na operação.', { code: '42501', status: null }])
})

test('Biblioteca, Treino, Shape e componentes globais usam apenas o registrador sanitizado', () => {
  const arquivos = [
    '../app/api/biblioteca/metadados/route.ts',
    '../app/treino/shape/page.tsx',
    '../components/CalendarAutoSync.tsx',
    '../components/GlobalNav.tsx',
    '../components/RightRail.tsx',
    '../lib/execucoes.ts',
    '../lib/generos.ts',
    '../lib/modulos-treinos.ts',
    '../lib/treino.ts',
  ]

  for (const arquivo of arquivos) {
    const source = readFileSync(new URL(arquivo, import.meta.url), 'utf8')
    assert.match(source, /logDiagnostic/)
    assert.doesNotMatch(source, /console\.(?:error|warn|log)/)
  }
})
