import assert from 'node:assert/strict'
import test from 'node:test'
import { camposParaCardAnki, textoAnki } from '../lib/anki-import.ts'

test('normaliza HTML e entidades de campos do Anki', () => {
  assert.equal(textoAnki('<b>Frente</b><br>linha&nbsp;2 &amp; fim'), 'Frente\nlinha 2 & fim')
})

test('converte card básico e preserva o deck de origem', () => {
  assert.deepEqual(camposParaCardAnki('Pergunta\u001fResposta', '10', 'Biologia', 'Basic'), {
    pergunta: 'Pergunta', resposta: 'Resposta', modulo: 'anki:Biologia', deckId: '10', deck: 'Biologia', modelo: 'Basic',
  })
})

test('converte cloze em pergunta ocultada e resposta completa', () => {
  const card = camposParaCardAnki('A capital é {{c1::Recife::cidade}}.', '20', 'Geografia', 'Cloze')
  assert.equal(card?.pergunta, 'A capital é [cidade].')
  assert.equal(card?.resposta, 'A capital é Recife.')
})
