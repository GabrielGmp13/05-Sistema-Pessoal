'use client'

import { useCallback } from 'react'
import { listarTemporadas, criarTemporada, atualizarTemporada, apagarTemporada } from '@/lib/series-temporadas'
import { EditorListaTextual } from './EditorListaTextual'

const campos = [
  { chave: 'numero', rotulo: 'Número da temporada', obrigatorio: true, numero: true, min: 1, max: 2147483647, passo: 1 },
  { chave: 'numero_episodios', rotulo: 'Episódios (opcional)', numero: true, min: 0, max: 2147483647, passo: 1 },
  { chave: 'minha_nota', rotulo: 'Minha nota de 0 a 5 (opcional)', estrelas: true, numero: true, min: 0, max: 5, passo: 0.5 },
  { chave: 'nota_imdb', rotulo: 'Nota IMDb (0 a 10)', numero: true, min: 0, max: 10, passo: 0.1 },
  { chave: 'data_assisti', rotulo: 'Data em que assisti', data: true },
]

export default function TemporadasEditor({ serieUuid }: { serieUuid: string }) {
  const listar = useCallback(async () => {
    const itens = await listarTemporadas(serieUuid)
    return itens?.map((item) => ({
      uuid: item.uuid, titulo: 'Temporada ' + item.numero,
      detalhe: [item.numero_episodios !== null ? item.numero_episodios + ' episódios' : '', item.minha_nota !== null ? 'Nota ' + item.minha_nota : ''].filter(Boolean).join(' · '),
      valores: { numero: String(item.numero), numero_episodios: String(item.numero_episodios ?? ''), minha_nota: String(item.minha_nota ?? ''), nota_imdb: String(item.nota_imdb ?? ''), data_assisti: item.data_assisti ?? '' },
    })) ?? null
  }, [serieUuid])
  async function salvar(uuid: string | null, valores: Record<string, string>) {
    const dados = { numero: Number(valores.numero), numero_episodios: valores.numero_episodios === '' ? null : Number(valores.numero_episodios), minha_nota: valores.minha_nota === '' ? null : Number(valores.minha_nota), nota_imdb: valores.nota_imdb === '' ? null : Number(valores.nota_imdb), data_assisti: valores.data_assisti || null }
    const atuais = await listarTemporadas(serieUuid)
    if (!atuais || atuais.some((item) => item.numero === dados.numero && item.uuid !== uuid)) return false
    return Boolean(uuid ? await atualizarTemporada(uuid, dados) : await criarTemporada(serieUuid, dados))
  }
  return <EditorListaTextual key={serieUuid} titulo="Temporadas" campos={campos} listar={listar} salvar={salvar} apagar={apagarTemporada} />
}
