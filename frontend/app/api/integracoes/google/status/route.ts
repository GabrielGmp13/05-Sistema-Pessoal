import { NextResponse } from 'next/server'

import { getGoogleConnection, missingGoogleServerEnvironment } from '@/lib/server/google'
import { getApiUser, SupabaseServerConfigurationError } from '@/lib/server/supabase'
import { classifySupabaseFailure, safeSupabaseError, type SupabaseFailureKind } from '@/lib/supabase-diagnostics'

const ROUTE_NAME = '/api/integracoes/google/status'

const FAILURE_RESPONSES: Record<SupabaseFailureKind, { erro: string; status: number }> = {
  service_key_invalid: {
    erro: 'A credencial server-side do Supabase foi recusada. Confira se a chave secreta pertence ao mesmo projeto da URL configurada.',
    status: 503,
  },
  table_missing: {
    erro: 'A tabela de integração Google não está disponível no banco configurado.',
    status: 503,
  },
  column_missing: {
    erro: 'O schema da integração Google está incompleto no banco configurado.',
    status: 503,
  },
  permission_denied: {
    erro: 'A credencial server-side não tem permissão para consultar a integração Google.',
    status: 503,
  },
  unexpected: {
    erro: 'Não foi possível consultar a conexão por um erro inesperado.',
    status: 500,
  },
}

function logSafeError(error: unknown, kind: string) {
  const safe = safeSupabaseError(error)
  console.error(`[${ROUTE_NAME}] Falha ao consultar conexão Google.`, {
    kind,
    message: safe.message,
    code: safe.code,
    details: safe.details,
    hint: safe.hint,
  })
}

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

    const missingEnvironment = missingGoogleServerEnvironment()
    if (missingEnvironment.length > 0) {
      return NextResponse.json({
        configurado: false,
        conectado: false,
        erro: 'Configuração server-side incompleta.',
        diagnostico: { tipo: 'env_server_ausente', variaveis: missingEnvironment },
      }, { status: 503 })
    }

    const connection = await getGoogleConnection(user.id)
    return NextResponse.json({
      configurado: true,
      conectado: Boolean(connection),
      email: connection?.email_google ?? null,
      scopes: connection?.scopes ?? [],
      atualizadoEm: connection?.updated_at ?? null,
    })
  } catch (error) {
    if (error instanceof SupabaseServerConfigurationError) {
      const kind = error.code === 'SERVER_ENV_MISSING' ? 'env_server_ausente' : 'service_key_invalid'
      logSafeError(error, kind)
      return NextResponse.json({
        configurado: false,
        conectado: false,
        erro: error.code === 'SERVER_ENV_MISSING'
          ? 'Configuração server-side incompleta.'
          : 'A variável server-side do Supabase não contém uma chave secreta válida.',
        diagnostico: { tipo: kind, codigo: error.code },
      }, { status: 503 })
    }

    const kind = classifySupabaseFailure(error)
    const response = FAILURE_RESPONSES[kind]
    const safe = safeSupabaseError(error)
    logSafeError(error, kind)
    return NextResponse.json({
      configurado: true,
      conectado: false,
      erro: response.erro,
      diagnostico: { tipo: kind, codigo: safe.code ?? null },
    }, { status: response.status })
  }
}
