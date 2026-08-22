import { Buffer } from 'node:buffer'

export type SupabaseServiceKeyFormat =
  | 'secret'
  | 'legacy-service-role'
  | 'public'
  | 'unknown'

export type SupabaseFailureKind =
  | 'service_key_invalid'
  | 'table_missing'
  | 'column_missing'
  | 'permission_denied'
  | 'unexpected'

export interface SafeSupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function safeSupabaseError(error: unknown): SafeSupabaseError {
  if (!error || typeof error !== 'object') {
    return { message: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }

  const candidate = error as Record<string, unknown>
  return {
    message: optionalText(candidate.message) ?? 'Erro desconhecido.',
    code: optionalText(candidate.code),
    details: optionalText(candidate.details),
    hint: optionalText(candidate.hint),
  }
}

export function classifySupabaseFailure(error: unknown): SupabaseFailureKind {
  const safe = safeSupabaseError(error)
  const code = safe.code?.toUpperCase()
  const description = [safe.message, safe.details, safe.hint].filter(Boolean).join(' ').toLowerCase()

  if (
    ['PGRST301', 'PGRST302', 'PGRST303'].includes(code ?? '')
    || /invalid api key|invalid.*jwt|jwt.*invalid|signature.*invalid|no suitable key|wrong key type/.test(description)
  ) return 'service_key_invalid'
  if (code === 'PGRST205' || code === '42P01') return 'table_missing'
  if (code === 'PGRST204' || code === '42703') return 'column_missing'
  if (code === '42501' || /permission denied|row-level security/.test(description)) return 'permission_denied'
  return 'unexpected'
}

export function classifySupabaseServiceKey(key: string): SupabaseServiceKeyFormat {
  if (key.startsWith('sb_secret_')) return 'secret'
  if (key.startsWith('sb_publishable_')) return 'public'

  const [, payload] = key.split('.')
  if (!payload) return 'unknown'
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: unknown }
    if (decoded.role === 'service_role') return 'legacy-service-role'
    if (typeof decoded.role === 'string') return 'public'
  } catch {
    return 'unknown'
  }
  return 'unknown'
}
