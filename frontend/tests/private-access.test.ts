import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const passwordForm = readFileSync(new URL('../app/configuracoes/PasswordChangeForm.tsx', import.meta.url), 'utf8')
const login = readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8')

test('piloto privado mantém cadastro público oculto e permite trocar senha temporária', () => {
  assert.match(login, /NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED/)
  assert.match(login, /Novas contas são liberadas manualmente por Gabriel/)
  assert.match(passwordForm, /current_password: senhaAtual/)
  assert.match(passwordForm, /novaSenha\.length < 12/)
  assert.match(passwordForm, /autoComplete="current-password"/)
  assert.match(passwordForm, /autoComplete="new-password"/)
})
