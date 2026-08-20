import { NextRequest, NextResponse } from 'next/server';

import type { FonteMetadados, ResultadoMetadados } from '@/lib/biblioteca-metadados';
import { extrairYoutubeId } from '@/lib/videos';

const FONTES: FonteMetadados[] = [
  'youtube',
  'tmdb_filme',
  'tmdb_serie',
  'google_livros',
  'jikan_anime',
  'jikan_manga',
  'itunes_podcast',
];

function ano(valor?: string | null): number | undefined {
  const resultado = valor?.match(/^\d{4}/)?.[0];
  return resultado ? Number(resultado) : undefined;
}

function duracaoIso8601(valor?: string): number | undefined {
  const partes = valor?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!partes) return undefined;
  return Number(partes[1] ?? 0) * 3600 + Number(partes[2] ?? 0) * 60 + Number(partes[3] ?? 0);
}

function duracaoJikanEmMinutos(valor?: string | null): number | undefined {
  if (!valor || valor.toLowerCase() === 'unknown') return undefined;
  const horas = Number(valor.match(/(\d+)\s*hr/)?.[1] ?? 0);
  const minutos = Number(valor.match(/(\d+)\s*min/)?.[1] ?? 0);
  const total = horas * 60 + minutos;
  return total > 0 ? total : undefined;
}

async function jsonExterno(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Sistema-Pessoal/2.0',
      },
    });
  } catch {
    console.error('[biblioteca/metadados] Falha ao acessar serviço externo:', new URL(url).hostname);
    throw new Error('Serviço externo temporariamente indisponível.');
  }
  if (!response.ok) throw new Error(`Serviço externo respondeu com status ${response.status}`);
  return response.json();
}

async function buscarYoutube(q: string): Promise<ResultadoMetadados[] | null> {
  const chave = process.env.YOUTUBE_API_KEY;
  if (!chave) return null;
  const idDaUrl = extrairYoutubeId(q);
  let ids = idDaUrl ? [idDaUrl] : [];

  if (ids.length === 0) {
    const buscaParams = new URLSearchParams({
      part: 'snippet',
      q,
      key: chave,
      type: 'video',
      maxResults: '6',
    });
    const busca = (await jsonExterno(`https://www.googleapis.com/youtube/v3/search?${buscaParams}`)) as {
      items?: Array<{ id?: { videoId?: string } }>;
    };
    ids = (busca.items ?? []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
  }

  if (ids.length === 0) return [];
  const params = new URLSearchParams({ part: 'snippet,contentDetails', id: ids.join(','), key: chave });
  const data = (await jsonExterno(`https://www.googleapis.com/youtube/v3/videos?${params}`)) as {
    items?: Array<{
      id: string;
      snippet?: { title?: string; channelTitle?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } };
      contentDetails?: { duration?: string };
    }>;
  };

  return (data.items ?? []).map((item) => ({
    id: item.id,
    titulo: item.snippet?.title ?? 'Vídeo sem título',
    autor: item.snippet?.channelTitle,
    capaUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url,
    duracaoSegundos: duracaoIso8601(item.contentDetails?.duration),
    identificadorExterno: item.id,
    linkOficial: `https://www.youtube.com/watch?v=${item.id}`,
  }));
}

