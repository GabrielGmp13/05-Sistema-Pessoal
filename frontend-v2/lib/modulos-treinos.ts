import { createBrowserClient } from '@supabase/ssr'

export interface ModuloTreino {
  uuid: string
  nome: string
  cor: string
}

// Fixos por decisão de produto — ver DEC-022. Sem CRUD de módulo.
const MODULOS_PADRAO: Omit<ModuloTreino, 'uuid'>[] = [
  { nome: 'Cardio', cor: '#63b3ed' },
  { nome: 'Força', cor: '#b8f566' },
  { nome: 'Resistência', cor: '#4ade80' },
  { nome: 'Hipertrofia', cor: '#fb923c' },
  { nome: 'Flexibilidade', cor: '#f472b6' },
  { nome: 'Mobilidade', cor: '#a78bfa' },
  { nome: 'Potência', cor: '#f87171' },
]

// Garante que os 7 módulos existam para o usuário. Idempotente:
// só insere se a tabela estiver vazia para esse user_id.
export async function seedModulosSeNecessario(
  sb: ReturnType<typeof createBrowserClient>,
  userId: string
): Promise<void> {
  const { count, error: erroContagem } = await sb
    .from('modulos_treino')
    .select('uuid', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('deleted', false)

  if (erroContagem) {
    console.error('[seedModulosSeNecessario] erro ao contar:', erroContagem)
    return
  }

  if (count && count > 0) return // já existem, não faz nada

  const linhas = MODULOS_PADRAO.map((m) => ({
    uuid: crypto.randomUUID(),
    user_id: userId,
    nome: m.nome,
    cor: m.cor,
  }))

  const { error: erroInsert } = await sb.from('modulos_treino').insert(linhas)
  if (erroInsert) {
    console.error('[seedModulosSeNecessario] erro ao inserir seed:', erroInsert)
  }
}

// Busca os módulos do usuário (ativos, ordenados pelo padrão fixo acima).
export async function getModulosTreino(
  sb: ReturnType<typeof createBrowserClient>,
  userId: string
): Promise<ModuloTreino[]> {
  const { data, error } = await sb
    .from('modulos_treino')
    .select('uuid, nome, cor')
    .eq('user_id', userId)
    .eq('deleted', false)

  if (error) {
    console.error('[getModulosTreino] erro:', error)
    return []
  }

  const ordem = MODULOS_PADRAO.map((m) => m.nome)
  return (data ?? []).sort(
    (a, b) => ordem.indexOf(a.nome) - ordem.indexOf(b.nome)
  )
}