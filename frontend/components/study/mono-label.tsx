import { cn } from '@/lib/utils'

export function MonoLabel({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}