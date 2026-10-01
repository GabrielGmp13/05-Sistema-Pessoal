import type { Conteudo } from './conteudos'
import type { CardRevisao } from './revisao'
import { sb, getUserId, sbErr } from './supabase'
import {
  calcularMetricasTopico,
  type MetricasTopico,
  type QuestaoTopico,
  type SimuladoTopico,
  type TentativaRevisaoTopico,
} from './topico-metricas'

export type EscopoEstudo = 'escola' | 'enem'

export interface TopicoEstudo {
  uuid: string
  user_id: string
  nome: string
  updated_at: string
  deleted: boolean
}

export interface VinculoTopicoMateria {
  uuid: string
  topico_uuid: string
  materia_uuid: string
  mostra_escola: boolean
  mostra_enem: boolean
  escopo_origem: 'manual' | 'inferido_materia'
  escopo_ambiguo: boolean
}

export interface TopicoComDados extends TopicoEstudo {
  vinculo: VinculoTopicoMateria
  subtopicos: Conteudo[]
  cardsRevisao: CardRevisao[]
  metricas: MetricasTopico
  metricasSubtopicos: Record<string, MetricasTopico>
}

function hojeLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export async function listarTopicosPorMateria(
  materiaUuid: string,
  escopo: EscopoEstudo,
): Promise<TopicoComDados[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const colunaEscopo = escopo === 'enem' ? 'mostra_enem' : 'mostra_escola'
  const { data: vinculos, error: erroVinculos } = await sb.from('topicos_materias')
    .select('uuid,topico_uuid,materia_uuid,mostra_escola,mostra_enem,escopo_origem,escopo_ambiguo')
    .eq('user_id', userId).eq('materia_uuid', materiaUuid).eq(colunaEscopo, true).eq('deleted', false)
  if (erroVinculos) return sbErr(erroVinculos, 'listarTopicosPorMateria:vinculos')
  if (!vinculos?.length) return []

  const topicoUuids = vinculos.map((item) => item.topico_uuid)
  const { data: topicos, error: erroTopicos } = await sb.from('topicos_estudo').select('*')
    .eq('user_id', userId).eq('deleted', false).in('uuid', topicoUuids).order('nome')
  if (erroTopicos) return sbErr(erroTopicos, 'listarTopicosPorMateria:topicos')

  const { data: subtopicos, error: erroSubtopicos } = await sb.from('conteudos').select('*')
    .eq('user_id', userId).eq('deleted', false).in('topico_uuid', topicoUuids).order('nome')
  if (erroSubtopicos) return sbErr(erroSubtopicos, 'listarTopicosPorMateria:subtopicos')
  const conteudos = (subtopicos ?? []) as Conteudo[]
  const conteudoUuids = conteudos.map((item) => item.uuid)
  const revisaoUuids = conteudos.map((item) => item.revisao_uuid).filter((uuid): uuid is string => Boolean(uuid))

  const [cardsResult, questoesResult, simuladosResult, tentativasResult] = await Promise.all([
    revisaoUuids.length
      ? sb.from('revisao_espacada').select('*').eq('user_id', userId).eq('deleted', false).in('uuid', revisaoUuids)
      : Promise.resolve({ data: [], error: null }),
    conteudoUuids.length
      ? sb.from('questoes_individuais').select('conteudo_uuid,prova_uuid,acertou').eq('user_id', userId).eq('deleted', false).in('conteudo_uuid', conteudoUuids)
      : Promise.resolve({ data: [], error: null }),
    conteudoUuids.length
      ? sb.from('simulados').select('conteudo_uuid,total_questoes,total_acertos,total_anuladas').eq('user_id', userId).eq('deleted', false).in('conteudo_uuid', conteudoUuids)
      : Promise.resolve({ data: [], error: null }),
    conteudoUuids.length
      ? sb.from('revisoes_tentativas').select('conteudo_uuid,resultado').eq('user_id', userId).in('conteudo_uuid', conteudoUuids)
      : Promise.resolve({ data: [], error: null }),
  ])
  const erroRelacionado = cardsResult.error || questoesResult.error || simuladosResult.error || tentativasResult.error
  if (erroRelacionado) return sbErr(erroRelacionado, 'listarTopicosPorMateria:metricas')

  const cards = (cardsResult.data ?? []) as CardRevisao[]
  const questoes = (questoesResult.data ?? []) as QuestaoTopico[]
  const simulados = (simuladosResult.data ?? []) as SimuladoTopico[]
  const tentativas = (tentativasResult.data ?? []) as TentativaRevisaoTopico[]
  const vinculoPorTopico = new Map((vinculos as VinculoTopicoMateria[]).map((item) => [item.topico_uuid, item]))

  return ((topicos ?? []) as TopicoEstudo[]).map((topico) => {
    const filhos = conteudos.filter((item) => item.topico_uuid === topico.uuid)
    const ids = new Set(filhos.map((item) => item.uuid))
    const cardsDoTopico = cards.filter((card) => card.conteudo_uuid && ids.has(card.conteudo_uuid))
    return {
      ...topico,
      vinculo: vinculoPorTopico.get(topico.uuid)!,
      subtopicos: filhos,
      cardsRevisao: cardsDoTopico,
      metricas: calcularMetricasTopico({
        subtopicos: filhos,
        cards: cardsDoTopico,
        questoes,
        simulados,
        tentativasRevisao: tentativas,
        hoje: hojeLocal(),
      }),
      metricasSubtopicos: Object.fromEntries(filhos.map((filho) => [filho.uuid, calcularMetricasTopico({
        subtopicos: [filho],
        cards: cardsDoTopico,
        questoes,
        simulados,
        tentativasRevisao: tentativas,
        hoje: hojeLocal(),
      })])),
    }
  })
}

export async function buscarTopicoComDados(
  materiaUuid: string,
  topicoUuid: string,
): Promise<TopicoComDados | null> {
  const resultados = await Promise.all([
    listarTopicosPorMateria(materiaUuid, 'escola'),
    listarTopicosPorMateria(materiaUuid, 'enem'),
  ])
  if (resultados.some((resultado) => resultado === null)) return null
  return [...(resultados[0] ?? []), ...(resultados[1] ?? [])]
    .find((topico, indice, lista) => topico.uuid === topicoUuid
      && lista.findIndex((item) => item.uuid === topico.uuid) === indice) ?? null
}

export async function criarTopicoEstudo({
  materiaUuid,
  nome,
  escopo,
}: {
  materiaUuid: string
  nome: string
  escopo: EscopoEstudo
}): Promise<TopicoEstudo | null> {
  const { data, error } = await sb.rpc('criar_topico_estudo_v23', {
    p_materia_uuid: materiaUuid,
    p_nome: nome.trim(),
    p_mostra_escola: escopo === 'escola',
    p_mostra_enem: escopo === 'enem',
  }).single()
  if (error) return sbErr(error, 'criarTopicoEstudo')
  return data as TopicoEstudo
}

export async function atualizarEscopoTopico(
  vinculoUuid: string,
  mostraEscola: boolean,
  mostraEnem: boolean,
): Promise<boolean> {
  if (!mostraEscola && !mostraEnem) return false
  const userId = await getUserId()
  if (!userId) return false
  const { error } = await sb.from('topicos_materias').update({
    mostra_escola: mostraEscola,
    mostra_enem: mostraEnem,
    escopo_origem: 'manual',
    escopo_ambiguo: false,
    updated_at: new Date().toISOString(),
  }).eq('uuid', vinculoUuid).eq('user_id', userId).eq('deleted', false)
  if (error) { sbErr(error, 'atualizarEscopoTopico'); return false }
  return true
}
