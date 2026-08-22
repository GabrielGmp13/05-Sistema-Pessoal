'use client'

import { useState } from 'react'

import { IMAGEM_MAX_BYTES, validarImagemPessoal } from '@/lib/midias-pessoais'

export function PrivateMediaField({ file, onChange, label = 'Imagem do dispositivo' }: {
  file: File | null
  onChange: (file: File | null) => void
  label?: string
}) {
  const [error, setError] = useState('')
  return <label className="block space-y-2 text-sm"><span className="font-medium">{label}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" onChange={(event) => {
    const selected = event.target.files?.[0] ?? null
    const validation = selected ? validarImagemPessoal(selected) : null
    setError(validation ?? '')
    onChange(validation ? null : selected)
  }} /><span className={`block text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error || (file ? file.name : `JPG, PNG ou WebP · até ${IMAGEM_MAX_BYTES / 1024 / 1024} MB`)}</span></label>
}
