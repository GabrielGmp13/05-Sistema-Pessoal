import assert from 'node:assert/strict'
import test from 'node:test'

import { otimizarImagem } from '../lib/image-optimization.ts'

test('preserva GIF para não destruir animação', async () => {
  const gif = new File([Uint8Array.from([71, 73, 70, 56, 57, 97])], 'exercicio.gif', { type: 'image/gif' })
  const result = await otimizarImagem(gif)

  assert.equal(result.file, gif)
  assert.equal(result.optimized, false)
  assert.equal(result.finalBytes, gif.size)
})

test('mantém o original quando o ambiente não consegue decodificar a imagem', async () => {
  const jpeg = new File([Uint8Array.from([255, 216, 255])], 'foto.jpg', { type: 'image/jpeg' })
  const result = await otimizarImagem(jpeg)

  assert.equal(result.file, jpeg)
  assert.equal(result.optimized, false)
  assert.equal(result.originalBytes, jpeg.size)
})
