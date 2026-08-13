export type FonteMetadados =
  | 'youtube'
  | 'tmdb_filme'
  | 'tmdb_serie'
  | 'google_livros'
  | 'jikan_anime'
  | 'jikan_manga'
  | 'itunes_podcast';

export interface ResultadoMetadados {
  id: string;
  titulo: string;
  subtitulo?: string;
  autor?: string;
  descricao?: string;
  capaUrl?: string;
  bannerUrl?: string;
  ano?: number;
  duracaoSegundos?: number;
  linkOficial?: string;
  identificadorExterno?: string;
  isbn?: string;
  editora?: string;
  idioma?: string;
  paginas?: number;
}

interface RespostaMetadados {
  disponivel: boolean;
  resultados: ResultadoMetadados[];
  mensagem?: string;
}

export async function buscarMetadados(
  fonte: FonteMetadados,
  termo: string,
  signal?: AbortSignal
): Promise<RespostaMetadados> {
  const params = new URLSearchParams({ fonte, q: termo.trim() });
  const response = await fetch(`/api/biblioteca/metadados?${params.toString()}`, { signal });
  const data = (await response.json()) as RespostaMetadados & { erro?: string };

  if (!response.ok) {
    throw new Error(data.erro ?? 'Não foi possível buscar os metadados.');
  }

  return data;
}
