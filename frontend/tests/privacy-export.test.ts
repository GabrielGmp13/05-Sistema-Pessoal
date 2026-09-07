import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPrivacyExport, privacyExportFilename } from '../lib/privacy-export.ts'

test('exportação inclui perfil próprio sem copiar metadados brutos do provedor', () => {
  const user = {
    email: 'pessoa@example.test',
    created_at: '2026-09-07T12:00:00.000Z',
    last_sign_in_at: '2026-09-07T13:00:00.000Z',
    user_metadata: {
      app_nome: 'Pessoa',
      app_subtitulo: 'Descrição',
      provider_token: 'não deve sair',
    },
  }
  const result = buildPrivacyExport(user as never, {
    versao: 1,
    gerado_em: '2026-09-07T14:00:00.000Z',
    registros: { agenda: [] },
    arquivos: [],
    integracoes_google: [],
  })

  assert.equal(result.conta.email, 'pessoa@example.test')
  assert.equal(result.conta.perfil.nome, 'Pessoa')
  assert.doesNotMatch(JSON.stringify(result), /provider_token|não deve sair/)
})

test('nome do arquivo usa data ISO e extensão JSON', () => {
  assert.equal(privacyExportFilename(new Date('2026-09-07T23:59:00.000Z')), 'projeto-pessoal-dados-2026-09-07.json')
})

