export const GOOGLE_SERVICES = ['youtube', 'calendar'] as const

export type GoogleService = typeof GOOGLE_SERVICES[number]

const COMMON_SCOPES = ['openid', 'email'] as const

const SERVICE_SCOPES: Record<GoogleService, string> = {
  youtube: 'https://www.googleapis.com/auth/youtube.readonly',
  calendar: 'https://www.googleapis.com/auth/calendar.events',
}

export function parseGoogleService(value: unknown): GoogleService | null {
  return typeof value === 'string' && GOOGLE_SERVICES.includes(value as GoogleService)
    ? value as GoogleService
    : null
}

export function googleScopes(service: GoogleService) {
  return [...COMMON_SCOPES, SERVICE_SCOPES[service]]
}

export function matchesGoogleOAuthContext(expectedUser: string | undefined, currentUser: string, expectedState: string | undefined, state: string | null) {
  return Boolean(expectedUser && expectedUser === currentUser && expectedState && state && expectedState === state)
}

export function googleRefreshToken(incoming: string | undefined, previous: string | null | undefined, previousEmail: string | null | undefined, currentEmail: string) {
  if (incoming) return incoming
  if (previous && previousEmail?.toLowerCase() === currentEmail.toLowerCase()) return previous
  // Ao trocar de conta, reutilizar o token antigo conectaria a conta errada na renovação.
  throw new Error('A nova conta Google precisa conceder acesso permanente. Reconecte a conta.')
}
