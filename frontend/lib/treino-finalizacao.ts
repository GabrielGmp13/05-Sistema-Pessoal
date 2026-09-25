interface ResultadoGravacao { error: string | null; aviso?: string }

/** Só encerra a sessão depois de todas as execuções terem sido confirmadas. */
export async function finalizarComExecucoes(
  gravacoes: Array<() => Promise<ResultadoGravacao>>,
  finalizar: () => Promise<ResultadoGravacao>,
): Promise<ResultadoGravacao> {
  try {
    for (const gravar of gravacoes) {
      const resultado = await gravar()
      if (resultado.error) return { error: 'Uma execução não foi salva. Tente finalizar novamente.' }
    }
    const resultado = await finalizar()
    return resultado
  } catch {
    return { error: 'A conexão foi interrompida. Mantenha esta página aberta e tente finalizar novamente.' }
  }
}
