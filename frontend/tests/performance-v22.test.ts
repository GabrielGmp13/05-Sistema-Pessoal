import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const raiz = process.cwd()
const layout = readFileSync(join(raiz, 'app', 'layout.tsx'), 'utf8')
const inicio = readFileSync(join(raiz, 'app', 'page.tsx'), 'utf8')
const navegacao = readFileSync(join(raiz, 'components', 'GlobalNav.tsx'), 'utf8')
const coluna = readFileSync(join(raiz, 'components', 'RightRail.tsx'), 'utf8')
const sessaoGlobal = readFileSync(join(raiz, 'components', 'AppSessionProvider.tsx'), 'utf8')
const tema = readFileSync(join(raiz, 'components', 'ThemeProvider.tsx'), 'utf8')

test('tema usa bootstrap nativo antes da hidratação', () => {
  assert.doesNotMatch(layout, /from 'next\/script'/)
  assert.match(layout, /<script id="tema-anti-flash"/)
  assert.match(layout, /localStorage\.getItem\(chave\)/)
})

test('hidratação não desfaz o tema aplicado pelo bootstrap', () => {
  assert.match(tema, /const \[preferenciasProntas, setPreferenciasProntas\] = useState\(false\)/)
  assert.match(tema, /if \(!preferenciasProntas\) return\s+document\.documentElement\.classList\.toggle/)
  assert.match(tema, /setPreferenciasProntas\(true\)/)
})

test('Início reutiliza resumo temporário por usuário e revalida no Supabase', () => {
  assert.match(inicio, /sistema-pessoal:cache:inicio:\$\{userId\}/)
  assert.match(inicio, /VALIDADE_CACHE_INICIO_MS = 5 \* 60 \* 1000/)
  assert.match(inicio, /const dadosEmCache = forcar \? null : lerCacheInicio\(userId\)/)
  assert.match(inicio, /onClick=\{\(\) => void carregar\(true\)\}/)
  assert.match(sessaoGlobal, /limparCachesDaSessao\(\)/)
})

test('Início não consulta domínios pausados sem reativação', () => {
  assert.doesNotMatch(inicio, /listarHumor|listarLancamentosFinanceiros|listarInvestimentosFinanceiros/)
  assert.doesNotMatch(inicio, /listarLugares|buscarResumoIdiomasHub|listarTodasTarefasProjetos/)
  assert.match(inicio, /carregarProjetos \? listarProjetos\(\) : Promise\.resolve\(\[\]\)/)
  assert.match(inicio, /carregarReceitas \? listarReceitas\(\) : Promise\.resolve\(\[\]\)/)
})

test('navegação não aguarda animação para trocar de rota', () => {
  assert.doesNotMatch(navegacao, /setTimeout\(\(\) => router\.push/)
  assert.doesNotMatch(navegacao, /}, 2450\)/)
})

test('perfil e módulos visíveis compartilham uma sessão global', () => {
  assert.match(sessaoGlobal, /AppSessionContext\.Provider/)
  assert.match(sessaoGlobal, /getSignedUrlForUser/)
  assert.doesNotMatch(coluna, /getSession|getSignedUrl/)
  assert.doesNotMatch(navegacao, /getSession|getSignedUrl/)
})

test('relógio por segundo fica isolado da coluna completa', () => {
  assert.match(coluna, /function Relogio\(\)/)
  assert.match(coluna, /setInterval\(\(\) => setAgora\(new Date\(\)\), 1000\)/)
  assert.match(coluna, /setInterval\(\(\) => setAgora\(new Date\(\)\), 60_000\)/)
})
