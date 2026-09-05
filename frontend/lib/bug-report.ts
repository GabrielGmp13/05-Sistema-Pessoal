export const BUG_MODULES = [
  'Início', 'Treino / Shape', 'Biblioteca', 'Estudos', 'Idiomas', 'Revisão',
  'Agenda / Google Calendar', 'Histórico', 'Projetos / Programação', 'Diário',
  'Receitas', 'Saúde', 'Finanças', 'Lugares', 'Perfil / Configurações', 'Outro',
] as const

export const BUG_THEMES = {
  claro: 'Sol', suave: 'Suave', nublado: 'Nublado', estrelado: 'Estrelado', escuro: 'Lua',
} as const

export interface BugReportInput {
  modulo: string
  tentativa: string
  esperado: string
  ocorrido: string
  ambiente: string
  tema: string
  print: 'sim' | 'nao' | 'nao-sei'
}

const PRINT_LABELS = {
  sim: 'Posso enviar um print pelo canal privado, após ocultar dados pessoais.',
  nao: 'Não posso enviar print.',
  'nao-sei': 'Ainda não sei se posso enviar print.',
}

// Texto puro, sem coleta de sessão, URL, logs ou dados da conta.
export function formatBugReport(input: BugReportInput, version: string, date: Date): string {
  const required = ['modulo', 'tentativa', 'esperado', 'ocorrido', 'ambiente', 'tema'] as const
  if (required.some((field) => !input[field].trim())) {
    throw new Error('Preencha os campos obrigatórios antes de gerar o relatório.')
  }
  if (required.some((field) => input[field].length > 2000)) {
    throw new Error('Use até 2.000 caracteres por campo.')
  }
  if (!Object.hasOwn(PRINT_LABELS, input.print)) throw new Error('Informe a disponibilidade do print.')
  return [
    `RELATO DE BUG — Sistema Pessoal v${version} (beta privado)`,
    `Gerado em: ${date.toISOString()}`,
    `Página/módulo: ${input.modulo.trim()}`,
    `Navegador/dispositivo: ${input.ambiente.trim()}`,
    `Tema: ${input.tema.trim()}`,
    '', 'O QUE EU ESTAVA TENTANDO FAZER', input.tentativa.trim(),
    '', 'O QUE EU ESPERAVA', input.esperado.trim(),
    '', 'O QUE ACONTECEU', input.ocorrido.trim(),
    '', `PRINT: ${PRINT_LABELS[input.print]}`,
    'Nenhum anexo foi capturado ou enviado pelo site.',
  ].join('\n')
}
