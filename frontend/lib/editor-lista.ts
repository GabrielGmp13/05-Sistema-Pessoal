export type CampoLista = {
  chave: string
  rotulo: string
  obrigatorio?: boolean
  url?: boolean
  numero?: boolean
  min?: number
  max?: number
  passo?: number
  cor?: boolean
  estrelas?: boolean
  data?: boolean
}

export function validarCamposLista(campos: CampoLista[], valores: Record<string, string>): string | null {
  for (const campo of campos) {
    const valor = (valores[campo.chave] ?? '').trim()
    if (!valor) {
      if (campo.obrigatorio) return `Preencha ${campo.rotulo.toLocaleLowerCase('pt-BR')}.`
      continue
    }
    if (valor.length > 2000) return `${campo.rotulo}: limite de 2000 caracteres.`
    if (campo.data && (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !Number.isFinite(Date.parse(valor + 'T00:00:00Z')) || new Date(valor + 'T00:00:00Z').toISOString().slice(0, 10) !== valor)) return `${campo.rotulo}: data inválida.`
    if (campo.url) {
      try { if (!['https:', 'http:'].includes(new URL(valor).protocol)) throw new Error() }
      catch { return `${campo.rotulo}: use um endereço http:// ou https://.` }
    }
    if (campo.cor && !/^#[0-9a-f]{6}$/i.test(valor)) return `${campo.rotulo}: use uma cor hexadecimal, como #808080.`
    if (campo.numero) {
      const n = Number(valor)
      if (!Number.isFinite(n) || (campo.min !== undefined && n < campo.min) || (campo.max !== undefined && n > campo.max) || (campo.passo !== undefined && Math.abs(n / campo.passo - Math.round(n / campo.passo)) > 1e-8)) return `${campo.rotulo}: valor fora da faixa ou do intervalo permitido.`
    }
  }
  return null
}
