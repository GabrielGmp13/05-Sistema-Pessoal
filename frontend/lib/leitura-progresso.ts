export function calcularPagina(atual: number, valor: number, modo: 'adicionar' | 'definir', total: number | null): number {
  if (!Number.isSafeInteger(valor) || valor < 0 || (modo === 'adicionar' && valor === 0)) throw new Error('Informe um número inteiro de páginas válido.')
  const pagina = modo === 'adicionar' ? atual + valor : valor
  if (!Number.isSafeInteger(pagina) || pagina > 2147483647 || pagina < 0 || (total != null && pagina > total)) throw new Error('A página informada ultrapassa o limite do livro.')
  return pagina
}
