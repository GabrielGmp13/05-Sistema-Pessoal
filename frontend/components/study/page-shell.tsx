import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { MonoLabel } from '@/components/study/mono-label'

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className={cn('mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10', className)}>
        {children}
      </div>
    </main>
  )
}

export function BackLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-md font-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
    >
      <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? <MonoLabel>{eyebrow}</MonoLabel> : null}
        <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}