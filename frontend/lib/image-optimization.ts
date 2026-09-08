export const OPTIMIZABLE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface ImageOptimizationResult {
  file: File
  optimized: boolean
  originalBytes: number
  finalBytes: number
}

function webpName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[\u0000-\u001f\u007f]/g, '') || 'imagem'
  return `${base}.webp`
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

export async function otimizarImagem(
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<ImageOptimizationResult> {
  const originalBytes = file.size
  if (!OPTIMIZABLE_IMAGE_TYPES.includes(file.type as (typeof OPTIMIZABLE_IMAGE_TYPES)[number])) {
    return { file, optimized: false, originalBytes, finalBytes: originalBytes }
  }

  const maxWidth = options.maxWidth ?? 2048
  const maxHeight = options.maxHeight ?? 2048
  const quality = options.quality ?? 0.84

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return { file, optimized: false, originalBytes, finalBytes: originalBytes }
    }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await canvasToBlob(canvas, quality)
    if (!blob || blob.size >= originalBytes) {
      return { file, optimized: false, originalBytes, finalBytes: originalBytes }
    }
    const optimizedFile = new File([blob], webpName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
    return { file: optimizedFile, optimized: true, originalBytes, finalBytes: optimizedFile.size }
  } catch {
    // Falha de decodificação ou navegador sem suporte não impede o envio original.
    return { file, optimized: false, originalBytes, finalBytes: originalBytes }
  }
}
