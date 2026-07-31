import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-xs transition-colors outline-none',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }