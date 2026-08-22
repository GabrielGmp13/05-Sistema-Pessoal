import { deleteFile, getUserId, uploadFile } from './supabase'

export const CAPA_MAX_BYTES = 3 * 1024 * 1024
export const CAPA_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function validarArquivoCapa(file: File): string | null {
  if (!CAPA_MIMES.includes(file.type as (typeof CAPA_MIMES)[number])) return 'Use uma imagem JPG, PNG ou WebP.'
  if (file.size > CAPA_MAX_BYTES) return 'A capa deve ter no máximo 3 MB.'
  return null
}

export async function persistirComCapa<T>(opcoes: {
  categoria: string
  arquivo: File | null
  capaPathAtual?: string | null
  persistir: (capaPath?: string) => Promise<T | null>
}): Promise<{ resultado: T | null; erro?: string }> {
  if (!opcoes.arquivo) return { resultado: await opcoes.persistir() }
  const erro = validarArquivoCapa(opcoes.arquivo)
  if (erro) return { resultado: null, erro }
  const userId = await getUserId()
  if (!userId) return { resultado: null, erro: 'Sessão indisponível para enviar a capa.' }
  const extensao = opcoes.arquivo.type === 'image/png' ? 'png' : opcoes.arquivo.type === 'image/webp' ? 'webp' : 'jpg'
  const novoPath = `${userId}/biblioteca/${opcoes.categoria}/${crypto.randomUUID()}.${extensao}`
  if (!await uploadFile('capas', novoPath, opcoes.arquivo)) return { resultado: null, erro: 'Não foi possível enviar a capa.' }
  const resultado = await opcoes.persistir(novoPath)
  if (!resultado) {
    await deleteFile('capas', novoPath)
    return { resultado: null, erro: 'A obra não foi salva; o arquivo enviado foi removido.' }
  }
  if (opcoes.capaPathAtual && opcoes.capaPathAtual !== novoPath) await deleteFile('capas', opcoes.capaPathAtual)
  return { resultado }
}
