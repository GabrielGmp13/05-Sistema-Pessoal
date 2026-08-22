import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifySupabaseFailure,
  classifySupabaseServiceKey,
  safeSupabaseError,
} from '../lib/supabase-diagnostics.ts'

function legacyKey(role: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'HS256' })}.${part({ role })}.assinatura-de-teste`
}

test('aceita os dois formatos secretos e rejeita formatos públicos conhecidos', () => {
  assert.equal(classifySupabaseServiceKey('sb_secret_valor-de-teste'), 'secret')
  assert.equal(classifySupabaseServiceKey(legacyKey('service_role')), 'legacy-service-role')
  assert.equal(classifySupabaseServiceKey('sb_publishable_valor-de-teste'), 'public')
  assert.equal(classifySupabaseServiceKey(legacyKey('anon')), 'public')
})

test('classifica erros estáveis do PostgREST e PostgreSQL', () => {
  assert.equal(classifySupabaseFailure({ code: 'PGRST301', message: 'JWT inválido' }), 'service_key_invalid')
  assert.equal(classifySupabaseFailure({ code: 'PGRST205', message: 'Tabela ausente' }), 'table_missing')
  assert.equal(classifySupabaseFailure({ code: 'PGRST204', message: 'Coluna ausente' }), 'column_missing')
  assert.equal(classifySupabaseFailure({ code: '42501', message: 'Permissão negada' }), 'permission_denied')
  assert.equal(classifySupabaseFailure(new Error('Falha de rede')), 'unexpected')
})

test('extrai somente campos textuais seguros para log', () => {
  assert.deepEqual(safeSupabaseError({
    message: 'Falha',
    code: '42501',
    details: 'Detalhe seguro',
    hint: 'Dica segura',
    token: 'não deve sair',
  }), {
    message: 'Falha',
    code: '42501',
    details: 'Detalhe seguro',
    hint: 'Dica segura',
  })
})
