import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extrairYoutubePlaylistId,
  mensagemPlaylistInacessivel,
  urlCanonicaPlaylist,
} from '../lib/youtube-playlists.ts'

test('extrai playlist de URLs playlist e watch do YouTube', () => {
  const id = 'PL1234567890abc'
  assert.equal(extrairYoutubePlaylistId(`https://www.youtube.com/playlist?list=${id}`), id)
  assert.equal(extrairYoutubePlaylistId(`https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${id}`), id)
  assert.equal(extrairYoutubePlaylistId(`https://youtu.be/dQw4w9WgXcQ?list=${id}`), id)
})

test('rejeita origem falsa, link sem lista e playlist curta inválida', () => {
  assert.equal(extrairYoutubePlaylistId('https://youtube.com.evil.test/playlist?list=PL1234567890abc'), null)
  assert.equal(extrairYoutubePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), null)
  assert.equal(extrairYoutubePlaylistId('https://www.youtube.com/playlist?list=abc'), null)
})

test('explica a limitação oficial de Assistir mais tarde', () => {
  assert.match(mensagemPlaylistInacessivel('WL'), /limitação do provedor/)
  assert.equal(urlCanonicaPlaylist('PL1234567890abc'), 'https://www.youtube.com/playlist?list=PL1234567890abc')
})
