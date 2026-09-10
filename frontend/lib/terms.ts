export const TERMS_VERSION = '2026-09-09'

export function hasAcceptedTerms(userMetadata: unknown): boolean {
  if (!userMetadata || typeof userMetadata !== 'object') return false
  return (userMetadata as Record<string, unknown>).terms_version === TERMS_VERSION
}
