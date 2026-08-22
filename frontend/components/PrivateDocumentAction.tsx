'use client'

import { useEffect, useId, useState } from 'react'
import { ExternalLink, FileUp, Loader2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { persistirComMidia, urlMidiaPessoal, validarDocumentoProva } from '@/lib/midias-pessoais'

export function PrivateDocumentAction({
  path,
  scope,
  onPersist,
}: {
  path: string | null
  scope: string
  onPersist: (path: string) => Promise<boolean>
}) {
  const inputId = useId()
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPath = savedPath ?? path
  useEffect(() => {
    let active = true
    if (!currentPath) return
    void urlMidiaPessoal(currentPath).then((signed) => { if (active) setUrl(signed) })
    return () => { active = false }
  }, [currentPath])

  async function select(file: File | null) {
    if (!file) return
    setLoading(true)
    setError('')
    const result = await persistirComMidia({
      scope,
      file,
      currentPath,
      validate: validarDocumentoProva,
      persist: async (newPath) => newPath && await onPersist(newPath) ? newPath : null,
    })
    setLoading(false)
    if (!result.result) { setError(result.error ?? 'Não foi possível vincular o arquivo.'); return }
    const newPath = result.result
    setSavedPath(newPath)
    setUrl(await urlMidiaPessoal(newPath))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {url ? <a className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))} href={url} target="_blank" rel="noreferrer"><ExternalLink />Abrir arquivo</a> : null}
      <label htmlFor={inputId} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
        {currentPath ? 'Substituir arquivo' : 'Anexar arquivo'}
      </label>
      <input id={inputId} className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={loading} onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; void select(file) }} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
