import { validarCamposLista, type CampoLista } from './editor-lista.ts'

export const camposTemporada: CampoLista[] = [
  { chave: 'numero', rotulo: 'Número', obrigatorio: true, numero: true, min: 1, max: 2147483647, passo: 1 },
  { chave: 'numero_episodios', rotulo: 'Episódios', numero: true, min: 0, max: 2147483647, passo: 1 },
  { chave: 'nome_original', rotulo: 'Nome original' },
  { chave: 'nome_traduzido', rotulo: 'Nome traduzido' },
  { chave: 'ano_lancamento', rotulo: 'Ano de lançamento', numero: true, min: 1, max: 9999, passo: 1 },
  { chave: 'ano_termino', rotulo: 'Ano de término', numero: true, min: 1, max: 9999, passo: 1 },
  { chave: 'duracao_minutos', rotulo: 'Duração por episódio (minutos)', numero: true, min: 0, max: 2147483647, passo: 1 },
  { chave: 'nota_imdb', rotulo: 'Nota IMDb (0–10)', numero: true, min: 0, max: 10, passo: 0.1 },
  { chave: 'capa_url', rotulo: 'Endereço da capa', url: true },
  { chave: 'link_anilist', rotulo: 'Link AniList', url: true },
  { chave: 'link_mal', rotulo: 'Link MyAnimeList', url: true },
  { chave: 'formato', rotulo: 'Formato' },
  { chave: 'tipo_relacao', rotulo: 'Relação com a obra' },
  { chave: 'diretor', rotulo: 'Diretor' },
  { chave: 'roteirista', rotulo: 'Roteirista' },
  { chave: 'produtores', rotulo: 'Produtores' },
  { chave: 'estudio', rotulo: 'Estúdio' },
  { chave: 'character_designer', rotulo: 'Design de personagens' },
  { chave: 'animador_chefe', rotulo: 'Animador-chefe' },
  { chave: 'compositor', rotulo: 'Compositor' },
]

export function validarEdicaoTemporada(valores: Record<string, string>) {
  const erro = validarCamposLista(camposTemporada, valores)
  if (erro) return erro
  if (valores.ano_lancamento && valores.ano_termino && Number(valores.ano_termino) < Number(valores.ano_lancamento)) return 'O término não pode ser anterior ao lançamento.'
  const data = valores.data_assisti
  if (data && (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !Number.isFinite(Date.parse(data + 'T00:00:00Z')) || new Date(data + 'T00:00:00Z').toISOString().slice(0, 10) !== data)) return 'Data de conclusão inválida.'
  return null
}

export function valoresEdicaoTemporada(item: object): Record<string, string> {
  const origem = item as Record<string, unknown>
  return Object.fromEntries([...camposTemporada.map(c => c.chave), 'sinopse', 'data_assisti'].map(chave => [chave, String(origem[chave] ?? '')]))
}

export function dadosEdicaoTemporada(valores: Record<string, string>) {
  // Lista permitida: não regrava UUID, relação de dono, IDs externos ou progresso.
  const dados = Object.fromEntries(camposTemporada.map(campo => {
    const valor = (valores[campo.chave] ?? '').trim()
    return [campo.chave, valor === '' ? null : campo.numero ? Number(valor) : valor]
  }))
  return { ...dados, numero: Number(valores.numero), sinopse: valores.sinopse?.trim() || null, data_assisti: valores.data_assisti || null }
}
