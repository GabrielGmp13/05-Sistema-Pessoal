import assert from 'node:assert/strict'
import test from 'node:test'
import { estatisticasEnem } from '../lib/enem-estatisticas.ts'
import { resumirGabaritoEnem } from '../lib/enem-gabarito.ts'
import { readFileSync } from 'node:fs'

test('seleção em andamento permite desmarcar resposta persistida sem contador antigo', () => {
  const dados = resumirGabaritoEnem([{ numero: 1, letra_marcada: 'A', acertou: null }], {}, 90, true)
  assert.equal(dados.respondidas, 0)
  assert.equal(dados.emBranco, 90)
})

test('modo de prova oculta resultado inclusive antes do efeito do relógio e bloqueia prazo vencido', () => {
  const fonte = readFileSync(new URL('../app/estudos/enem/gabarito/[provaUuid]/page.tsx', import.meta.url), 'utf8')
  assert.match(fonte, /searchParams.get\('modo'\) === 'prova'/)
  assert.match(fonte, /!ocultarCorrecao && prova.feita && <ResultadoEnem/)
  assert.match(fonte, /Date.now\(\) >= fimProva/)
})

test('resultado diferencia falta de correção, branco, erro e acerto com denominador explícito', () => {
  const dados = estatisticasEnem([
    { numero: 1, letra_marcada: 'A', letra_correta: 'A', motivo_erro: null },
    { numero: 2, letra_marcada: 'B', letra_correta: 'A', motivo_erro: 'Distração' },
    { numero: 3, letra_marcada: null, letra_correta: 'C', motivo_erro: null },
    { numero: 4, letra_marcada: 'B', letra_correta: null, motivo_erro: null },
  ])
  assert.deepEqual([dados.acertos, dados.erros, dados.emBranco, dados.semCorrecao], [1, 1, 1, 87])
  assert.equal(dados.percentualCorrigidas, 100 / 3)
  assert.deepEqual(dados.motivos, [{ motivo: 'Distração', quantidade: 1 }])
})

test('resultado vazio não inventa percentual e números repetidos não duplicam totais', () => {
  assert.equal(estatisticasEnem([]).percentualCorrigidas, null)
  const q = { numero: 1, letra_marcada: 'B', letra_correta: 'C', motivo_erro: ' ' }
  const dados = estatisticasEnem([q, q, { ...q, numero: 91 }, { ...q, numero: null }])
  assert.equal(dados.erros, 1)
  assert.equal(dados.semCorrecao, 89)
  assert.equal(dados.motivos[0].motivo, 'Sem motivo informado')
})
