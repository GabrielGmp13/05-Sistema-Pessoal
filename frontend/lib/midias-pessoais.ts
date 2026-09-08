import { deleteFile, getSignedUrl, getUserId, uploadFile } from './supabase'
import { otimizarImagem } from './image-optimization'

export const MIDIA_PESSOAL_BUCKET = 'midias-pessoais'
export const IMAGEM_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const IMAGEM_MAX_BYTES = 8 * 1024 * 1024
export const DOCUMENTO_MAX_BYTES = 15 * 1024 * 1024

export function validarImagemPessoal(file: File) {
  if (!IMAGEM_MIMES.includes(file.type as (typeof IMAGEM_MIMES)[number])) return 'Use JPG, PNG ou WebP.'
  if (file.size > IMAGEM_MAX_BYTES) return 'A imagem deve ter no máximo 8 MB.'
  return null
}

export function validarDocumentoProva(file: File) {
  if (![...IMAGEM_MIMES, 'application/pdf'].includes(file.type as (typeof IMAGEM_MIMES)[number] | 'application/pdf')) return 'Use PDF, JPG, PNG ou WebP.'
  if (file.size > DOCUMENTO_MAX_BYTES) return 'O arquivo deve ter no máximo 15 MB.'
  return null
}

function extensionFor(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'application/pdf') return 'pdf'
  return 'jpg'
}

export async function uploadMidiaPessoal(scope: string, file: File) {
  const userId = await getUserId()
  if (!userId) return null
  const arquivo = file.type === 'application/pdf' ? file : (await otimizarImagem(file)).file
  const safeScope = scope.replace(/[^a-z0-9/_-]/gi, '-').replace(/^\/+|\/+$/g, '')
  const path = `${userId}/${safeScope}/${crypto.randomUUID()}.${extensionFor(arquivo)}`
  return uploadFile(MIDIA_PESSOAL_BUCKET, path, arquivo)
}

export function urlMidiaPessoal(path: string) {
  return getSignedUrl(MIDIA_PESSOAL_BUCKET, path)
}

export function apagarMidiaPessoal(path: string) {
  return deleteFile(MIDIA_PESSOAL_BUCKET, path)
}

export async function persistirComMidia<T>(options: {
  scope: string
  file: File | null
  currentPath?: string | null
  validate?: (file: File) => string | null
  persist: (path: string | null) => Promise<T | null>
}) {
  if (!options.file) return { result: await options.persist(options.currentPath ?? null) }
  const validation = (options.validate ?? validarImagemPessoal)(options.file)
  if (validation) return { result: null, error: validation }
  const newPath = await uploadMidiaPessoal(options.scope, options.file)
  if (!newPath) return { result: null, error: 'Não foi possível enviar o arquivo.' }
  const result = await options.persist(newPath)
  if (!result) {
    await apagarMidiaPessoal(newPath)
    return { result: null, error: 'O registro não foi salvo; o arquivo enviado foi removido.' }
  }
  if (options.currentPath && options.currentPath !== newPath) await apagarMidiaPessoal(options.currentPath)
  return { result }
}
