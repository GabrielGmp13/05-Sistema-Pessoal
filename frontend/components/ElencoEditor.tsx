'use client'

import { useCallback } from 'react'
import { listarElenco, criarElenco, atualizarElenco, apagarElenco, type TipoObraElenco } from '@/lib/elenco'
import { EditorListaTextual } from './EditorListaTextual'

const campos = [
  {
    "chave": "ator",
    "rotulo": "Ator",
    "obrigatorio": true,
    "url": false
  },
  {
    "chave": "personagem",
    "rotulo": "Personagem (opcional)",
    "obrigatorio": false,
    "url": false
  },
  {
    "chave": "foto_url",
    "rotulo": "URL da foto (opcional)",
    "obrigatorio": false,
    "url": true
  }
]

export default function ElencoEditor({ tipoObra, obraUuid }: { tipoObra: Exclude<TipoObraElenco, 'anime'>; obraUuid: string }) {
  const listar = useCallback(async () => {
    const itens = await listarElenco(tipoObra, obraUuid)
    return itens?.map((item) => ({ uuid: item.uuid, titulo: item.ator ?? '', detalhe: item.personagem ?? '', valores: { ator: item.ator ?? '', personagem: item.personagem ?? '', foto_url: item.foto_url ?? '' } })) ?? null
  }, [tipoObra, obraUuid])
  async function salvar(uuid: string | null, valores: Record<string, string>) {
    const dados = { ator: valores.ator, personagem: valores.personagem || null, foto_url: valores.foto_url || null }
    if (uuid) return Boolean(await atualizarElenco(uuid, dados))
    const atuais = await listarElenco(tipoObra, obraUuid)
    if (!atuais) return false
    return Boolean(await criarElenco(tipoObra, obraUuid, { ...dados, ordem: Math.max(-1, ...atuais.map((item) => item.ordem)) + 1 }))
  }
  return <EditorListaTextual key={tipoObra + ':' + obraUuid} titulo="Elenco" campos={campos} listar={listar} salvar={salvar} apagar={apagarElenco} />
}
