import { cn } from '@/lib/utils'
import { MonoLabel } from '@/components/study/mono-label'

export function Section({
  label,
  title,
  count,
  actions,
  children,
  className,
}: {
  label?: string
  title: string
  count?: number
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {label ? <MonoLabel>{label}</MonoLabel> : null}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {typeof count === 'number' ? (
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {count}
              </span>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