async function buscarTmdb(q: string, serie: boolean): Promise<ResultadoMetadados[] | null> {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) return null;
  const tipo = serie ? 'tv' : 'movie';
  const params = new URLSearchParams({ api_key: chave, language: 'pt-BR', query: q, include_adult: 'false' });
  const data = (await jsonExterno(`https://api.themoviedb.org/3/search/${tipo}?${params}`)) as {
    results?: Array<{
      id: number;
      title?: string;
      name?: string;
      original_title?: string;
      original_name?: string;
      overview?: string;
      poster_path?: string | null;
      backdrop_path?: string | null;
      release_date?: string;
      first_air_date?: string;
    }>;
  };

  const resultados = (data.results ?? []).slice(0, 6);
  const detalhes = await Promise.allSettled(resultados.map(async (item) => {
    const detalheParams = new URLSearchParams({
      api_key: chave,
      language: 'pt-BR',
      append_to_response: serie ? 'credits,content_ratings' : 'credits,release_dates',
    });
    return await jsonExterno(`https://api.themoviedb.org/3/${tipo}/${item.id}?${detalheParams}`) as {
      runtime?: number | null;
      episode_run_time?: number[];
      last_air_date?: string | null;
      created_by?: Array<{ name?: string }>;
      production_companies?: Array<{ name?: string }>;
      credits?: { crew?: Array<{ name?: string; job?: string }> };
      content_ratings?: { results?: Array<{ iso_3166_1?: string; rating?: string }> };
      release_dates?: { results?: Array<{ iso_3166_1?: string; release_dates?: Array<{ certification?: string }> }> };
    };
  }));

  return resultados.map((item, indice) => {
    const detalhe = detalhes[indice]?.status === 'fulfilled' ? detalhes[indice].value : undefined;
    const duracaoMinutos = serie
      ? detalhe?.episode_run_time?.find((duracao) => duracao > 0)
      : detalhe?.runtime ?? undefined;
    const equipe = detalhe?.credits?.crew ?? [];
    const diretores = serie
      ? detalhe?.created_by?.map((pessoa) => pessoa.name).filter(Boolean)
      : equipe.filter((pessoa) => pessoa.job === 'Director').map((pessoa) => pessoa.name).filter(Boolean);
    const roteiristas = equipe
      .filter((pessoa) => pessoa.job === 'Screenplay' || pessoa.job === 'Writer')
      .map((pessoa) => pessoa.name)
      .filter(Boolean);
    const produtores = equipe
      .filter((pessoa) => pessoa.job === 'Producer' || pessoa.job === 'Executive Producer')
      .map((pessoa) => pessoa.name)
      .filter(Boolean);
    const classificacao = serie
      ? detalhe?.content_ratings?.results?.find((valor) => valor.iso_3166_1 === 'BR')?.rating
      : detalhe?.release_dates?.results
        ?.find((valor) => valor.iso_3166_1 === 'BR')
        ?.release_dates?.find((valor) => valor.certification)?.certification;
    return {
      id: String(item.id),
      titulo: item.title ?? item.name ?? 'Título não informado',
      subtitulo: item.original_title ?? item.original_name,
      descricao: item.overview || undefined,
      capaUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
      bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
      ano: ano(item.release_date ?? item.first_air_date),
      duracaoMinutos,
      identificadorExterno: String(item.id),
      diretor: diretores?.join(', ') || undefined,
      roteirista: roteiristas.join(', ') || undefined,
      produtores: produtores.join(', ') || undefined,
      estudio: detalhe?.production_companies?.map((empresa) => empresa.name).filter(Boolean).join(', ') || undefined,
      classificacaoIndicativa: classificacao || undefined,
      anoTermino: serie ? ano(detalhe?.last_air_date) : undefined,
    };
  });
}

async function buscarGoogleLivros(q: string): Promise<ResultadoMetadados[]> {
  const params = new URLSearchParams({ q, maxResults: '6', printType: 'books' });
  const data = (await jsonExterno(`https://www.googleapis.com/books/v1/volumes?${params}`)) as {
    items?: Array<{
      id: string;
      volumeInfo?: {
        title?: string;
        subtitle?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        pageCount?: number;
        language?: string;
        description?: string;
        infoLink?: string;
        imageLinks?: { thumbnail?: string };
        industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
      };
    }>;
  };

  return (data.items ?? []).map((item) => {
    const info = item.volumeInfo ?? {};
    const isbn = info.industryIdentifiers?.find((valor) => valor.type === 'ISBN_13')?.identifier
      ?? info.industryIdentifiers?.find((valor) => valor.type === 'ISBN_10')?.identifier;
    return {
      id: item.id,
      titulo: info.title ?? 'Livro sem título',
      subtitulo: info.subtitle,
      autor: info.authors?.join(', '),
      descricao: info.description,
      capaUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://'),
      ano: ano(info.publishedDate),
      identificadorExterno: item.id,
      isbn,
      editora: info.publisher,
      idioma: info.language,
      paginas: info.pageCount,
      linkOficial: info.infoLink,
    };
  });
}

