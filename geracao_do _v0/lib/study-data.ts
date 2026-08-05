// Mock data para o módulo de Estudos (uso individual, sem backend).

export function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ---------- HUB ----------
export const upcomingExams = [
  { id: 'e1', date: '2026-08-02', title: 'ENEM Dia 1', origin: 'ENEM' },
  { id: 'e2', date: '2026-08-05', title: 'Matemática', origin: 'Escola' },
  { id: 'e3', date: '2026-08-09', title: 'ENEM Dia 2', origin: 'ENEM' },
] as const

export const pendingActivities = [
  { id: 'a1', title: 'Lista de exercícios — Funções', due: '2026-07-30' },
  { id: 'a2', title: 'Fichamento — Segunda Guerra', due: null },
] as const

export const recentSimulados = [
  { id: 's1', date: '2026-07-20', correct: 32, total: 45 },
  { id: 's2', date: '2026-07-13', correct: 28, total: 45 },
  { id: 's3', date: '2026-07-06', correct: 35, total: 45 },
] as const

// ---------- ENEM ----------
export const enemSubjects = [
  { id: 'mat', name: 'Matemática', topics: 12, accuracy: 71 },
  { id: 'lin', name: 'Linguagens', topics: 9, accuracy: 64 },
  { id: 'nat', name: 'Ciências da Natureza', topics: 15, accuracy: 58 },
  { id: 'hum', name: 'Ciências Humanas', topics: 11, accuracy: 77 },
] as const

export const enemExams = [
  { id: 'ex1', date: '2026-08-02', day: 'Dia 1', title: '1ª aplicação' },
  { id: 'ex2', date: '2026-08-09', day: 'Dia 2', title: '1ª aplicação' },
] as const

export const enemAreas = [
  'Matemática',
  'Linguagens',
  'Ciências da Natureza',
  'Ciências Humanas',
] as const

// ---------- ESCOLA ----------
export const escolaSubjects = [
  { id: 'bio', name: 'Biologia', topics: 8, accuracy: 82 },
  { id: 'his', name: 'História', topics: 6, accuracy: 69 },
  { id: 'qui', name: 'Química', topics: 7, accuracy: 55 },
] as const

export const escolaExams = [
  { id: 'ee1', date: '2026-07-31', title: 'Biologia — Genética' },
  { id: 'ee2', date: '2026-08-06', title: 'História — Era Vargas' },
] as const

export const escolaActivities = [
  { id: 'ea1', title: 'Relatório de laboratório', due: '2026-07-29' },
  { id: 'ea2', title: 'Resenha crítica de artigo', due: '2026-08-04' },
] as const

// ---------- MATÉRIA (detalhe) ----------
export const subjectTopics = [
  { id: 't1', name: 'Funções', progress: 80, shared: true },
  { id: 't2', name: 'Geometria analítica', progress: 45, shared: false },
  { id: 't3', name: 'Probabilidade', progress: 20, shared: false },
] as const

export const subjectExams = [
  {
    id: 'se1',
    date: '2026-07-18',
    title: 'Prova bimestral',
    status: 'feita',
    grade: 8.5,
  },
  {
    id: 'se2',
    date: '2026-08-05',
    title: 'Simulado geral',
    status: 'pendente',
    grade: null,
  },
] as const

export const subjectActivities = [
  {
    id: 'sa1',
    title: 'Lista de exercícios — Funções',
    due: '2026-07-30',
    done: true,
    delivered: false,
  },
  {
    id: 'sa2',
    title: 'Resumo — Geometria',
    due: '2026-08-02',
    done: false,
    delivered: false,
  },
] as const

export const subjectSimulados = [
  { id: 'ss1', date: '2026-07-20', correct: 12, total: 15 },
  { id: 'ss2', date: '2026-07-08', correct: 9, total: 15 },
] as const

// ---------- CURSOS ----------
export const courses = [
  {
    id: 'c1',
    name: 'React do Zero ao Avançado',
    platform: 'Udemy',
    status: 'em-andamento',
    hours: 42,
    progress: 63,
  },
  {
    id: 'c2',
    name: 'Formação Front-end',
    platform: 'Alura',
    status: 'em-andamento',
    hours: 120,
    progress: 28,
  },
  {
    id: 'c3',
    name: 'Fundamentos de UI Design',
    platform: 'YouTube',
    status: 'concluido',
    hours: 8,
    progress: 100,
  },
] as const

export const courseDetail = {
  id: 'c1',
  name: 'React do Zero ao Avançado',
  platform: 'Udemy',
  hours: 42,
  completed: false,
  completedAt: null as string | null,
  modules: [
    {
      id: 'm1',
      name: 'Fundamentos',
      lessons: [
        { id: 'l1', name: 'Introdução ao JSX', progress: 100 },
        { id: 'l2', name: 'Componentes e props', progress: 100 },
        { id: 'l3', name: 'Estado e eventos', progress: 60 },
      ],
    },
    {
      id: 'm2',
      name: 'Hooks avançados',
      lessons: [
        { id: 'l4', name: 'useReducer na prática', progress: 40 },
        { id: 'l5', name: 'Custom hooks', progress: 0 },
      ],
    },
  ],
}

// ---------- REDAÇÕES ----------
export const essays = [
  {
    id: 'r1',
    theme: 'Desafios da mobilidade urbana no Brasil',
    date: '2026-07-15',
    competencias: [160, 180, 160, 200, 160],
  },
  {
    id: 'r2',
    theme: 'O papel da educação na redução das desigualdades',
    date: '2026-07-08',
    competencias: [180, 160, 180, 160, 180],
  },
  {
    id: 'r3',
    theme: 'Impactos da desinformação nas redes sociais',
    date: '2026-07-01',
    competencias: [160, 140, null, 180, 160],
  },
] as const

export function essayScore(comps: readonly (number | null)[]) {
  if (comps.some((c) => c == null)) return null
  return comps.reduce((acc: number, c) => acc + (c ?? 0), 0)
}
