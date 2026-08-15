export interface FlashcardImportado {
  pergunta: string
  resposta: string | null
  modulo: string | null
}

const LIMITE_LINHAS = 500
const LIMITE_BYTES = 1024 * 1024

function normalizarCabecalho(valor: string) {
  return valor.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function escolherSeparador(primeiraLinha: string) {
  const candidatos = ['\t', ',', ';']
  return candidatos.reduce((melhor, atual) => {
    const ocorrencias = primeiraLinha.split(atual).length
    return ocorrencias > primeiraLinha.split(melhor).length ? atual : melhor
  }, ',')
}

function separar(texto: string, separador: string) {
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let entreAspas = false

  for (let indice = 0; indice < texto.length; indice += 1) {
    const caractere = texto[indice]
    const proximo = texto[indice + 1]

    if (caractere === '"') {
      if (entreAspas && proximo === '"') {
        campo += '"'
        indice += 1
      } else {
        entreAspas = !entreAspas
      }
    } else if (caractere === separador && !entreAspas) {
      linha.push(campo)
      campo = ''
    } else if ((caractere === '\n' || caractere === '\r') && !entreAspas) {
      if (caractere === '\r' && proximo === '\n') indice += 1
      linha.push(campo)
      if (linha.some((valor) => valor.trim())) linhas.push(linha)
      linha = []
      campo = ''
    } else {
      campo += caractere
    }
  }

  if (entreAspas) throw new Error('O arquivo tem aspas abertas sem fechamento.')
  linha.push(campo)
  if (linha.some((valor) => valor.trim())) linhas.push(linha)
  return linhas
}

export function analisarFlashcards(textoOriginal: string, tamanhoBytes: number): FlashcardImportado[] {
  if (tamanhoBytes > LIMITE_BYTES) throw new Error('O arquivo deve ter no máximo 1 MB.')
  const texto = textoOriginal.replace(/^\uFEFF/, '')
  const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? ''
  const linhas = separar(texto, escolherSeparador(primeiraLinha))
  if (linhas.length < 2) throw new Error('Inclua um cabeçalho e ao menos um card.')

  const cabecalhos = linhas[0].map(normalizarCabecalho)
  const indicePergunta = cabecalhos.indexOf('pergunta')
  const indiceResposta = cabecalhos.indexOf('resposta')
  const indiceModulo = cabecalhos.indexOf('modulo')
  if (indicePergunta < 0 || indiceResposta < 0) throw new Error('O cabeçalho deve conter pergunta e resposta.')
  if (linhas.length - 1 > LIMITE_LINHAS) throw new Error(`Importe no máximo ${LIMITE_LINHAS} cards por arquivo.`)

  const cards = linhas.slice(1).map((linha) => ({
    pergunta: (linha[indicePergunta] ?? '').trim(),
    resposta: (linha[indiceResposta] ?? '').trim() || null,
    modulo: indiceModulo >= 0 ? (linha[indiceModulo] ?? '').trim() || null : null,
  })).filter((card) => card.pergunta)

  if (cards.length === 0) throw new Error('Nenhuma pergunta válida foi encontrada.')
  return cards
}
