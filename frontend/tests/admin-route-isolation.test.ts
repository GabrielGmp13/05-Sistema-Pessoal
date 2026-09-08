import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

function routeFiles(directory = new URL('../app/api/', import.meta.url)): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    if (entry.isDirectory()) return routeFiles(child)
    return entry.name === 'route.ts'
      ? [decodeURIComponent(child.pathname).replaceAll('\\', '/')]
      : []
  })
}

const apiRoot = decodeURIComponent(new URL('../', import.meta.url).pathname).replaceAll('\\', '/')
const apiRoutes = routeFiles().map((path) => path.slice(apiRoot.length))
const serviceRoutes = apiRoutes.filter((path) => source(path).includes('getServiceSupabase'))

test('toda API com chave administrativa autentica antes de criar o cliente privilegiado', () => {
  for (const path of serviceRoutes) {
    const code = source(path)
    const auth = code.indexOf('await getApiUser()')
    const admin = code.indexOf('getServiceSupabase()')
    assert.ok(auth >= 0, `${path} precisa autenticar a sessão`)
    assert.ok(admin > auth, `${path} não pode criar cliente privilegiado antes da autenticação`)
    assert.match(code, /user\.id/, `${path} precisa derivar o escopo da sessão autenticada`)
  }
})

test('toda rota de integração Google autentica e usa o usuário da sessão', () => {
  for (const path of apiRoutes.filter((candidate) => candidate.startsWith('app/api/integracoes/google/'))) {
    const code = source(path)
    assert.match(code, /await getApiUser\(\)/, `${path} precisa autenticar a sessão`)
    assert.match(code, /user\.id/, `${path} precisa isolar credenciais e dados por usuário`)
  }
})

test('suporte aplica escopo próprio também nos relacionamentos e no limite de anexos', () => {
  const list = source('app/api/suporte/route.ts')
  assert.match(list, /\.eq\('user_id', user\.id\)/)
  assert.match(list, /\.eq\('chamados_suporte_historico\.user_id', user\.id\)/)
  assert.match(list, /\.eq\('chamados_suporte_anexos\.user_id', user\.id\)/)

  const upload = source('app/api/suporte/[uuid]/anexos/route.ts')
  const countQuery = upload.match(/admin\.from\('chamados_suporte_anexos'\)[\s\S]*?SUPPORT_MAX_FILES/)?.[0] ?? ''
  assert.match(countQuery, /\.eq\('chamado_suporte_uuid', chamadoUuid\)/)
  assert.match(countQuery, /\.eq\('user_id', user\.id\)/)
})
