import type { ResultadoMetadados } from './biblioteca-metadados'

function decodificarHtml(valor?: string): string | undefined {
  return valor?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() || undefined
}

function meta(html: string, chave: string): string | undefined {
  const escaped = chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const padroes = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  return decodificarHtml(padroes.map((padrao) => html.match(padrao)?.[1]).find(Boolean))
}

export function extrairMetadadosArtigoHtml(html: string, url: URL): ResultadoMetadados | null {
  const titulo = meta(html, 'og:title') ?? decodificarHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  if (!titulo) return null
  const texto = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const palavras = texto ? texto.split(/\s+/).length : 0
  return {
    id: url.toString(),
    titulo,
    autor: meta(html, 'article:author') ?? meta(html, 'author'),
    descricao: meta(html, 'og:description') ?? meta(html, 'description'),
    capaUrl: meta(html, 'og:image'),
    siteOrigem: meta(html, 'og:site_name') ?? url.hostname.replace(/^www\./, ''),
    duracaoMinutos: palavras >= 100 ? Math.max(1, Math.ceil(palavras / 220)) : undefined,
    linkOficial: url.toString(),
  }
}
