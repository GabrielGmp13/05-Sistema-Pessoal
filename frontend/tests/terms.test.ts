import assert from 'node:assert/strict'
import test from 'node:test'
import { TERMS_VERSION, hasAcceptedTerms } from '../lib/terms.ts'

test('somente a versão atual dos termos libera o início da conta', () => {
  assert.equal(hasAcceptedTerms(null), false)
  assert.equal(hasAcceptedTerms({}), false)
  assert.equal(hasAcceptedTerms({ terms_version: 'antiga' }), false)
  assert.equal(hasAcceptedTerms({ terms_version: TERMS_VERSION }), true)
})
