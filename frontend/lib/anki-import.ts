export interface AnkiCardPreview {
  pergunta: string
  resposta: string | null
  modulo: string | null
  deckId: string
  deck: string
  modelo: string
}

export function textoAnki(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function frenteCloze(value: string) {
  return value.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/gi, (_match, _answer: string, hint?: string) => hint ? `[${hint}]` : '[…]')
}

function versoCloze(value: string) {
  return value.replace(/\{\{c\d+::(.*?)(?:::(.*?))?\}\}/gi, '$1')
}

export function camposParaCardAnki(fieldsValue: string, deckId: string, deck: string, model: string): AnkiCardPreview | null {
  const fields = fieldsValue.split('\u001f')
  const frontRaw = fields[0] ?? ''
  const backRaw = fields.slice(1).filter(Boolean).join('\n')
  const cloze = /\{\{c\d+::/i.test(frontRaw)
  const pergunta = textoAnki(cloze ? frenteCloze(frontRaw) : frontRaw)
  const resposta = textoAnki(cloze ? versoCloze(frontRaw) : backRaw) || null
  if (!pergunta) return null
  return { pergunta, resposta, modulo: `anki:${deck}`, deckId, deck, modelo: model }
}
