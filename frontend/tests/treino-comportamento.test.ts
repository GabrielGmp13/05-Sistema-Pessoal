import assert from 'node:assert/strict'
import test from 'node:test'
import { finalizarComExecucoes } from '../lib/treino-finalizacao.ts'
import { consolidarCardioPorDia, volumePorGrupo } from '../lib/treino-estatisticas.ts'
import { chaveRascunho, lerRascunho, planoAlteradoDuranteSessao, type RascunhoTreino } from '../lib/treino-rascunho.ts'

test('plano alterado bloqueia perda de exercícios do rascunho ou já gravados', () => {
  assert.equal(planoAlteradoDuranteSessao(['a'], ['b'], ['a'], ['b']), false)
  assert.equal(planoAlteradoDuranteSessao(['a'], ['b'], ['removido'], []), true)
  assert.equal(planoAlteradoDuranteSessao(['a'], ['b'], [], ['removido']), true)
})

test('volume considera somente concluídas e distingue ausência de carga de zero', () => {
  const exercicios = [{ uuid: 'a', grupo_muscular: 'Peito' }, { uuid: 'b', grupo_muscular: 'peito' }]
  const series = [
    { exercicio_uuid: 'a', concluida: true, carga_real: 20, reps_real: 10 },
    { exercicio_uuid: 'b', concluida: true, carga_real: null, reps_real: 10 },
    { exercicio_uuid: 'a', concluida: false, carga_real: 90, reps_real: 10 },
    { exercicio_uuid: 'c', concluida: true, carga_real: 0, reps_real: 10 },
  ]
  assert.deepEqual(volumePorGrupo(series, exercicios), [
    { grupo: 'Peito', series: 2, volume: 200, seriesComVolume: 1 },
    { grupo: 'Sem classificação', series: 1, volume: 0, seriesComVolume: 1 },
  ])
})

test('rascunho preserva IDs de repetição e recusa outra conta, sessão, treino ou dados inválidos', () => {
  const r: RascunhoTreino = { versao: 1, userId: 'u', sessaoUuid: 's', treinoUuid: 't', series: { a: [{ carga: '20', reps: '10', concluida: true }] }, cardio: {}, ids: [['forca:a:0', 'uuid']], descansoAte: 123, edicaoTravada: true }
  assert.deepEqual(lerRascunho(JSON.stringify(r), 'u', 's', 't'), r)
  assert.equal(lerRascunho(JSON.stringify(r), 'outro', 's', 't'), null)
  assert.equal(lerRascunho(JSON.stringify(r), 'u', 'outro', 't'), null)
  assert.equal(lerRascunho(JSON.stringify(r), 'u', 's', 'outro'), null)
  assert.equal(lerRascunho('{', 'u', 's', 't'), null)
  assert.equal(lerRascunho(JSON.stringify({ ...r, series: { a: [null] } }), 'u', 's', 't'), null)
  assert.notEqual(chaveRascunho('u', 's'), chaveRascunho('outro', 's'))
})

test('falha de execução impede encerrar a sessão e as etapas seguintes', async () => {
  const chamadas: string[] = []
  const resultado = await finalizarComExecucoes([
    async () => { chamadas.push('primeira'); return { error: 'falha' } },
    async () => { chamadas.push('segunda'); return { error: null } },
  ], async () => { chamadas.push('final'); return { error: null } })
  assert.ok(resultado.error)
  assert.deepEqual(chamadas, ['primeira'])
})

test('finalização só acontece depois de todas as execuções confirmadas', async () => {
  const chamadas: string[] = []
  const resultado = await finalizarComExecucoes([
    async () => { chamadas.push('forca'); return { error: null } },
    async () => { chamadas.push('cardio'); return { error: null } },
  ], async () => { chamadas.push('final'); return { error: null } })
  assert.equal(resultado.error, null)
  assert.deepEqual(chamadas, ['forca', 'cardio', 'final'])
})

test('erro na confirmação final ou queda de conexão não vira sucesso', async () => {
  assert.ok((await finalizarComExecucoes([], async () => ({ error: 'falha' }))).error)
  assert.ok((await finalizarComExecucoes([async () => { throw new Error('rede') }], async () => ({ error: null }))).error)
})

test('sessão concluída conserva aviso de compromisso ambíguo sem virar erro', async () => {
  const aviso = 'Escolha na Agenda qual compromisso foi realizado.'
  assert.deepEqual(await finalizarComExecucoes([], async () => ({ error: null, aviso })), { error: null, aviso })
})

test('cardio preserva anos diferentes e ordena cronologicamente', () => {
  const pontos = consolidarCardioPorDia([
    { data_hora: '2026-09-15T12:00:00', distancia_real_km: 3, duracao_real_minutos: 20 },
    { data_hora: '2025-09-15T12:00:00', distancia_real_km: 2, duracao_real_minutos: 10 },
    { data_hora: '2026-09-15T15:00:00', distancia_real_km: 4, duracao_real_minutos: 30 },
  ], 'distancia')
  assert.deepEqual(pontos, [{ label: '15/09/2025', valor: 2 }, { label: '15/09/2026', valor: 7 }])
})

test('cardio ignora ausência, negativos e datas inválidas sem inventar zeros', () => {
  const pontos = consolidarCardioPorDia([
    { data_hora: '2026-09-15T12:00:00', distancia_real_km: null, duracao_real_minutos: 10 },
    { data_hora: 'inválida', distancia_real_km: 2, duracao_real_minutos: 10 },
    { data_hora: '2026-09-15T12:00:00', distancia_real_km: -1, duracao_real_minutos: 10 },
  ], 'distancia')
  assert.deepEqual(pontos, [])
})
