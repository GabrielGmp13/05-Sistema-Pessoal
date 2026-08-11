import Link from 'next/link'
import { BookOpen, Brain, CalendarDays, ChevronRight, Dumbbell, GraduationCap } from 'lucide-react'

const modules = [
  {
    href: '/treino',
    title: 'Treino',
    description: 'Planejamento, execução na academia e acompanhamento do shape.',
    icon: Dumbbell,
    status: 'Rotina ativa',
  },
  {
    href: '/biblioteca',
    title: 'Biblioteca',
    description: 'Filmes, séries, animes, mangás, livros e podcasts no acervo pessoal.',
    icon: BookOpen,
    status: 'Acervo',
  },
  {
    href: '/estudos',
    title: 'Estudos',
    description: 'ENEM, escola, cursos, redações e revisões pendentes em um só lugar.',
    icon: GraduationCap,
    status: 'Hub acadêmico',
  },
  {
    href: '/revisao',
    title: 'Revisão Espaçada',
    description: 'Cards vencidos e futuros com intervalos calculados pelo SM-2.',
    icon: Brain,
    status: 'Memória ativa',
  },
  {
    href: '/agenda',
    title: 'Agenda',
    description: 'Compromissos, cronograma de estudos, provas e treinos organizados por data.',
    icon: CalendarDays,
    status: 'Planejamento',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Sistema Pessoal v2
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Seu painel central
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Entre direto nos módulos principais e continue o que estiver em andamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs outline-none transition-all hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-5">
                  <span className="font-mono text-xs font-medium uppercase tracking-normal text-muted-foreground">
                    {module.status}
                  </span>
                  <h2 className="mt-2 text-xl font-semibold">{module.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
