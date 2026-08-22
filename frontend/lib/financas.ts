import { getUserId, now, sb, sbErr, softDelete } from './supabase'

export type TipoMovimento = 'entrada' | 'saida'
export type TipoInvestimento = 'acao' | 'fii' | 'etf' | 'bdr' | 'cripto' | 'renda_fixa' | 'outro'

export interface CategoriaFinanceira {
  uuid: string
  user_id: string
  nome: string
  tipo: TipoMovimento
  cor: string | null
  updated_at: string
  deleted: boolean
}

export interface LancamentoFinanceiro {
  uuid: string
  user_id: string
  categoria_uuid: string
  tipo: TipoMovimento
  valor: number
  data: string
  descricao: string | null
  updated_at: string
  deleted: boolean
}

export interface OrcamentoFinanceiro {
  uuid: string
  user_id: string
  categoria_uuid: string
  mes: number
  ano: number
  valor_limite: number
  updated_at: string
  deleted: boolean
}

export interface MetaEconomia {
  uuid: string
  user_id: string
  titulo: string
  valor_alvo: number
  valor_atual: number
  data_alvo: string | null
  updated_at: string
  deleted: boolean
}

export interface InvestimentoFinanceiro {
  uuid: string
  user_id: string
  ticker: string
  tipo: TipoInvestimento
  quantidade: number
  preco_medio: number
  updated_at: string
  deleted: boolean
}

export type CategoriaInput = Pick<CategoriaFinanceira, 'nome' | 'tipo' | 'cor'>
export type LancamentoInput = Pick<LancamentoFinanceiro, 'categoria_uuid' | 'tipo' | 'valor' | 'data' | 'descricao'>
export type OrcamentoInput = Pick<OrcamentoFinanceiro, 'categoria_uuid' | 'mes' | 'ano' | 'valor_limite'>
export type MetaInput = Pick<MetaEconomia, 'titulo' | 'valor_alvo' | 'valor_atual' | 'data_alvo'>
export type InvestimentoInput = Pick<InvestimentoFinanceiro, 'ticker' | 'tipo' | 'quantidade' | 'preco_medio'>

async function listar<T>(tabela: string, ordem = 'updated_at'): Promise<T[] | null> {
  const userId = await getUserId()
  if (!userId) return null
  const { data, error } = await sb.from(tabela).select('*').eq('user_id', userId).eq('deleted', false).order(ordem, { ascending: false })
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

export const listarCategoriasFinanceiras = () => listar<CategoriaFinanceira>('financas_categorias')
export const listarLancamentosFinanceiros = () => listar<LancamentoFinanceiro>('financas_lancamentos', 'data')
export const listarOrcamentosFinanceiros = () => listar<OrcamentoFinanceiro>('financas_orcamentos')
export const listarMetasEconomia = () => listar<MetaEconomia>('financas_metas_economia')
export const listarInvestimentosFinanceiros = () => listar<InvestimentoFinanceiro>('financas_investimentos')
export const salvarCategoriaFinanceira = (input: CategoriaInput, uuid?: string) => salvar<CategoriaFinanceira>('financas_categorias', input, uuid)
export const salvarLancamentoFinanceiro = (input: LancamentoInput, uuid?: string) => salvar<LancamentoFinanceiro>('financas_lancamentos', input, uuid)
export async function criarLancamentosFinanceiros(inputs: LancamentoInput[]): Promise<LancamentoFinanceiro[] | null> {
  const userId = await getUserId()
  if (!userId || inputs.length === 0) return null
  const timestamp = now()
  const { data, error } = await sb.from('financas_lancamentos').insert(inputs.map((input) => ({
    ...input, uuid: crypto.randomUUID(), user_id: userId, updated_at: timestamp,
  }))).select()
  if (error) return sbErr(error, 'criarLancamentosFinanceiros')
  return data as LancamentoFinanceiro[]
}
export const salvarOrcamentoFinanceiro = (input: OrcamentoInput, uuid?: string) => salvar<OrcamentoFinanceiro>('financas_orcamentos', input, uuid)
export const salvarMetaEconomia = (input: MetaInput, uuid?: string) => salvar<MetaEconomia>('financas_metas_economia', input, uuid)
export const salvarInvestimentoFinanceiro = (input: InvestimentoInput, uuid?: string) => salvar<InvestimentoFinanceiro>('financas_investimentos', input, uuid)
export const deletarCategoriaFinanceira = (uuid: string) => softDelete('financas_categorias', uuid)
export const deletarLancamentoFinanceiro = (uuid: string) => softDelete('financas_lancamentos', uuid)
export const deletarOrcamentoFinanceiro = (uuid: string) => softDelete('financas_orcamentos', uuid)
export const deletarMetaEconomia = (uuid: string) => softDelete('financas_metas_economia', uuid)
export const deletarInvestimentoFinanceiro = (uuid: string) => softDelete('financas_investimentos', uuid)
