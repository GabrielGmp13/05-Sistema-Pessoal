'use client'

import { useState } from 'react'
import { CAPA_MAX_BYTES, validarArquivoCapa } from '@/lib/biblioteca-capas'
import styles from './BibliotecaSection.module.css'

export default function CapaUploadField({ arquivo, onChange, label = 'Capa do dispositivo' }: { arquivo: File | null; onChange: (file: File | null) => void; label?: string }) {
  const [erro, setErro] = useState<string | null>(null)
  return <label>
    {label}
    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
      const file = event.target.files?.[0] ?? null
      const mensagem = file ? validarArquivoCapa(file) : null
      setErro(mensagem)
      onChange(mensagem ? null : file)
    }} />
    <small className={styles.buscaMetadadosMensagem}>{erro ?? (arquivo ? arquivo.name : `JPG, PNG ou WebP · até ${CAPA_MAX_BYTES / 1024 / 1024} MB`)}</small>
  </label>
}
