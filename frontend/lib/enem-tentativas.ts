import { sb, getUserId } from './supabase'
import type { Letra } from './questoes-individuais'

export interface TentativaEnem {
  uuid: string; user_id: string; prova_uuid: string; numero: number
  estado: 'em_andamento' | 'finalizada' | 'catalogada'
  iniciada_em: string; prazo_em: string; finalizada_em: string | null
  respostas: Record<number, Letra>; versao: number; redacao_uuid: string | null
}

export async function listarExecucoesEnem(provaUuid: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Entre novamente na conta.')
  const { data, error } = await sb.from('enem_tentativas').select('*').eq('user_id', userId)
    .eq('prova_uuid', provaUuid).eq('deleted', false).order('numero', { ascending: false })
  if (error) throw new Error('Não foi possível carregar as tentativas.')
  return data as TentativaEnem[]
}

export async function iniciarExecucaoEnem(provaUuid: string, uuid: string) {
  const { data, error } = await sb.rpc('iniciar_tentativa_enem', { p_prova_uuid: provaUuid, p_uuid: uuid })
  if (error || !data) throw new Error('Início não confirmado. Atualize: pode existir uma tentativa aberta.')
  return data as TentativaEnem
}

export async function gravarExecucaoEnem(atual: TentativaEnem, respostas: Record<number, Letra>, finalizar = false) {
  if (await getUserId() !== atual.user_id) throw new Error('A conta mudou. Atualize a página.')
  const { data, error } = await sb.rpc('salvar_tentativa_enem', {
    p_uuid: atual.uuid, p_versao: atual.versao, p_respostas: respostas, p_finalizar: finalizar,
  })
  if (error || !data) throw new Error('Gravação não confirmada: prazo encerrado, alteração em outra aba ou conexão indisponível. Confira o estado salvo antes de continuar.')
  return data as TentativaEnem
}

export async function catalogarExecucaoEnem(atual: TentativaEnem, redacaoUuid: string | null) {
  if (await getUserId() !== atual.user_id) throw new Error('A conta mudou. Atualize a página.')
  const { data, error } = await sb.from('enem_tentativas').update({ estado: 'catalogada', redacao_uuid: redacaoUuid })
    .eq('uuid', atual.uuid).eq('user_id', atual.user_id).eq('versao', atual.versao).eq('estado', 'finalizada').select().single()
  if (error || !data) throw new Error('Catalogação não confirmada. Atualize as tentativas.')
  return data as TentativaEnem
}
