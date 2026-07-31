import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export function Field({
  label,
  htmlFor,
  hint,
  optional,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? (
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            opcional
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}