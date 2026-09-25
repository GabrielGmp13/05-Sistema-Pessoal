'use client'

import { useCallback } from 'react'
import { listarTrilhaSonora, criarTrilhaSonora, atualizarTrilhaSonora, apagarTrilhaSonora, type TipoObraTrilha } from '@/lib/trilha-sonora'
import { EditorListaTextual } from './EditorListaTextual'

const campos = [
  {
    "chave": "nome",
    "rotulo": "Nome da faixa",
    "obrigatorio": true,
    "url": false
  },
  {
    "chave": "artista",
    "rotulo": "Artista (opcional)",
    "obrigatorio": false,
    "url": false
  },
  {
    "chave": "link_spotify",
    "rotulo": "Link Spotify (opcional)",
    "obrigatorio": false,
    "url": true
  },
  {
    "chave": "link_youtube_music",
    "rotulo": "Link YouTube Music (opcional)",
    "obrigatorio": false,
    "url": true
  }
]

export default function TrilhaSonoraEditor({ tipoObra, obraUuid }: { tipoObra: TipoObraTrilha; obraUuid: string }) {
  const listar = useCallback(async () => {
    const itens = await listarTrilhaSonora(tipoObra, obraUuid)
    return itens?.map((item) => ({ uuid: item.uuid, titulo: item.nome ?? '', detalhe: item.artista ?? '', valores: { nome: item.nome ?? '', artista: item.artista ?? '', link_spotify: item.link_spotify ?? '', link_youtube_music: item.link_youtube_music ?? '' } })) ?? null
  }, [tipoObra, obraUuid])
  async function salvar(uuid: string | null, valores: Record<string, string>) {
    const dados = { nome: valores.nome, artista: valores.artista || null, link_spotify: valores.link_spotify || null, link_youtube_music: valores.link_youtube_music || null }
    if (uuid) return Boolean(await atualizarTrilhaSonora(uuid, dados))
    const atuais = await listarTrilhaSonora(tipoObra, obraUuid)
    if (!atuais) return false
    return Boolean(await criarTrilhaSonora(tipoObra, obraUuid, { ...dados, ordem: Math.max(-1, ...atuais.map((item) => item.ordem)) + 1 }))
  }
  return <EditorListaTextual key={tipoObra + ':' + obraUuid} titulo="Trilha sonora" campos={campos} listar={listar} salvar={salvar} apagar={apagarTrilhaSonora} />
}
