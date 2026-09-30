const PREFIXO = 'sistema-pessoal:descricao-oculta:'

export function chaveDescricao(pathname: string): string {
  return `${PREFIXO}${pathname}`
}

export function restaurarDescricoes(storage: Storage): void {
  for (let indice = storage.length - 1; indice >= 0; indice--) {
    const chave = storage.key(indice)
    if (chave?.startsWith(PREFIXO)) storage.removeItem(chave)
  }
}
