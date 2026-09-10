import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')

test('cabeçalhos globais bloqueiam execução e enquadramento não autorizados', () => {
  assert.match(source, /Content-Security-Policy/)
  assert.match(source, /default-src 'self'/)
  assert.match(source, /frame-ancestors 'none'/)
  assert.match(source, /object-src 'none'/)
  assert.match(source, /base-uri 'self'/)
  assert.match(source, /form-action 'self'/)
  assert.match(source, /X-Frame-Options.*DENY/)
  assert.match(source, /X-Content-Type-Options.*nosniff/)
})

test('CSP permite CAPTCHA sem liberar eval na produção', async () => {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  for (const env of ['production', 'development']) {
    const exports: { default?: { headers: () => Promise<Array<{ headers: Array<{ key: string; value: string }> }>> } } = {}
    runInNewContext(compiled, { exports, process: { env: { NODE_ENV: env } } })
    assert.ok(exports.default)
    const [route] = await exports.default.headers()
    const csp = route.headers.find(({ key }) => key === 'Content-Security-Policy')?.value
    assert.ok(csp)
    const directives = csp.split('; ').map((directive) => directive.split(' '))
    for (const name of ['script-src', 'frame-src']) {
      const directive = directives.find(([key]) => key === name)
      assert.ok(directive, name)
      assert.ok(directive.includes('https://challenges.cloudflare.com'), name)
      assert.ok(!directive.includes('*'))
    }
    assert.equal(csp.includes("'unsafe-eval'"), env === 'development')
  }
})
