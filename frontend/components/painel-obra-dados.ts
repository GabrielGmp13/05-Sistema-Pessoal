export type TipoPainelObra = 'filme' | 'serie' | 'anime' | 'manga' | 'livro' | 'podcast' | 'video' | 'playlist' | 'artigo';
export interface CampoInfo { label: string; valor: string }
export interface LinkObra { label: string; url?: string | null }
export const NOMES_MIDIA: Record<TipoPainelObra, string> = {
  filme: 'Filme', serie: 'Série', anime: 'Anime', manga: 'Mangá', livro: 'Livro',
  podcast: 'Podcast', video: 'Vídeo', playlist: 'Playlist', artigo: 'Artigo',
};
const CABECALHO = new Set(['Status', 'Nota', 'Período', 'Ano', 'Ano de publicação', 'Período de publicação', 'Duração', 'Duração/ep']);
const EQUIPE = new Set(['Direção', 'Criação', 'Roteiro', 'Produção', 'Estúdio', 'Distribuidora', 'Character Designer', 'Animador chefe', 'Compositor']);
const HISTORICO = new Set(['Início', 'Conclusão', 'Vezes consumido', 'Onde consumi', 'Valor pago', 'Leitura']);
export function organizarCampos(campos: CampoInfo[]) {
  const validos = campos.filter(c => typeof c.valor === 'string' && c.valor.trim());
  return {
    cabecalho: validos.filter(c => CABECALHO.has(c.label)), equipe: validos.filter(c => EQUIPE.has(c.label)),
    historico: validos.filter(c => HISTORICO.has(c.label)),
    sinopse: validos.find(c => c.label === 'Sinopse')?.valor, comentario: validos.find(c => c.label === 'Comentário')?.valor,
    detalhes: validos.filter(c => !CABECALHO.has(c.label) && !EQUIPE.has(c.label) && !HISTORICO.has(c.label)
      && !['Sinopse', 'Comentário', 'Nome traduzido', 'Título traduzido'].includes(c.label)),
  };
}
export function urlExterna(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined; }
  catch { return undefined; }
}
export function percentualProgresso(atual?: number | null, total?: number | null): number | null {
  if (atual == null || total == null || !Number.isFinite(atual) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.max(0, atual / total * 100));
}
export function dataPainel(data?: string | null) {
  if (!data) return '';
  const date = new Date(data.length === 10 ? `${data}T12:00:00` : data);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
}
export function historicoObra(obra: {
  data_inicio: string | null; data_fim: string | null; vezes_consumido: number | null;
  onde_consumi: string | null; valor_pago: number | null;
}): CampoInfo[] {
  return [
    ...(dataPainel(obra.data_inicio) ? [{ label: 'Início', valor: dataPainel(obra.data_inicio) }] : []),
    ...(dataPainel(obra.data_fim) ? [{ label: 'Conclusão', valor: dataPainel(obra.data_fim) }] : []),
    ...(obra.vezes_consumido != null && obra.vezes_consumido > 0 ? [{ label: 'Vezes consumido', valor: String(obra.vezes_consumido) }] : []),
    ...(obra.onde_consumi?.trim() ? [{ label: 'Onde consumi', valor: obra.onde_consumi }] : []),
    ...(obra.valor_pago != null ? [{ label: 'Valor pago', valor: obra.valor_pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }] : []),
  ];
}
