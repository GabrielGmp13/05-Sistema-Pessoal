import Link from 'next/link'

const providers = [
  ['Supabase', 'contas, autenticação, banco de dados e arquivos privados'],
  ['Vercel', 'hospedagem e entrega do site'],
  ['Cloudflare', 'proteção contra cadastros e acessos automatizados'],
  ['Google', 'entrada com Google e integrações opcionais com Agenda e YouTube'],
]

export default function PrivacidadePage() {
  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">Projeto Pessoal</p>
          <h1 className="text-3xl font-semibold">Aviso de privacidade</h1>
          <p className="text-sm text-muted-foreground">Atualizado em 7 de setembro de 2026 · versão 1.0</p>
        </header>

        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Quem cuida do projeto</h2>
          <p className="leading-relaxed text-muted-foreground">
            Gabriel Oliveira é o responsável pelo Projeto Pessoal. Dúvidas e pedidos sobre privacidade podem ser enviados para{' '}
            <a className="text-primary underline underline-offset-4" href="mailto:sistemapessoa007@gmail.com">sistemapessoa007@gmail.com</a>.
          </p>
          <p className="leading-relaxed text-muted-foreground">O site está em um piloto gratuito, voltado a convidados maiores de 18 anos, e não é direcionado a crianças ou adolescentes.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Você escolhe o que usar</h2>
          <p className="leading-relaxed text-muted-foreground">
            Estudos, agenda, treino, saúde, finanças, diário, biblioteca e os demais recursos disponíveis continuam acessíveis. Cada pessoa decide livremente quais recursos usar e quais informações inserir. Não é necessário preencher todas as áreas.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Saúde, diário e finanças podem envolver informações especialmente delicadas. Durante o piloto, recomendamos começar com dados fictícios ou de baixo risco. Essa recomendação não desativa nem limita os recursos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Quais dados podem ser tratados</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>e-mail, nome, foto e informações necessárias para criar, identificar e proteger a conta;</li>
            <li>conteúdo que você inserir voluntariamente nos recursos escolhidos;</li>
            <li>dados necessários às integrações opcionais com serviços Google que você conectar;</li>
            <li>informações técnicas mínimas usadas para funcionamento, segurança, diagnóstico e prevenção de abuso;</li>
            <li>texto, contexto técnico e até três prints que você decidir enviar em pedidos de suporte.</li>
          </ul>
          <p className="leading-relaxed text-muted-foreground">Nunca envie senhas em pedidos de suporte. Gabriel não consegue visualizar sua senha.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Para que os dados são usados</h2>
          <p className="leading-relaxed text-muted-foreground">Os dados são usados para fornecer as funções escolhidas, autenticar e proteger contas, manter o site funcionando, atender pedidos de suporte e cumprir obrigações aplicáveis. O Projeto Pessoal não vende dados pessoais e atualmente não exibe anúncios. Este aviso será atualizado antes de uma futura adoção de publicidade.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Serviços utilizados</h2>
          <p className="leading-relaxed text-muted-foreground">O projeto depende de fornecedores que podem processar dados no Brasil ou em outros países:</p>
          <ul className="space-y-2 text-muted-foreground">
            {providers.map(([name, purpose]) => <li key={name}><strong className="text-foreground">{name}:</strong> {purpose}.</li>)}
          </ul>
          <p className="leading-relaxed text-muted-foreground">As integrações Google são opcionais e podem ser desconectadas separadamente. Um serviço de envio de e-mail poderá ser acrescentado no futuro; este aviso será atualizado antes disso.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Acesso e segurança</h2>
          <p className="leading-relaxed text-muted-foreground">Contas comuns são isoladas para que cada pessoa acesse seus próprios dados. Arquivos de suporte são privados e usam links temporários. Gabriel e os fornecedores de infraestrutura podem ter acesso administrativo quando necessário para manutenção, segurança ou atendimento. Nenhum sistema é totalmente livre de riscos.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Por quanto tempo os dados ficam guardados</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>a conta e seu conteúdo ficam guardados enquanto ela estiver ativa;</li>
            <li>pedidos de suporte e prints podem ser apagados em até 30 dias após o encerramento;</li>
            <li>após um pedido de exclusão confirmado, os dados ativos serão apagados em até 30 dias, salvo obrigação aplicável ou permanência temporária em cópias técnicas dos fornecedores;</li>
            <li>contas não são apagadas automaticamente apenas por inatividade.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Seus pedidos e escolhas</h2>
          <p className="leading-relaxed text-muted-foreground">Você pode pedir confirmação do tratamento, acesso, correção, informações, uma cópia possível dos seus dados ou exclusão pelo e-mail de privacidade. Podemos confirmar sua identidade antes de entregar ou apagar informações, para proteger a conta. A resposta completa será fornecida em até 15 dias quando esse prazo for aplicável.</p>
          <p className="leading-relaxed text-muted-foreground">Se identificarmos um incidente relevante, ele será avaliado e, quando exigido, comunicado às pessoas afetadas e à Autoridade Nacional de Proteção de Dados dentro do prazo aplicável.</p>
        </section>

        <nav className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link href="/login" className="text-primary underline underline-offset-4">Voltar para entrar</Link>
          <Link href="/ajuda" className="text-primary underline underline-offset-4">Dúvidas frequentes</Link>
        </nav>
      </article>
    </main>
  )
}
