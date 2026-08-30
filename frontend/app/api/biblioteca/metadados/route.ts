import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import type { FonteMetadados, ResultadoMetadados } from '@/lib/biblioteca-metadados';
import { extrairYoutubeId } from '@/lib/videos';
import { extrairMetadadosArtigoHtml } from '@/lib/article-metadata';
import { getApiUser } from '@/lib/server/supabase';

const FONTES: FonteMetadados[] = [
  'youtube',
  'tmdb_filme',
  'tmdb_serie',
  'google_livros',
  'jikan_anime',
  'jikan_manga',
  'anilist_relacoes',
  'musica',
  'itunes_podcast',
  'artigo',
];

const MAX_HTML_BYTES = 512 * 1024;

function ipPrivado(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  if (isIP(ip) !== 4) return false;
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function validarUrlPublica(valor: string): Promise<URL> {
  const url = new URL(valor);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Informe uma URL pública HTTP ou HTTPS.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('Endereço local não permitido.');
  const enderecos = await lookup(url.hostname, { all: true });
  if (enderecos.length === 0 || enderecos.some((item) => ipPrivado(item.address))) throw new Error('Endereço privado não permitido.');
  return url;
}

async function baixarHtmlSeguro(valor: string): Promise<{ html: string; url: URL }> {
  let url = await validarUrlPublica(valor);
  for (let redirecionamentos = 0; redirecionamentos <= 3; redirecionamentos += 1) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Sistema-Pessoal/2.1 (+metadata)' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirecionamentos === 3) throw new Error('O site redirecionou demais.');
      url = await validarUrlPublica(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`O site respondeu com status ${response.status}.`);
    if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) throw new Error('A URL não aponta para uma página HTML.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('O site não retornou conteúdo legível.');
    const blocos: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      const restante = MAX_HTML_BYTES - total;
      blocos.push(value.slice(0, restante));
      total += Math.min(value.length, restante);
      if (value.length > restante) await reader.cancel();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const bloco of blocos) { bytes.set(bloco, offset); offset += bloco.length; }
    return { html: new TextDecoder().decode(bytes), url };
  }
  throw new Error('Não foi possível acessar o artigo.');
}

async function buscarArtigo(q: string): Promise<ResultadoMetadados[]> {
  const { html, url } = await baixarHtmlSeguro(q);
  const resultado = extrairMetadadosArtigoHtml(html, url);
  return resultado ? [resultado] : [];
}

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
      signal: AbortSignal.timeout(10_000),
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

async function jsonExternoPost(url: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema-Pessoal/2.1',
      },
      body: JSON.stringify(body),
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
    siteOrigem: 'YouTube',
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
      genres?: Array<{ name?: string }>;
      credits?: {
        crew?: Array<{ name?: string; job?: string }>;
        cast?: Array<{ name?: string; character?: string; profile_path?: string | null; order?: number }>;
      };
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
      generos: detalhe?.genres?.map((genero) => genero.name).filter((nome): nome is string => Boolean(nome)) ?? [],
      elenco: (detalhe?.credits?.cast ?? []).slice(0, 12).flatMap((pessoa) => pessoa.name ? [{
        ator: pessoa.name,
        personagem: pessoa.character || undefined,
        fotoUrl: pessoa.profile_path ? `https://image.tmdb.org/t/p/w185${pessoa.profile_path}` : undefined,
      }] : []),
      classificacaoIndicativa: classificacao || undefined,
      anoTermino: serie ? ano(detalhe?.last_air_date) : undefined,
    };
  });
}

type VolumeGoogle = {
  id: string;
  volumeInfo?: {
    title?: string; subtitle?: string; authors?: string[]; publisher?: string;
    publishedDate?: string; pageCount?: number; language?: string; description?: string;
    infoLink?: string; imageLinks?: { thumbnail?: string };
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
    categories?: string[];
  };
};

function mapearLivroGoogle(item: VolumeGoogle): ResultadoMetadados {
  const info = item.volumeInfo ?? {};
  const isbn = info.industryIdentifiers?.find((valor) => valor.type === 'ISBN_13')?.identifier
    ?? info.industryIdentifiers?.find((valor) => valor.type === 'ISBN_10')?.identifier;
  return {
    id: `google:${item.id}`,
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
    generos: info.categories ?? [],
    siteOrigem: 'Google Books',
  };
}

