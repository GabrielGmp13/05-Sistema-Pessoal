import assert from 'node:assert/strict'
import test from 'node:test'

import { calcularMetricasTopico, percentualDesempenho } from '../lib/topico-metricas.ts'

test('progresso usa somente subtópicos ativos com teoria vista', () => {
  const metricas = calcularMetricasTopico({
    subtopicos: [
      { uuid: 'a', teoria_vista: true },
      { uuid: 'b', teoria_vista: false },
    ],
    cards: [], questoes: [], simulados: [], tentativasRevisao: [], hoje: '2026-09-30',
  })
  assert.equal(metricas.progresso, 50)
  assert.equal(percentualDesempenho(metricas.geral), null)
})

test('geral soma numeradores e denominadores em vez de tirar média de percentuais', () => {
  const metricas = calcularMetricasTopico({
    subtopicos: [{ uuid: 'a', teoria_vista: true }],
    cards: [{ conteudo_uuid: 'a', proxima_revisao: '2026-09-29', arquivado: false }],
    tentativasRevisao: [
      { conteudo_uuid: 'a', resultado: 'falhou' },
      { conteudo_uuid: 'a', resultado: 'dificil' },
    ],
    questoes: [
      { conteudo_uuid: 'a', prova_uuid: 'p', acertou: true },
      { conteudo_uuid: 'a', prova_uuid: 'p', acertou: null },
    ],
    simulados: [{ conteudo_uuid: 'a', total_questoes: 10, total_acertos: 8, total_anuladas: 1 }],
    hoje: '2026-09-30',
  })
  assert.deepEqual(metricas.geral, { corretas: 10, incorretas: 2, neutras: 2 })
  assert.equal(percentualDesempenho(metricas.geral), 83)
  assert.equal(metricas.revisoesConcluidas, 2)
  assert.equal(metricas.revisaoAtrasada, true)
})

test('questões avulsas não entram em prova e anuladas não viram erro', () => {
  const metricas = calcularMetricasTopico({
    subtopicos: [{ uuid: 'a', teoria_vista: false }],
    cards: [], tentativasRevisao: [], hoje: '2026-09-30',
    questoes: [{ conteudo_uuid: 'a', prova_uuid: null, acertou: false }],
    simulados: [{ conteudo_uuid: 'a', total_questoes: 5, total_acertos: 0, total_anuladas: 5 }],
  })
  assert.deepEqual(metricas.prova, { corretas: 0, incorretas: 0, neutras: 0 })
  assert.deepEqual(metricas.simulado, { corretas: 0, incorretas: 0, neutras: 5 })
  assert.equal(percentualDesempenho(metricas.simulado), null)
})
