import Link from 'next/link'

const questions = [
  ['O que é o Sistema Pessoal?', 'Um espaço para organizar áreas pessoais como estudos, agenda, treino e biblioteca. Cada conta deve acessar somente os próprios dados.'],
  ['Como consigo uma conta?', 'Durante a fase fechada, novas contas são liberadas por convite. O cadastro direto aparecerá somente depois dos testes e da aprovação de abertura.'],
  ['Esqueci minha senha. O que faço?', 'Use “Esqueci minha senha” na entrada. Se houver uma conta para o e-mail, você receberá um link temporário. Nunca envie sua senha a Gabriel.'],
  ['Como envio um problema ou ideia?', 'Depois de entrar, abra Configurações → Bugs e sugestões. Você receberá um protocolo e poderá acompanhar o histórico na mesma página.'],
  ['Posso enviar um print?', 'Sim, até três imagens por pedido. Oculte e-mails, documentos, dados financeiros, compromissos e informações de outras pessoas antes do envio.'],
  ['O print ou relato vai para o GitHub?', 'Não. Relatos, e-mails e prints ficam em armazenamento privado. No GitHub entra apenas um resumo técnico sem identificação quando necessário.'],
  ['Preciso usar todos os recursos?', 'Não. Você escolhe quais recursos usar e quais dados inserir. Saúde, diário e finanças continuam disponíveis, mas recomendamos dados fictícios ou de baixo risco durante o piloto.'],
  ['Existe prazo de resposta?', 'Ainda não há prazo garantido. Problemas de segurança e perda de dados recebem prioridade sobre defeitos visuais e sugestões.'],
]

export default function AjudaPage() {
  return <main className="min-h-dvh bg-background px-4 py-10 text-foreground"><div className="mx-auto max-w-2xl space-y-6"><header className="space-y-2"><h1 className="text-3xl font-semibold">Dúvidas frequentes</h1><p className="text-sm text-muted-foreground">Informações gerais, sem expor páginas internas ou detalhes de segurança.</p></header><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}</div><div className="flex flex-wrap gap-4"><Link href="/login" className="text-sm text-primary underline underline-offset-4">Voltar para entrar</Link><Link href="/privacidade" className="text-sm text-primary underline underline-offset-4">Aviso de privacidade</Link></div></div></main>
}
