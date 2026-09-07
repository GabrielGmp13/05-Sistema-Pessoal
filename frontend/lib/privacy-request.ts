export const PRIVACY_REQUEST_TYPES = ['copia', 'exclusao'] as const
export type PrivacyRequestType = (typeof PRIVACY_REQUEST_TYPES)[number]

export const DELETE_CONFIRMATION = 'EXCLUIR MINHA CONTA'

export function parsePrivacyRequest(value: unknown): PrivacyRequestType {
  if (!value || typeof value !== 'object') throw new Error('Solicitação inválida.')
  const input = value as Record<string, unknown>
  if (!PRIVACY_REQUEST_TYPES.includes(input.tipo as PrivacyRequestType)) throw new Error('Escolha uma solicitação válida.')
  if (input.tipo === 'exclusao' && input.confirmacao !== DELETE_CONFIRMATION) {
    throw new Error(`Digite ${DELETE_CONFIRMATION} para confirmar o pedido.`)
  }
  return input.tipo as PrivacyRequestType
}
