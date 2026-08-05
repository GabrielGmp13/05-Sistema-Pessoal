'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function InlineAddForm({
  placeholder,
  buttonLabel = 'Adicionar',
  onAdd,
  className,
}: {
  placeholder: string
  buttonLabel?: string
  onAdd?: (value: string) => void
  className?: string
}) {
  const [value, setValue] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = value.trim()
    if (!v) return
    onAdd?.(v)
    setValue('')
  }

  return (
    <form onSubmit={submit} className={cn('flex items-center gap-2', className)}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <Button type="submit" size="lg" className="shrink-0">
        <Plus className="size-4" />
        {buttonLabel}
      </Button>
    </form>
  )
}
