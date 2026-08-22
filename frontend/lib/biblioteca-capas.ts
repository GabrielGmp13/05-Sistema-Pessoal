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

async function uploadImagemBiblioteca(categoria: string, papel: 'capa' | 'banner', arquivo: File) {
  const userId = await getUserId()
  if (!userId) return null
  const extensao = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/biblioteca/${categoria}/${papel}/${crypto.randomUUID()}.${extensao}`
  return await uploadFile('capas', path, arquivo) ? path : null
}

export async function persistirComCapaEBanner<T>(opcoes: {
  categoria: string
  arquivoCapa: File | null
  arquivoBanner: File | null
  capaPathAtual?: string | null
  bannerPathAtual?: string | null
  persistir: (paths: { capaPath?: string; bannerPath?: string }) => Promise<T | null>
}): Promise<{ resultado: T | null; erro?: string }> {
  for (const arquivo of [opcoes.arquivoCapa, opcoes.arquivoBanner]) {
    const erro = arquivo ? validarArquivoCapa(arquivo) : null
    if (erro) return { resultado: null, erro }
  }
  const novaCapa = opcoes.arquivoCapa ? await uploadImagemBiblioteca(opcoes.categoria, 'capa', opcoes.arquivoCapa) : null
  if (opcoes.arquivoCapa && !novaCapa) return { resultado: null, erro: 'Não foi possível enviar a capa.' }
  const novoBanner = opcoes.arquivoBanner ? await uploadImagemBiblioteca(opcoes.categoria, 'banner', opcoes.arquivoBanner) : null
  if (opcoes.arquivoBanner && !novoBanner) {
    if (novaCapa) await deleteFile('capas', novaCapa)
    return { resultado: null, erro: 'Não foi possível enviar o banner.' }
  }
  const resultado = await opcoes.persistir({
    capaPath: novaCapa ?? undefined,
    bannerPath: novoBanner ?? undefined,
  })
  if (!resultado) {
    if (novaCapa) await deleteFile('capas', novaCapa)
    if (novoBanner) await deleteFile('capas', novoBanner)
    return { resultado: null, erro: 'A obra não foi salva; os arquivos enviados foram removidos.' }
  }
  if (novaCapa && opcoes.capaPathAtual && opcoes.capaPathAtual !== novaCapa) await deleteFile('capas', opcoes.capaPathAtual)
  if (novoBanner && opcoes.bannerPathAtual && opcoes.bannerPathAtual !== novoBanner) await deleteFile('capas', opcoes.bannerPathAtual)
  return { resultado }
}

export async function removerArquivosBiblioteca(paths: Array<string | null | undefined>) {
  await Promise.all(paths.filter((path): path is string => Boolean(path)).map((path) => deleteFile('capas', path)))
}
