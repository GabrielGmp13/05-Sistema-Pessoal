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
