import Link from 'next/link'
import { Home, PauseCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { moduloPausadoPorSlug } from '@/lib/modulos-pausados'
import { cn } from '@/lib/utils'

export default async function ModuloEmPausaPage({
  params,
}: {
  params: Promise<{ modulo: string }>
}) {
  const { modulo: slug } = await params
  const modulo = moduloPausadoPorSlug(slug)
  if (!modulo) notFound()

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <section className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card p-6 text-center shadow-xs sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <PauseCircle aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-5 font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">Cômodo em pausa</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{modulo.nome} está temporariamente desativado</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Nesta V2.1, o foco está nos cômodos essenciais. Seus dados e o código deste módulo continuam preservados para quando ele for liberado novamente.
        </p>
        <Link href="/" className={cn(buttonVariants(), 'mt-6')}>
          <Home aria-hidden="true" />Voltar ao Início
        </Link>
      </section>
    </main>
  )
}
