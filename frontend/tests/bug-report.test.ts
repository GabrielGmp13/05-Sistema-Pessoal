import assert from 'node:assert/strict'
import test from 'node:test'
import { BUG_THEMES, formatBugReport, type BugReportInput } from '../lib/bug-report.ts'

const input: BugReportInput = {
  modulo: 'Biblioteca', tentativa: ' Adicionar temporada ', esperado: 'Salvar',
  ocorrido: 'Botão sem resposta', ambiente: 'Firefox / Windows / 100%', tema: 'Lua', print: 'sim',
}
const date = new Date('2026-08-31T12:00:00Z')

test('relato contém os campos informados, versão, data e aviso de que nada foi enviado', () => {
  const report = formatBugReport(input, '0.2.0', date)
  for (const value of ['v0.2.0', date.toISOString(), 'Biblioteca', 'Adicionar temporada', 'Salvar', 'Botão sem resposta', 'Firefox / Windows / 100%', 'Lua', 'após ocultar dados pessoais', 'Nenhum anexo']) {
    assert.ok(report.includes(value), value)
  }
  assert.ok(!report.includes(' Adicionar temporada '))
})

test('campos obrigatórios vazios e textos acima do limite não geram relato', () => {
  for (const field of ['modulo', 'tentativa', 'esperado', 'ocorrido', 'ambiente', 'tema']) {
    assert.throws(() => formatBugReport({ ...input, [field]: '   ' }, '0.2.0', date), /Preencha/)
  }
  assert.throws(() => formatBugReport({ ...input, ocorrido: 'a'.repeat(2001) }, '0.2.0', date), /2.000/)
})

test('print é uma disponibilidade declarada e todos os temas atuais têm rótulo', () => {
  assert.match(formatBugReport({ ...input, print: 'nao' }, '0.2.0', date), /Não posso enviar print/)
  assert.match(formatBugReport({ ...input, print: 'nao-sei' }, '0.2.0', date), /Ainda não sei/)
  assert.deepEqual(Object.keys(BUG_THEMES), ['claro', 'suave', 'nublado', 'estrelado', 'escuro'])
})
