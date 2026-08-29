import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { googleScopes, type GoogleService } from '@/lib/google-service'

import { getServiceSupabase } from './supabase'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

const GOOGLE_SERVER_ENVIRONMENT = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_TOKEN_ENCRYPTION_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

interface GoogleCredentials {
  accessToken: string
  refreshToken: string | null
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
}

export function missingGoogleServerEnvironment() {
  return GOOGLE_SERVER_ENVIRONMENT.filter((name) => !process.env[name]?.trim())
}

export function googleConfigured() {
  return missingGoogleServerEnvironment().length === 0
}

function encryptionKey() {
  const encoded = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim()
  if (!encoded) throw new Error('Chave de criptografia Google não configurada.')
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY deve ter 32 bytes em base64.')
  return key
}

export function encryptGoogleCredentials(credentials: GoogleCredentials) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final(),
  ])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptGoogleCredentials(value: string): GoogleCredentials {
  const [ivValue, tagValue, encryptedValue] = value.split('.')
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Credencial Google cifrada inválida.')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ])
  return JSON.parse(decrypted.toString('utf8')) as GoogleCredentials
}

export function oauthState() {
  return randomBytes(32).toString('base64url')
}

export function pkceVerifier() {
  return randomBytes(48).toString('base64url')
}

export function pkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json() as TokenResponse
  if (!response.ok || !body.access_token) throw new Error(body.error || 'Falha ao trocar código OAuth.')
  return body
}

export async function storeGoogleConnection(userId: string, service: GoogleService, tokens: TokenResponse) {
  if (!tokens.access_token) throw new Error('Access token ausente.')
  const admin = getServiceSupabase()
  const { data: current } = await admin
    .from('integracoes_google')
    .select('credenciais_cifradas')
    .eq('user_id', userId)
    .eq('servico', service)
    .maybeSingle()
  const previous = current?.credenciais_cifradas
    ? decryptGoogleCredentials(current.credenciais_cifradas)
    : null
  const credentials = encryptGoogleCredentials({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? previous?.refreshToken ?? null,
  })
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    signal: AbortSignal.timeout(8_000),
  })
  const profile = profileResponse.ok ? await profileResponse.json() as { email?: string } : {}
  const expiresAt = new Date(Date.now() + Math.max(60, tokens.expires_in ?? 3600) * 1000).toISOString()
  const scopes = tokens.scope?.split(' ').filter(Boolean) ?? googleScopes(service)
  const { error } = await admin.from('integracoes_google').upsert({
    user_id: userId,
    servico: service,
    credenciais_cifradas: credentials,
    token_expira_em: expiresAt,
    scopes,
    email_google: profile.email ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,servico' })
  if (error) throw new Error('Não foi possível armazenar a conexão Google.')
}

export async function getGoogleConnection(userId: string, service: GoogleService) {
  const { data, error } = await getServiceSupabase()
    .from('integracoes_google')
    .select('credenciais_cifradas, token_expira_em, scopes, email_google, updated_at')
    .eq('user_id', userId)
    .eq('servico', service)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getGoogleAccessToken(userId: string, service: GoogleService) {
  const connection = await getGoogleConnection(userId, service)
  if (!connection) throw new Error(`${service === 'youtube' ? 'YouTube' : 'Calendar'} não conectado.`)
  const credentials = decryptGoogleCredentials(connection.credenciais_cifradas)
  const expiresAt = connection.token_expira_em ? new Date(connection.token_expira_em).getTime() : 0
  if (credentials.accessToken && expiresAt > Date.now() + 60_000) return credentials.accessToken
  if (!credentials.refreshToken) throw new Error('Conexão Google sem refresh token. Reconecte a conta.')

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const tokens = await response.json() as TokenResponse
  if (!response.ok || !tokens.access_token) throw new Error('Não foi possível renovar a conexão Google.')
  await storeGoogleConnection(userId, service, { ...tokens, refresh_token: credentials.refreshToken })
  return tokens.access_token
}

export class GoogleApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'GoogleApiError'
  }
}

export async function googleApi<T>(userId: string, service: GoogleService, url: string, init?: RequestInit): Promise<T> {
  const accessToken = await getGoogleAccessToken(userId, service)
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: init?.signal ?? AbortSignal.timeout(12_000),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new GoogleApiError(detail?.error?.message || `Google respondeu com status ${response.status}.`, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
