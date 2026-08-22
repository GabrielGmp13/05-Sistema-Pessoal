import assert from 'node:assert/strict'
import test from 'node:test'
import { extrairMetadadosArtigoHtml } from '../lib/article-metadata.ts'

test('extrai Open Graph independentemente da ordem dos atributos', () => {
  const html = `<html><head><meta content="Título &amp; teste" property="og:title"><meta name="author" content="Gabriel"><meta property="og:site_name" content="Portal"><meta property="og:image" content="https://cdn.example/capa.jpg"></head><body>${'palavra '.repeat(221)}</body></html>`
  const resultado = extrairMetadadosArtigoHtml(html, new URL('https://example.com/post'))
  assert.equal(resultado?.titulo, 'Título & teste')
  assert.equal(resultado?.autor, 'Gabriel')
  assert.equal(resultado?.siteOrigem, 'Portal')
  assert.equal(resultado?.capaUrl, 'https://cdn.example/capa.jpg')
  assert.equal(resultado?.duracaoMinutos, 2)
})

test('usa title e hostname como fallback manual', () => {
  const resultado = extrairMetadadosArtigoHtml('<title>Artigo simples</title>', new URL('https://www.exemplo.com/a'))
  assert.equal(resultado?.titulo, 'Artigo simples')
  assert.equal(resultado?.siteOrigem, 'exemplo.com')
  assert.equal(resultado?.duracaoMinutos, undefined)
})