async function buscarJikan(q: string, manga: boolean): Promise<ResultadoMetadados[]> {
  const tipo = manga ? 'manga' : 'anime';
  const params = new URLSearchParams({ q, limit: '6', sfw: 'true' });
  const data = (await jsonExterno(`https://api.jikan.moe/v4/${tipo}?${params}`)) as {
    data?: Array<{
      mal_id: number;
      title?: string;
      title_english?: string | null;
      synopsis?: string | null;
      url?: string;
      year?: number | null;
      published?: { from?: string | null; to?: string | null };
      aired?: { from?: string | null; to?: string | null };
      status?: string | null;
      rating?: string | null;
      images?: { jpg?: { large_image_url?: string; image_url?: string } };
      authors?: Array<{ name?: string }>;
      studios?: Array<{ name?: string }>;
      producers?: Array<{ name?: string }>;
      licensors?: Array<{ name?: string }>;
      serializations?: Array<{ name?: string }>;
      duration?: string | null;
    }>;
  };

  return (data.data ?? []).map((item) => ({
    id: String(item.mal_id),
    titulo: item.title ?? 'Título não informado',
    subtitulo: item.title_english ?? undefined,
    autor: manga ? item.authors?.map((autor) => autor.name).filter(Boolean).join(', ') : item.studios?.map((estudio) => estudio.name).filter(Boolean).join(', '),
    descricao: item.synopsis ?? undefined,
    capaUrl: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url,
    ano: item.year ?? ano(item.aired?.from ?? item.published?.from),
    duracaoMinutos: manga ? undefined : duracaoJikanEmMinutos(item.duration),
    linkOficial: item.url,
    identificadorExterno: String(item.mal_id),
    produtores: manga ? undefined : item.producers?.map((valor) => valor.name).filter(Boolean).join(', ') || undefined,
    estudio: manga ? undefined : item.studios?.map((valor) => valor.name).filter(Boolean).join(', ') || undefined,
    distribuidora: manga ? undefined : item.licensors?.map((valor) => valor.name).filter(Boolean).join(', ') || undefined,
    classificacaoIndicativa: manga ? undefined : item.rating ?? undefined,
    editora: manga ? item.serializations?.map((valor) => valor.name).filter(Boolean).join(', ') || undefined : undefined,
    anoTermino: ano(item.aired?.to ?? item.published?.to),
    statusPublicacao: manga ? statusPublicacaoJikan(item.status) : undefined,
  }));
}

function statusPublicacaoJikan(status?: string | null): ResultadoMetadados['statusPublicacao'] {
  const normalizado = status?.toLowerCase() ?? '';
  if (normalizado.includes('finished') || normalizado.includes('complete')) return 'concluida';
  if (normalizado.includes('hiatus')) return 'hiato';
  if (normalizado.includes('discontinued') || normalizado.includes('cancel')) return 'cancelada';
  return normalizado ? 'em_andamento' : undefined;
}

async function buscarItunes(q: string): Promise<ResultadoMetadados[]> {
  const params = new URLSearchParams({ term: q, media: 'podcast', entity: 'podcast', country: 'BR', limit: '6' });
  const data = (await jsonExterno(`https://itunes.apple.com/search?${params}`)) as {
    results?: Array<{
      collectionId: number;
      collectionName?: string;
      artistName?: string;
      artworkUrl600?: string;
      artworkUrl100?: string;
      collectionViewUrl?: string;
    }>;
  };

  return (data.results ?? []).map((item) => ({
    id: String(item.collectionId),
    titulo: item.collectionName ?? 'Podcast sem título',
    autor: item.artistName,
    capaUrl: item.artworkUrl600 ?? item.artworkUrl100,
    linkOficial: item.collectionViewUrl,
    identificadorExterno: String(item.collectionId),
  }));
}

export async function GET(request: NextRequest) {
  const fonte = request.nextUrl.searchParams.get('fonte') as FonteMetadados | null;
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!fonte || !FONTES.includes(fonte) || !q) {
    return NextResponse.json({ erro: 'Fonte e termo de busca são obrigatórios.' }, { status: 400 });
  }

  try {
    let resultados: ResultadoMetadados[] | null;
    switch (fonte) {
      case 'youtube': resultados = await buscarYoutube(q); break;
      case 'tmdb_filme': resultados = await buscarTmdb(q, false); break;
      case 'tmdb_serie': resultados = await buscarTmdb(q, true); break;
      case 'google_livros': resultados = await buscarGoogleLivros(q); break;
      case 'jikan_anime': resultados = await buscarJikan(q, false); break;
      case 'jikan_manga': resultados = await buscarJikan(q, true); break;
      case 'itunes_podcast': resultados = await buscarItunes(q); break;
    }

    if (resultados === null) {
      const variavel = fonte === 'youtube' ? 'YOUTUBE_API_KEY' : 'TMDB_API_KEY';
      return NextResponse.json({ disponivel: false, resultados: [], mensagem: `Importação automática indisponível. Configure ${variavel} no ambiente do servidor.` });
    }
    return NextResponse.json({ disponivel: true, resultados });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Falha na consulta externa.';
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
