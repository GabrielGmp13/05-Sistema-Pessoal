import { dataLocalIso } from './date'
import { getUserId, sb, sbErr } from './supabase'

export type AreaAtividade = 'treino' | 'estudos' | 'agenda' | 'revisao' | 'saude' | 'financas' | 'idiomas'

export const AREA_ATIVIDADE_LABELS: Record<AreaAtividade, string> = {
  treino: 'Treino',
  estudos: 'Estudos',
  agenda: 'Agenda',
  revisao: 'Revisão',
  saude: 'Saúde',
  financas: 'Finanças',
  idiomas: 'Idiomas',
}

export interface AtividadeDia {
  data: string
  total: number
  areas: Partial<Record<AreaAtividade, number>>
}

export interface ResumoAtividadeAnual {
  ano: number
  dias: AtividadeDia[]
  parcial: boolean
}

interface FonteAtividade {
  tabela: string
  campo: string
  area: AreaAtividade
  timestamp?: boolean
  filtro?: { campo: string; valor: boolean }
  exigeFim?: boolean
}

const FONTES: FonteAtividade[] = [
  { tabela: 'sessoes_treino', campo: 'data_inicio', area: 'treino', timestamp: true, exigeFim: true },
  { tabela: 'sessoes_estudo', campo: 'inicio', area: 'estudos', timestamp: true },
  { tabela: 'agenda', campo: 'data', area: 'agenda', filtro: { campo: 'concluido', valor: true } },
  { tabela: 'provas', campo: 'data', area: 'estudos', filtro: { campo: 'feita', valor: true } },
  { tabela: 'revisao_espacada', campo: 'updated_at', area: 'revisao', timestamp: true },
  { tabela: 'saude_humor', campo: 'data', area: 'saude' },
  { tabela: 'saude_sono', campo: 'data', area: 'saude' },
  { tabela: 'financas_lancamentos', campo: 'data', area: 'financas' },
  { tabela: 'idiomas_praticas', campo: 'data', area: 'idiomas' },
]

export async function listarAtividadeAnual(ano: number): Promise<ResumoAtividadeAnual | null> {
  const userId = await getUserId()
  if (!userId) return null

  const inicio = `${ano}-01-01`
  const fim = `${ano}-12-31`
  const inicioTimestamp = new Date(ano, 0, 1).toISOString()
  const fimTimestampExclusivo = new Date(ano + 1, 0, 1).toISOString()
  const resultados = await Promise.all(FONTES.map(async (fonte) => {
    let query = sb
      .from(fonte.tabela)
      .select(fonte.campo)
      .eq('user_id', userId)
      .eq('deleted', false)
      .gte(fonte.campo, fonte.timestamp ? inicioTimestamp : inicio)

    query = fonte.timestamp
      ? query.lt(fonte.campo, fimTimestampExclusivo)
      : query.lte(fonte.campo, fim)

    if (fonte.filtro) query = query.eq(fonte.filtro.campo, fonte.filtro.valor)
    if (fonte.exigeFim) query = query.not('data_fim', 'is', null)

    const { data, error } = await query
    if (error) {
      sbErr(error, `listarAtividadeAnual.${fonte.tabela}`)
      return { fonte, datas: [] as string[], falhou: true }
    }

    const datas = (data ?? [])
      .map((item) => {
        const valor = String((item as unknown as Record<string, unknown>)[fonte.campo] ?? '')
        return fonte.timestamp && valor ? dataLocalIso(new Date(valor)) : valor.slice(0, 10)
      })
      .filter(Boolean)
    return { fonte, datas, falhou: false }
  }))

  const porDia = new Map<string, AtividadeDia>()
  for (const resultado of resultados) {
    for (const data of resultado.datas) {
      const atual = porDia.get(data) ?? { data, total: 0, areas: {} }
      atual.total += 1
      atual.areas[resultado.fonte.area] = (atual.areas[resultado.fonte.area] ?? 0) + 1
      porDia.set(data, atual)
    }
  }

  return {
    ano,
    dias: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
    parcial: resultados.some((resultado) => resultado.falhou),
  }
}
