// Somente códigos estáveis: message/details/hint podem conter dados pessoais.
export function diagnosticCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null
  const code = error.code
  return typeof code === 'string' && /^(?:[0-9A-Z]{5}|PGRST\d{3}|SERVER_ENV_MISSING|SERVER_KEY_TYPE_INVALID)$/.test(code)
    ? code : null
}

export function diagnosticSummary(error: unknown) {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : null
  return {
    code: diagnosticCode(error),
    status: typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 ? status : null,
  }
}

export function logDiagnostic(context: string, error: unknown) {
  // Callers legados interpolam paths/UUIDs entre parênteses; nunca registrá-los.
  const operation = context.split('(')[0]
  const label = /^[a-zA-Z0-9_./:-]{1,100}$/.test(operation) ? operation : 'operacao'
  console.error(`[${label}] Falha na operação.`, diagnosticSummary(error))
}
