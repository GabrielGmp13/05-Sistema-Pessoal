import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { classifySupabaseServiceKey } from '@/lib/supabase-diagnostics'

export class SupabaseServerConfigurationError extends Error {
  readonly code: 'SERVER_ENV_MISSING' | 'SERVER_KEY_TYPE_INVALID'

  constructor(code: 'SERVER_ENV_MISSING' | 'SERVER_KEY_TYPE_INVALID', message: string) {
    super(message)
    this.name = 'SupabaseServerConfigurationError'
    this.code = code
  }
}

export async function getApiUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRole) {
    throw new SupabaseServerConfigurationError(
      'SERVER_ENV_MISSING',
      'Supabase server-side não configurado.',
    )
  }
  if (classifySupabaseServiceKey(serviceRole) === 'public') {
    throw new SupabaseServerConfigurationError(
      'SERVER_KEY_TYPE_INVALID',
      'A variável server-side recebeu uma chave pública em vez de uma chave secreta.',
    )
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
