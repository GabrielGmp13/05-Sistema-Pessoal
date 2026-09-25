export type OrigemNubank = 'conta-ofx' | 'cartao-csv'

/** Sugestão conservadora: o usuário confirma; não identifica transferência pela quantia. */
export function possivelPagamentoFatura(descricao: string): boolean {
  const texto = descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return /pagamento\s+(?:(?:da|de|do)\s+)?(?:fatura|cartao)|pagamento\s+(?:recebido|efetuado)/.test(texto)
}

export interface MovimentoNubank {
  chave: string
  origem: OrigemNubank
  data: string
  descricao: string
  tipo: 'entrada' | 'saida'
  valor: number
}

function dataIso(valor: string): string {
  const match = valor.trim().match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/)
  if (!match) throw new Error(`Data inválida no arquivo: ${valor}`)
  const [, ano, mes, dia] = match
  const iso = `${ano}-${mes}-${dia}`
  if (new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso) throw new Error(`Data inválida no arquivo: ${valor}`)
  return iso
}

function quantia(valor: string): { tipo: 'entrada' | 'saida'; valor: number } {
  const limpo = valor.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(limpo)) throw new Error(`Valor inválido no arquivo: ${valor}`)
  const numero = Number(limpo)
  if (!Number.isFinite(numero) || numero === 0 || Math.abs(numero) > 9999999999.99) throw new Error(`Valor inválido no arquivo: ${valor}`)
  return { tipo: numero < 0 ? 'saida' : 'entrada', valor: Math.abs(numero) }
}

function tag(bloco: string, nome: string): string {
  const resultado = bloco.match(new RegExp(`<${nome}>([^<\r\n]+)`, 'i'))
  return resultado?.[1].trim() ?? ''
}

export function lerOfxConta(conteudo: string): MovimentoNubank[] {
  if (!/<OFX>/i.test(conteudo) || !/<BANKTRANLIST>/i.test(conteudo)) throw new Error('Selecione um extrato OFX da conta, não um arquivo da fatura.')
  const conta = tag(conteudo, 'ACCTID')
  if (!conta) throw new Error('O extrato OFX não informa a conta; não é seguro evitar duplicatas.')
  const blocos = [...conteudo.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi)]
  if (!blocos.length || blocos.length > 500) throw new Error('O extrato precisa conter de 1 a 500 movimentos.')
  const chaves = new Set<string>()
  return blocos.map(([, bloco]) => {
    const fitid = tag(bloco, 'FITID')
    const descricao = (tag(bloco, 'NAME') || tag(bloco, 'MEMO')).slice(0, 500)
    if (!fitid || !descricao || chaves.has(fitid)) throw new Error('Há movimento sem identificador/descrição ou identificador repetido no OFX.')
    chaves.add(fitid)
    return { chave: `ofx:${conta}:${fitid}`, origem: 'conta-ofx', data: dataIso(tag(bloco, 'DTPOSTED')), descricao, ...quantia(tag(bloco, 'TRNAMT')) }
  })
}

function linhasCsv(texto: string): string[][] {
  const resultado: string[][] = []
  let linha: string[] = []
  let campo = ''
  let aspas = false
  for (let i = 0; i < texto.length; i++) {
    const char = texto[i]
    if (char === '"') {
      if (aspas && texto[i + 1] === '"') { campo += '"'; i++ } else aspas = !aspas
    } else if (char === ',' && !aspas) { linha.push(campo); campo = '' }
    else if ((char === '\n' || char === '\r') && !aspas) {
      if (char === '\r' && texto[i + 1] === '\n') i++
      linha.push(campo); if (linha.some((celula) => celula.trim())) resultado.push(linha)
      linha = []; campo = ''
    } else campo += char
  }
  if (aspas) throw new Error('CSV da fatura contém aspas não fechadas.')
  linha.push(campo); if (linha.some((celula) => celula.trim())) resultado.push(linha)
  return resultado
}

export function lerCsvCartao(conteudo: string, identificadorFatura: string): MovimentoNubank[] {
  const linhas = linhasCsv(conteudo.replace(/^\uFEFF/, ''))
  if (linhas.length < 2 || linhas.length > 501) throw new Error('A fatura CSV precisa conter de 1 a 500 movimentos.')
  const cabecalho = linhas[0].map((campo) => campo.trim().toLowerCase())
  const indices = ['date', 'title', 'amount'].map((campo) => cabecalho.indexOf(campo))
  if (indices.some((indice) => indice < 0)) throw new Error('CSV da fatura não reconhecido. Esperado: date,title,amount. Não use CSV da conta neste campo.')
  if (!identificadorFatura.trim()) throw new Error('Informe o mês da fatura para distinguir cartões e faturas.')
  const ocorrencias = new Map<string, number>()
  return linhas.slice(1).map((linha) => {
    if (linha.length !== cabecalho.length) throw new Error('CSV da fatura contém uma linha com número incorreto de colunas.')
    const data = dataIso(linha[indices[0]])
    const descricao = linha[indices[1]].trim().slice(0, 500)
    if (!descricao) throw new Error('Há compra sem descrição na fatura.')
    const quantiaCsv = quantia(linha[indices[2]])
    // Na fatura Nubank, valores positivos são compras; negativos são estornos.
    const valor = { valor: quantiaCsv.valor, tipo: quantiaCsv.tipo === 'entrada' ? 'saida' as const : 'entrada' as const }
    const base = `${data}:${descricao}:${valor.tipo}:${valor.valor.toFixed(2)}`
    const ocorrencia = (ocorrencias.get(base) ?? 0) + 1
    ocorrencias.set(base, ocorrencia)
    return { chave: `csv:${identificadorFatura.trim()}:${base}:${ocorrencia}`, origem: 'cartao-csv', data, descricao, ...valor }
  })
}

export async function uuidImportacao(userId: string, chave: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${userId}\0${chave}`)))
  const hex = Array.from(hash, (valor) => valor.toString(16).padStart(2, '0')).join('')
  return `nubank-${hex}`
}
