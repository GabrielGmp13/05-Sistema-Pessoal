import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const ler = (caminho: string) => readFileSync(new URL(caminho, import.meta.url), 'utf8')

test('Revisão sai da navegação global e continua acessível por Estudos', () => {
  const navegacao = ler('../components/GlobalNav.tsx')
  const estudos = ler('../app/estudos/page.tsx')
  assert.doesNotMatch(navegacao, /href:\s*['"]\/revisao['"]/)
  assert.match(estudos, /href="\/revisao"/)
  assert.match(estudos, /Abrir revisão/)
})

test('nenhum rótulo visual Bloco N permanece no frontend', () => {
  const materia = ler('../app/estudos/materia/[materiaUuid]/page.tsx')
  const escola = ler('../app/estudos/escola/page.tsx')
  const enem = ler('../app/estudos/enem/page.tsx')
  const gabarito = ler('../app/estudos/enem/gabarito/[provaUuid]/page.tsx')
  for (const fonte of [materia, escola, enem, gabarito]) assert.doesNotMatch(fonte, /Bloco\s*(?:\d|\{)/i)
  assert.match(gabarito, /Questões \{bloco\[0\]\}/)
})

test('área ENEM redireciona somente depois de leitura bem-sucedida com uma matéria', () => {
  const fonte = ler('../app/estudos/enem/[area]/page.tsx')
  assert.match(fonte, /if \(carregando \|\| erro \|\| !areaValida \|\| !materiaUnica\) return/)
  assert.match(fonte, /router\.replace\(`\/estudos\/materia\/\$\{materiaUnica\.uuid\}\?from=enem`\)/)
})

test('detalhe canônico e rota interceptada usam o mesmo painel de tópico', () => {
  const canonica = ler('../app/estudos/materia/[materiaUuid]/topico/[topicoUuid]/page.tsx')
  const modal = ler('../app/estudos/materia/[materiaUuid]/@modal/(.)topico/[topicoUuid]/page.tsx')
  assert.match(canonica, /TopicoDetalhe/)
  assert.match(modal, /TopicoDetalhe/)
})
