export const SUPPORT_TYPES = ['bug', 'sugestao'] as const
export const SUPPORT_STATUSES = ['recebido', 'em_analise', 'resolvido', 'fechado'] as const
export const SUPPORT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const SUPPORT_MAX_FILE_BYTES = 2 * 1024 * 1024
export const SUPPORT_MAX_FILES = 3

export type SupportType = (typeof SUPPORT_TYPES)[number]
export type SupportStatus = (typeof SUPPORT_STATUSES)[number]

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  recebido: 'Recebido',
  em_analise: 'Em análise',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

export interface SupportInput {
  tipo: SupportType
  titulo: string
  modulo?: string
  descricao: string
  esperado?: string
  passos?: string
  ambiente?: string
  tema?: string
  versao?: string
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return value.trim().slice(0, max)
}

export function parseSupportInput(value: unknown): SupportInput {
  if (!value || typeof value !== 'object') throw new Error('Relato inválido.')
  const input = value as Record<string, unknown>
  if (!SUPPORT_TYPES.includes(input.tipo as SupportType)) throw new Error('Escolha bug ou sugestão.')
  const titulo = optionalText(input.titulo, 120)
  const descricao = optionalText(input.descricao, 4000)
  if (!titulo || titulo.length < 5) throw new Error('Informe um título com pelo menos 5 caracteres.')
  if (!descricao || descricao.length < 10) throw new Error('Descreva o pedido com pelo menos 10 caracteres.')
  return {
    tipo: input.tipo as SupportType,
    titulo,
    descricao,
    modulo: optionalText(input.modulo, 100) ?? undefined,
    esperado: optionalText(input.esperado, 2000) ?? undefined,
    passos: optionalText(input.passos, 2000) ?? undefined,
    ambiente: optionalText(input.ambiente, 300) ?? undefined,
    tema: optionalText(input.tema, 50) ?? undefined,
    versao: optionalText(input.versao, 30) ?? undefined,
  }
}

export function validateSupportImage(file: File): string | null {
  if (!SUPPORT_IMAGE_TYPES.includes(file.type as (typeof SUPPORT_IMAGE_TYPES)[number])) return 'Use uma imagem PNG, JPG ou WebP.'
  if (file.size < 1 || file.size > SUPPORT_MAX_FILE_BYTES) return 'Cada print pode ter no máximo 2 MB.'
  return null
}

export function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/png') return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (mimeType === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return false
}
