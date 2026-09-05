import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import type { NextRequest, NextResponse } from 'next/server'
import * as routeAccess from '../lib/route-access.ts'

const require = createRequire(import.meta.url)
const next = require('next/server') as typeof import('next/server')
const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText

function proxyWithUser(authenticated: boolean) {
  const exports: { proxy?: (request: NextRequest) => Promise<NextResponse> } = {}
  runInNewContext(compiled, {
    exports,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-value' } },
    require: (name: string) => {
      if (name === 'next/server') return next
      if (name === './lib/route-access') return routeAccess
      if (name === '@supabase/ssr') return {
        createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: object[]) => void } }) => ({
          auth: { getUser: async () => {
            options.cookies.setAll([{ name: 'test-session', value: '', options: { path: '/', maxAge: 0, httpOnly: true } }])
            return { data: { user: authenticated ? { id: 'test-user' } : null } }
          } },
        }),
      }
      throw new Error(`Import inesperado no proxy: ${name}`)
    },
  })
  assert.ok(exports.proxy)
  return exports.proxy
}

test('proxy real retorna JSON 401 sem query/redirect e preserva cookies de Auth', async () => {
  const response = await proxyWithUser(false)(new next.NextRequest('https://example.invalid/api/integracoes/google/status?code=ficticio'))
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { erro: 'Não autenticado.' })
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.match(response.headers.get('set-cookie') ?? '', /test-session=;.*Max-Age=0/)
})

test('proxy real redireciona páginas sem transportar parâmetros privados', async () => {
  const response = await proxyWithUser(false)(new next.NextRequest('https://example.invalid/biblioteca?busca=ficticia'))
  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), 'https://example.invalid/login')
  assert.ok(response.headers.has('set-cookie'))
})

test('proxy permite login e usuário autenticado, mas não prefixo semelhante ao login', async () => {
  const publicResponse = await proxyWithUser(false)(new next.NextRequest('https://example.invalid/login'))
  assert.equal(publicResponse.status, 200)
  const privateResponse = await proxyWithUser(true)(new next.NextRequest('https://example.invalid/configuracoes'))
  assert.equal(privateResponse.status, 200)
  const similarResponse = await proxyWithUser(false)(new next.NextRequest('https://example.invalid/login-admin'))
  assert.equal(similarResponse.status, 307)
})
