export interface ModuloPausado {
  slug: string
  nome: string
  rotas: readonly string[]
}

// Pausa de produto V2.1: mantém código, dados e permissões; somente a
// superfície do site é retirada até que Gabriel libere cada cômodo novamente.
export const MODULOS_PAUSADOS: readonly ModuloPausado[] = [
  { slug: 'idiomas', nome: 'Idiomas', rotas: ['/idiomas'] },
  { slug: 'projetos', nome: 'Projetos', rotas: ['/projetos'] },
  { slug: 'programacao', nome: 'Programação', rotas: ['/programacao'] },
  { slug: 'diario', nome: 'Diário', rotas: ['/diario', '/saude', '/financas', '/lugares', '/receitas'] },
]

export const ROTAS_MODULOS_PAUSADOS = MODULOS_PAUSADOS.flatMap((modulo) => modulo.rotas)

export function moduloPausadoDaRota(pathname: string): ModuloPausado | null {
  return MODULOS_PAUSADOS.find((modulo) => modulo.rotas.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  )) ?? null
}

export function moduloPausadoPorSlug(slug: string): ModuloPausado | null {
  return MODULOS_PAUSADOS.find((modulo) => modulo.slug === slug) ?? null
}
