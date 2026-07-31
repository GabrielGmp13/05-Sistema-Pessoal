import { cn } from '@/lib/utils'

function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: React.ComponentProps<'div'> & {
  value?: number
  indicatorClassName?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full bg-success transition-all duration-500',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export { Progress }