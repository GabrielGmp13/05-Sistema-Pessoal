export const MODULOS_OPCIONAIS = [
  { rota: '/treino', nome: 'Treino' }, { rota: '/biblioteca', nome: 'Biblioteca' },
  { rota: '/estudos', nome: 'Estudos' }, { rota: '/idiomas', nome: 'Idiomas' },
  { rota: '/revisao', nome: 'Revisão' }, { rota: '/agenda', nome: 'Agenda' },
  { rota: '/historico', nome: 'Histórico' }, { rota: '/projetos', nome: 'Projetos' },
  { rota: '/programacao', nome: 'Programação' }, { rota: '/diario', nome: 'Diário' },
] as const

export function normalizarModulosOcultos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return MODULOS_OPCIONAIS.map((item) => item.rota).filter((rota) => valor.includes(rota))
}
