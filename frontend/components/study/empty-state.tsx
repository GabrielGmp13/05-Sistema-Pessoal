import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  compact,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-center',
        compact ? 'px-4 py-6' : 'px-6 py-10',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-1 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-xs text-pretty text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}