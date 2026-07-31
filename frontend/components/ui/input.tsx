import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'disabled:pointer-events-none disabled:opacity-50',
        'file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  )
}

export { Input }