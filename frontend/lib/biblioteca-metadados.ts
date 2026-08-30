export type FonteMetadados =
  | 'youtube'
  | 'tmdb_filme'
  | 'tmdb_serie'
  | 'google_livros'
  | 'jikan_anime'
  | 'jikan_manga'
  | 'anilist_relacoes'
  | 'anilist_detalhe'
  | 'musica'
  | 'itunes_podcast'
  | 'artigo';

export interface ResultadoMetadados {
  id: string;
  titulo: string;
  subtitulo?: string;
  autor?: string;
  descricao?: string;
  capaUrl?: string;
  bannerUrl?: string;
  ano?: number;
  duracaoMinutos?: number;
  duracaoSegundos?: number;
  linkOficial?: string;
  identificadorExterno?: string;
  isbn?: string;
  editora?: string;
  idioma?: string;
  paginas?: number;
  diretor?: string;
  roteirista?: string;
  produtores?: string;
  estudio?: string;
  generos?: string[];
  elenco?: Array<{ ator: string; personagem?: string; fotoUrl?: string }>;
  classificacaoIndicativa?: string;
  anoTermino?: number;
  statusPublicacao?: 'em_andamento' | 'concluida' | 'hiato' | 'cancelada';
  siteOrigem?: string;
  anilistId?: string;
  malId?: string;
  episodios?: number;
  formato?: string;
  tipoRelacao?: string;
  characterDesigner?: string;
  animadorChefe?: string;
  compositor?: string;
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

export async function completarResultadoAniList(resultado: ResultadoMetadados): Promise<ResultadoMetadados> {
  let completo = resultado;
  try {
    if (resultado.anilistId) {
      const detalhe = await buscarMetadados('anilist_detalhe', resultado.anilistId);
      if (detalhe.resultados[0]) completo = { ...resultado, ...detalhe.resultados[0], tipoRelacao: resultado.tipoRelacao };
    }
  } catch { /* A obra continua utilizável com os dados da busca. */ }
  if (completo.diretor && completo.roteirista && completo.produtores && completo.estudio) return completo;
  try {
    const tmdb = await buscarMetadados('tmdb_serie', completo.subtitulo ?? completo.titulo);
    const candidato = tmdb.resultados.find((item) => !completo.ano || !item.ano || Math.abs(item.ano - completo.ano) <= 1) ?? tmdb.resultados[0];
    if (candidato) completo = {
      ...completo,
      diretor: completo.diretor ?? candidato.diretor,
      roteirista: completo.roteirista ?? candidato.roteirista,
      produtores: completo.produtores ?? candidato.produtores,
      estudio: completo.estudio ?? candidato.estudio,
    };
  } catch { /* TMDB é complemento opcional. */ }
  return completo;
}
