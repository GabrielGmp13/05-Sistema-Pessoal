import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export type StatusProjeto = 'ativo' | 'pausado' | 'concluido'
export type StatusTarefaProjeto = 'a_fazer' | 'fazendo' | 'feito'

export interface Projeto {
  uuid: string
  user_id: string
  nome: string
  descricao: string | null
  status: StatusProjeto
  data_prazo: string | null
  updated_at: string
  deleted: boolean
}

export interface TarefaProjeto {
  uuid: string
  user_id: string
  projeto_uuid: string
  titulo: string
  status: StatusTarefaProjeto
  ordem: number
  updated_at: string
  deleted: boolean
}

export type ProjetoInput = Pick<Projeto, 'nome' | 'descricao' | 'status' | 'data_prazo'>

export async function listarProjetos(): Promise<Projeto[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('updated_at', { ascending: false })

  if (error) return sbErr(error, 'listarProjetos')
  return data as Projeto[]
}

export async function criarProjeto(input: ProjetoInput): Promise<Projeto | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos')
    .insert({ ...input, uuid: crypto.randomUUID(), user_id: userId, updated_at: now() })
    .select()
    .single()

  if (error) return sbErr(error, 'criarProjeto')
  return data as Projeto
}

export async function atualizarProjeto(uuid: string, input: Partial<ProjetoInput>): Promise<Projeto | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos')
    .update({ ...input, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarProjeto')
  return data as Projeto
}

export async function deletarProjeto(uuid: string): Promise<boolean> {
  return softDelete('projetos', uuid)
}

export async function listarTarefasProjeto(projetoUuid: string): Promise<TarefaProjeto[] | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos_tarefas')
    .select('*')
    .eq('user_id', userId)
    .eq('projeto_uuid', projetoUuid)
    .eq('deleted', false)
    .order('ordem')
    .order('updated_at')

  if (error) return sbErr(error, 'listarTarefasProjeto')
  return data as TarefaProjeto[]
}

export async function criarTarefaProjeto(
  projetoUuid: string,
  titulo: string,
  ordem: number,
): Promise<TarefaProjeto | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos_tarefas')
    .insert({
      uuid: crypto.randomUUID(),
      user_id: userId,
      projeto_uuid: projetoUuid,
      titulo,
      status: 'a_fazer',
      ordem,
      updated_at: now(),
    })
    .select()
    .single()

  if (error) return sbErr(error, 'criarTarefaProjeto')
  return data as TarefaProjeto
}

export async function atualizarTarefaProjeto(
  uuid: string,
  input: Partial<Pick<TarefaProjeto, 'titulo' | 'status' | 'ordem'>>,
): Promise<TarefaProjeto | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await sb
    .from('projetos_tarefas')
    .update({ ...input, updated_at: now() })
    .eq('uuid', uuid)
    .eq('user_id', userId)
    .eq('deleted', false)
    .select()
    .single()

  if (error) return sbErr(error, 'atualizarTarefaProjeto')
  return data as TarefaProjeto
}

export async function deletarTarefaProjeto(uuid: string): Promise<boolean> {
  return softDelete('projetos_tarefas', uuid)
}
