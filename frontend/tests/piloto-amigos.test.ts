import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { GOOGLE_PLACES_HABILITADO } from '../lib/integracoes-disponibilidade.ts'

test('cadastro de redação oferece MEC Enem sem enviar conteúdo do usuário', () => {
  const source = readFileSync(new URL('../app/estudos/redacoes/page.tsx', import.meta.url), 'utf8')
  assert.match(source, /href="https:\/\/app\.mecenem\.mec\.gov\.br\/" target="_blank" rel="noopener noreferrer"/)
  assert.match(source, /Nenhum texto ou arquivo seu é enviado pelo Sistema Pessoal/)
  assert.match(source, /nota é estimada, não a nota oficial/)
})

test('Places permanece desligado mesmo se uma chave for configurada', () => {
  assert.equal(GOOGLE_PLACES_HABILITADO, false)
  const source = readFileSync(new URL('../app/api/lugares/google-places/route.ts', import.meta.url), 'utf8')
  const guard = source.indexOf('if (!GOOGLE_PLACES_HABILITADO) return')
  assert.ok(guard > source.indexOf('if (!user) return'))
  assert.ok(guard < source.indexOf('const apiKey'))
  assert.ok(guard < source.indexOf('await fetch('))
})
