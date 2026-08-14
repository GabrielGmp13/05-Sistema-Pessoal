export type OrdenacaoBiblioteca =
  | 'recentes'
  | 'titulo'
  | 'nota'
  | 'favoritos'
  | 'status';

interface CamposOrdenacao<T> {
  titulo: (item: T) => string;
  atualizadoEm: (item: T) => string;
  nota?: (item: T) => number | null;
  favorito: (item: T) => boolean;
  status: (item: T) => string;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function ordenarItensBiblioteca<T>(
  itens: T[],
  ordenacao: OrdenacaoBiblioteca,
  campos: CamposOrdenacao<T>,
) {
  const porTitulo = (a: T, b: T) => collator.compare(campos.titulo(a), campos.titulo(b));
  const porRecencia = (a: T, b: T) =>
    new Date(campos.atualizadoEm(b)).getTime() - new Date(campos.atualizadoEm(a)).getTime();

  return [...itens].sort((a, b) => {
    if (ordenacao === 'titulo') return porTitulo(a, b);
    if (ordenacao === 'nota' && campos.nota) {
      const diferenca = (campos.nota(b) ?? -1) - (campos.nota(a) ?? -1);
      return diferenca || porTitulo(a, b);
    }
    if (ordenacao === 'favoritos') {
      const diferenca = Number(campos.favorito(b)) - Number(campos.favorito(a));
      return diferenca || porRecencia(a, b) || porTitulo(a, b);
    }
    if (ordenacao === 'status') {
      return collator.compare(campos.status(a), campos.status(b)) || porTitulo(a, b);
    }
    return porRecencia(a, b) || porTitulo(a, b);
  });
}
