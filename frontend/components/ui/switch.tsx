'use client'

import { cn } from '@/lib/utils'

function Switch({
  checked = false,
  onCheckedChange,
  className,
  'aria-label': ariaLabel,
  disabled,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  'aria-label'?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-success' : 'bg-muted-foreground/30',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-card shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export { Switch }