async function buscarGoogleLivrosFonte(q: string, chave: string, somentePortugues: boolean): Promise<ResultadoMetadados[]> {
  const params = new URLSearchParams({ q, maxResults: '10', printType: 'books', orderBy: 'relevance', key: chave });
  if (somentePortugues) params.set('langRestrict', 'pt');
  const data = (await jsonExterno(`https://www.googleapis.com/books/v1/volumes?${params}`)) as { items?: VolumeGoogle[] };
  return (data.items ?? []).map(mapearLivroGoogle);
}

async function buscarOpenLibrary(q: string): Promise<ResultadoMetadados[]> {
  const params = new URLSearchParams({
    q,
    lang: 'pt',
    limit: '10',
    fields: 'key,title,author_name,first_publish_year,cover_i,isbn,language,publisher,number_of_pages_median,editions,editions.key,editions.title,editions.language,editions.isbn,editions.publisher,editions.number_of_pages,editions.cover_i',
  });
  const data = (await jsonExterno(`https://openlibrary.org/search.json?${params}`)) as {
    docs?: Array<{
      key: string; title?: string; author_name?: string[]; first_publish_year?: number;
      cover_i?: number; isbn?: string[]; language?: string[]; publisher?: string[];
      number_of_pages_median?: number;
      editions?: { docs?: Array<{ key?: string; title?: string; language?: string[]; isbn?: string[]; publisher?: string[]; number_of_pages?: number; cover_i?: number }> };
    }>;
  };
  return (data.docs ?? []).map((obra) => {
    const edicao = obra.editions?.docs?.[0];
    const chave = edicao?.key ?? obra.key;
    const capa = edicao?.cover_i ?? obra.cover_i;
    const idiomas = edicao?.language ?? obra.language ?? [];
    return {
      id: `openlibrary:${chave}`,
      titulo: edicao?.title ?? obra.title ?? 'Livro sem título',
      autor: obra.author_name?.join(', '),
      capaUrl: capa ? `https://covers.openlibrary.org/b/id/${capa}-M.jpg` : undefined,
      ano: obra.first_publish_year,
      isbn: edicao?.isbn?.[0] ?? obra.isbn?.[0],
      editora: edicao?.publisher?.[0] ?? obra.publisher?.[0],
      idioma: idiomas.includes('por') ? 'pt' : idiomas[0],
      paginas: edicao?.number_of_pages ?? obra.number_of_pages_median,
      linkOficial: `https://openlibrary.org${chave}`,
      siteOrigem: 'Open Library',
    };
  });
}

