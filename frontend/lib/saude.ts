import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export interface RegistroSono {
  uuid: string
  user_id: string
  data: string
  horas_dormidas: number
  horario_dormir: string | null
  horario_acordar: string | null
  qualidade: number
  updated_at: string
  deleted: boolean
}

export interface RegistroHidratacao {
  uuid: string
  user_id: string
  data: string
  copos: number
  meta_copos: number
  updated_at: string
  deleted: boolean
}

export interface RegistroHumor {
  uuid: string
  user_id: string
  data: string
  humor: number
  energia: number
  observacoes: string | null
  updated_at: string
  deleted: boolean
}

export interface Medicamento {
  uuid: string
  user_id: string
  nome: string
  dosagem: string | null
  horario: string | null
  ativo: boolean
  estoque: number | null
  updated_at: string
  deleted: boolean
}

export interface RegistroMedicamento {
  uuid: string
  user_id: string
  medicamento_uuid: string
  data: string
  tomado: boolean
  updated_at: string
  deleted: boolean
}

export interface PesoShape {
  uuid: string
  data: string
  peso: number | null
  observacoes: string | null
  updated_at: string
}

export type SonoInput = Pick<RegistroSono, 'data' | 'horas_dormidas' | 'horario_dormir' | 'horario_acordar' | 'qualidade'>
export type HidratacaoInput = Pick<RegistroHidratacao, 'data' | 'copos' | 'meta_copos'>
export type HumorInput = Pick<RegistroHumor, 'data' | 'humor' | 'energia' | 'observacoes'>
export type MedicamentoInput = Pick<Medicamento, 'nome' | 'dosagem' | 'horario' | 'ativo' | 'estoque'>

async function listar<T>(tabela: string, ordem = 'data'): Promise<T[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data, error } = await sb
    .from(tabela)
    .select('*')
    .eq('user_id', userId)
    .eq('deleted', false)
    .order(ordem, { ascending: false })
  if (error) return sbErr(error, `listar(${tabela})`)
  return data as T[]
}

async function salvar<T>(tabela: string, input: object, uuid?: string): Promise<T | null> {
  const userId = await getUserId()
  if (!userId) return null
  const query = uuid
    ? sb.from(tabela).update({ ...input, updated_at: now() }).eq('uuid', uuid).eq('user_id', userId).eq('deleted', false)
    : sb.from(tabela).insert({ ...input, uuid: crypto.randomUUID(), user_id: userId, updated_at: now() })
  const { data, error } = await query.select().single()
  if (error) return sbErr(error, `salvar(${tabela})`)
  return data as T
}

export function listarSono() { return listar<RegistroSono>('saude_sono') }
export function listarHidratacao() { return listar<RegistroHidratacao>('saude_hidratacao') }
export function listarHumor() { return listar<RegistroHumor>('saude_humor') }
export function listarMedicamentos() { return listar<Medicamento>('saude_medicamentos', 'updated_at') }
export function listarRegistrosMedicamentos() { return listar<RegistroMedicamento>('saude_medicamentos_registros') }

export function salvarSono(input: SonoInput, uuid?: string) { return salvar<RegistroSono>('saude_sono', input, uuid) }
export function salvarHidratacao(input: HidratacaoInput, uuid?: string) { return salvar<RegistroHidratacao>('saude_hidratacao', input, uuid) }
export function salvarHumor(input: HumorInput, uuid?: string) { return salvar<RegistroHumor>('saude_humor', input, uuid) }
export function salvarMedicamento(input: MedicamentoInput, uuid?: string) { return salvar<Medicamento>('saude_medicamentos', input, uuid) }

export async function salvarRegistroMedicamento(
  medicamentoUuid: string,
  data: string,
  tomado: boolean,
  uuid?: string,
): Promise<RegistroMedicamento | null> {
  return salvar<RegistroMedicamento>('saude_medicamentos_registros', {
    medicamento_uuid: medicamentoUuid,
    data,
    tomado,
  }, uuid)
}

export async function buscarUltimoPeso(): Promise<PesoShape | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data, error } = await sb
    .from('shape')
    .select('uuid, data, peso, observacoes, updated_at')
    .eq('user_id', userId)
    .eq('deleted', false)
    .not('peso', 'is', null)
    .order('data', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return sbErr(error, 'buscarUltimoPeso')
  return data as PesoShape | null
}

export const deletarSono = (uuid: string) => softDelete('saude_sono', uuid)
export const deletarHidratacao = (uuid: string) => softDelete('saude_hidratacao', uuid)
export const deletarHumor = (uuid: string) => softDelete('saude_humor', uuid)
export const deletarMedicamento = (uuid: string) => softDelete('saude_medicamentos', uuid)
