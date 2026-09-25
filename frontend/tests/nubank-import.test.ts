import test from 'node:test'
import assert from 'node:assert/strict'
import { lerOfxConta, lerCsvCartao, uuidImportacao } from '../lib/nubank-import.ts'

const ofx = '<OFX><BANKACCTFROM><ACCTID>ficticia</BANKACCTFROM><BANKTRANLIST><STMTTRN><DTPOSTED>20260901000000<TRNAMT>-20.50<FITID>abc<MEMO>Compra fictícia</STMTTRN></BANKTRANLIST></OFX>'

test('OFX interpreta débito e identifica movimento estável', () => {
  const [item] = lerOfxConta(ofx)
  assert.equal(item.tipo, 'saida')
  assert.equal(item.valor, 20.5)
  assert.equal(item.data, '2026-09-01')
  assert.equal(item.chave, lerOfxConta(ofx)[0].chave)
})
test('OFX rejeita data impossível, falta de conta e identificador duplicado', () => {
  assert.throws(() => lerOfxConta(ofx.replace('20260901', '20260230')))
  assert.throws(() => lerOfxConta(ofx.replace('<ACCTID>ficticia', '')))
  const bloco = ofx.match(/<STMTTRN>.*<\/STMTTRN>/)![0]
  assert.throws(() => lerOfxConta(ofx.replace('</BANKTRANLIST>', `${bloco}</BANKTRANLIST>`)))
})
test('CSV distingue compras positivas de créditos negativos e preserva vírgulas', () => {
  const itens = lerCsvCartao('date,title,amount\r\n2026-09-01,"Loja, filial",20.50\r\n2026-09-02,Estorno,-5.00', 'principal:2026-09')
  assert.equal(itens[0].tipo, 'saida')
  assert.equal(itens[0].descricao, 'Loja, filial')
  assert.equal(itens[1].tipo, 'entrada')
})
test('CSV mantém compras idênticas como ocorrências distintas e rejeita formato estranho', () => {
  const itens = lerCsvCartao('date,title,amount\n2026-09-01,Loja,20\n2026-09-01,Loja,20', 'principal:2026-09')
  assert.notEqual(itens[0].chave, itens[1].chave)
  assert.throws(() => lerCsvCartao('data,valor\n2026-09-01,20', 'principal:2026-09'))
  assert.throws(() => lerCsvCartao('date,title,amount\n2026-09-01,Loja,NaN', 'principal:2026-09'))
})
test('identidade de importação é estável e isolada por usuário', async () => {
  assert.equal(await uuidImportacao('a', 'movimento'), await uuidImportacao('a', 'movimento'))
  assert.notEqual(await uuidImportacao('a', 'movimento'), await uuidImportacao('b', 'movimento'))
})