function removerLivrosDuplicados(resultados: ResultadoMetadados[]) {
  const vistos = new Set<string>();
  return resultados.filter((resultado) => {
    const chave = resultado.isbn?.replace(/\D/g, '') || `${resultado.titulo.toLocaleLowerCase('pt-BR')}|${resultado.autor?.toLocaleLowerCase('pt-BR') ?? ''}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

async function buscarGoogleLivros(q: string): Promise<ResultadoMetadados[] | null> {
  const chave = process.env.GOOGLE_BOOKS_API_KEY;
  const consultas = await Promise.allSettled([
    ...(chave ? [buscarGoogleLivrosFonte(q, chave, true), buscarGoogleLivrosFonte(q, chave, false)] : []),
    buscarOpenLibrary(q),
  ]);
  const resultados = consultas.flatMap((consulta) => consulta.status === 'fulfilled' ? consulta.value : []);
  if (resultados.length === 0 && !chave) return null;
  return removerLivrosDuplicados(resultados).sort((a, b) => Number(b.idioma === 'pt') - Number(a.idioma === 'pt')).slice(0, 12);
}

async function buscarJikan(q: string, manga: boolean): Promise<ResultadoMetadados[]> {
  try {
    const resultadosAniList = await buscarAniList(q, manga);
    if (resultadosAniList.length > 0) return resultadosAniList;
  } catch {
    // A Jikan permanece como segunda fonte pública quando a AniList oscilar.
  }
  const tipo = manga ? 'manga' : 'anime';
  const params = new URLSearchParams({ q, limit: '6', sfw: 'true' });
  let data: {
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
      genres?: Array<{ name?: string }>;
      explicit_genres?: Array<{ name?: string }>;
      themes?: Array<{ name?: string }>;
      demographics?: Array<{ name?: string }>;
    }>;
  };
  try {
    data = (await jsonExterno(`https://api.jikan.moe/v4/${tipo}?${params}`)) as typeof data;
  } catch {
    return buscarAniList(q, manga);
  }

  const resultados = (data.data ?? []).map((item) => ({
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
    generos: [...(item.genres ?? []), ...(item.explicit_genres ?? []), ...(item.themes ?? []), ...(item.demographics ?? [])]
      .map((valor) => valor.name).filter((nome): nome is string => Boolean(nome)),
    classificacaoIndicativa: manga ? undefined : item.rating ?? undefined,
    editora: manga ? item.serializations?.map((valor) => valor.name).filter(Boolean).join(', ') || undefined : undefined,
    anoTermino: ano(item.aired?.to ?? item.published?.to),
    statusPublicacao: manga ? statusPublicacaoJikan(item.status) : undefined,
    siteOrigem: 'Jikan / MyAnimeList',
  }));
  return resultados;
}

async function buscarAniList(q: string, manga: boolean): Promise<ResultadoMetadados[]> {
  const query = `
    query ($search: String!, $type: MediaType!) {
      Page(page: 1, perPage: 8) {
        media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
          id idMal status description(asHtml: false) duration episodes chapters volumes siteUrl
          title { romaji english native }
          startDate { year } endDate { year }
          coverImage { extraLarge large medium }
          genres
          studios(isMain: true) { nodes { name } }
          staff(perPage: 12) { edges { role node { name { full } } } }
        }
      }
    }
  `;
  const data = (await jsonExternoPost('https://graphql.anilist.co', {
    query,
    variables: { search: q, type: manga ? 'MANGA' : 'ANIME' },
  })) as {
    data?: { Page?: { media?: Array<{
      id: number; idMal?: number | null; status?: string | null; description?: string | null;
      duration?: number | null; episodes?: number | null; chapters?: number | null; volumes?: number | null;
      siteUrl?: string; title?: { romaji?: string | null; english?: string | null; native?: string | null };
      startDate?: { year?: number | null }; endDate?: { year?: number | null };
      coverImage?: { extraLarge?: string | null; large?: string | null; medium?: string | null };
      genres?: string[]; studios?: { nodes?: Array<{ name?: string }> };
      staff?: { edges?: Array<{ role?: string; node?: { name?: { full?: string } } }> };
    }> } };
  };
  return (data.data?.Page?.media ?? []).map((item) => {
    const autores = (item.staff?.edges ?? [])
      .filter((pessoa) => manga && /(story|art|original creator)/i.test(pessoa.role ?? ''))
      .map((pessoa) => pessoa.node?.name?.full)
      .filter((nome): nome is string => Boolean(nome));
    return {
      id: `anilist:${item.id}`,
      titulo: item.title?.romaji ?? item.title?.english ?? item.title?.native ?? 'Título não informado',
      subtitulo: item.title?.english ?? item.title?.native ?? undefined,
      autor: manga ? [...new Set(autores)].join(', ') || undefined : item.studios?.nodes?.map((estudio) => estudio.name).filter(Boolean).join(', ') || undefined,
      descricao: item.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || undefined,
      capaUrl: item.coverImage?.extraLarge ?? item.coverImage?.large ?? item.coverImage?.medium ?? undefined,
      ano: item.startDate?.year ?? undefined,
      duracaoMinutos: manga ? undefined : item.duration ?? undefined,
      linkOficial: item.siteUrl,
      identificadorExterno: item.idMal ? String(item.idMal) : undefined,
      anilistId: String(item.id),
      malId: item.idMal ? String(item.idMal) : undefined,
      episodios: item.episodes ?? undefined,
      estudio: manga ? undefined : item.studios?.nodes?.map((estudio) => estudio.name).filter(Boolean).join(', ') || undefined,
      generos: item.genres ?? [],
      anoTermino: item.endDate?.year ?? undefined,
      statusPublicacao: manga ? statusPublicacaoAniList(item.status) : undefined,
      siteOrigem: 'AniList',
    };
  });
}

async function buscarRelacoesAniList(q: string): Promise<ResultadoMetadados[]> {
  const id = Number(q);
  if (!Number.isInteger(id) || id <= 0) return [];
  const query = `
    query ($id: Int!) {
      Media(id: $id, type: ANIME) {
        relations { edges { relationType(version: 2) node {
          id idMal type format episodes duration description(asHtml: false) siteUrl
          title { romaji english native }
          startDate { year }
          coverImage { extraLarge large medium }
        } } }
      }
    }
  `;
  const data = (await jsonExternoPost('https://graphql.anilist.co', { query, variables: { id } })) as {
    data?: { Media?: { relations?: { edges?: Array<{
      relationType?: string; node?: {
        id: number; idMal?: number | null; type?: string; format?: string; episodes?: number | null;
        duration?: number | null; description?: string | null; siteUrl?: string;
        title?: { romaji?: string | null; english?: string | null; native?: string | null };
        startDate?: { year?: number | null };
        coverImage?: { extraLarge?: string | null; large?: string | null; medium?: string | null };
      };
    }> } } };
  };
  return (data.data?.Media?.relations?.edges ?? [])
    .filter((edge) => edge.node?.type === 'ANIME')
    .map((edge) => {
      const item = edge.node!;
      return {
        id: `anilist:${item.id}`,
        titulo: item.title?.romaji ?? item.title?.english ?? item.title?.native ?? 'Título não informado',
        subtitulo: item.title?.english ?? item.title?.native ?? undefined,
        descricao: item.description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || undefined,
        capaUrl: item.coverImage?.extraLarge ?? item.coverImage?.large ?? item.coverImage?.medium ?? undefined,
        ano: item.startDate?.year ?? undefined,
        duracaoMinutos: item.duration ?? undefined,
        linkOficial: item.siteUrl,
        anilistId: String(item.id),
        malId: item.idMal ? String(item.idMal) : undefined,
        episodios: item.episodes ?? undefined,
        formato: item.format,
        tipoRelacao: edge.relationType,
        siteOrigem: 'AniList',
      } satisfies ResultadoMetadados;
    });
}

async function buscarMusica(q: string): Promise<ResultadoMetadados[]> {
  const params = new URLSearchParams({ term: q, media: 'music', entity: 'song', country: 'BR', limit: '6' });
  const data = (await jsonExterno(`https://itunes.apple.com/search?${params}`)) as {
    results?: Array<{ trackId: number; trackName?: string; artistName?: string; artworkUrl100?: string; trackViewUrl?: string; trackTimeMillis?: number }>;
  };
  const itunes = (data.results ?? []).map((item) => ({
    id: `itunes:${item.trackId}`,
    titulo: item.trackName ?? 'Faixa sem título',
    autor: item.artistName,
    capaUrl: item.artworkUrl100?.replace('100x100', '300x300'),
    linkOficial: item.trackViewUrl,
    duracaoSegundos: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : undefined,
    siteOrigem: 'Apple Music / iTunes',
  }));
  const youtube = await buscarYoutube(q);
  return [...(youtube ?? []), ...itunes].slice(0, 12);
}

function statusPublicacaoJikan(status?: string | null): ResultadoMetadados['statusPublicacao'] {
  const normalizado = status?.toLowerCase() ?? '';
  if (normalizado.includes('finished') || normalizado.includes('complete')) return 'concluida';
  if (normalizado.includes('hiatus')) return 'hiato';
  if (normalizado.includes('discontinued') || normalizado.includes('cancel')) return 'cancelada';
  return normalizado ? 'em_andamento' : undefined;
}

function statusPublicacaoAniList(status?: string | null): ResultadoMetadados['statusPublicacao'] {
  if (status === 'FINISHED') return 'concluida';
  if (status === 'HIATUS') return 'hiato';
  if (status === 'CANCELLED') return 'cancelada';
  return status ? 'em_andamento' : undefined;
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
  const user = await getApiUser();
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
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
      case 'anilist_relacoes': resultados = await buscarRelacoesAniList(q); break;
      case 'musica': resultados = await buscarMusica(q); break;
      case 'itunes_podcast': resultados = await buscarItunes(q); break;
      case 'artigo': resultados = await buscarArtigo(q); break;
    }

    if (resultados === null) {
      const variavel = fonte === 'youtube'
        ? 'YOUTUBE_API_KEY'
        : fonte === 'google_livros'
          ? 'GOOGLE_BOOKS_API_KEY'
          : 'TMDB_API_KEY';
      const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
      const referencia = commit ? ` O deployment em execução é o commit ${commit}.` : '';
      return NextResponse.json({ disponivel: false, resultados: [], mensagem: `Importação automática indisponível. ${variavel} não chegou ao ambiente deste deployment.${referencia}` });
    }
    return NextResponse.json({ disponivel: true, resultados });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Falha na consulta externa.';
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
