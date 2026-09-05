# Tarefas atuais — v0.2.0 / beta privado

Atualizado em 2026-09-05. A aplicação pessoal e o lote v0.2.0 estão em
produção; **os convites ainda não estão liberados**.
“v2/v2.1” nos documentos antigos descreve a fase do projeto, não a numeração
de releases iniciada aqui. Nada da aplicação anterior foi removido.

## Entregue neste lote

- [x] Configurações → Reportar bug: campos guiados, prévia editável e cópia;
      sem envio, captura automática, persistência, upload ou dependência nova.
- [x] APIs sem sessão retornam JSON 401; login público usa caminho exato;
      redirecionamento não transporta queries e preserva cookies do Auth.
- [x] Logs comuns Supabase/Google/Places não registram mensagens, linhas do
      banco, paths privados ou tokens; respostas Google usam mensagens controladas.
- [x] OAuth vinculado ao usuário que iniciou o fluxo; troca de conta Google
      não reaproveita refresh token de outro e-mail.
- [x] Versão 0.2.0 no manifesto/lock; testes Node adicionados à CI bloqueante.
- [x] Documentação de release, beta, manutenção e integrações consolidada.
- [x] Typecheck, build e 76 testes aprovados; lint com dívida registrada.
      Evidências e limites em [RELEASE_V0.2.0.md](RELEASE_V0.2.0.md).
- [x] Smoke local de Configurações/relato aprovado no computador e em viewport
      de celular; nenhum relato ou dado foi enviado.
- [x] Quatro commits revisados enviados a `main`; CI #71 e deploy de produção
      aprovados. O smoke atrás do login da Vercel permanece com Gabriel.

## Bloqueios antes de convidar amigos (na ordem)

1. Implementar e testar aceitar convite, definir senha e recuperar senha:
   hoje `/login` só oferece e-mail + senha; não existe callback de Supabase Auth.
2. Gabriel escolher/configurar SMTP adequado e canal privado de suporte;
   conferir signup/anon desativados no Supabase, URLs e permissões de operador.
3. Demonstrar isolamento entre duas contas descartáveis (CRUD, relações,
   Storage e API Routes), sem usar dados/conta real como alvo destrutivo.
4. Finalizar os retestes dos módulos liberados em [teste.md](teste.md), incluindo
   biblioteca/temporadas, temas, uploads e Google por usuário/serviço.
5. Aprovar aviso de privacidade, uso de dados não sensíveis, exclusão/exportação
   operacional, limites de custo/quota e checklist de [BETA_PRIVADO.md](BETA_PRIVADO.md).
6. Gabriel entrar pela proteção da Vercel e executar o smoke final publicado.

## Próxima ação de código

Preparar um lote **separado** para convite/recuperação de senha usando o
Supabase Auth existente, sem cadastro público nem senhas compartilhadas. Não
ativar provedor de e-mail pago, alterar Auth remoto ou enviar convites sem
autorização. A documentação identifica o bloqueio, não finge que já funciona.

## Retestes preservados e continuidade

- Biblioteca: uma interface de busca por vez; seleção/nota/adicionar agrupados;
  resposta antiga não substitui seleção nova; inclusão/persistência reais.
- Painéis de obras nos cinco temas, campos vazios, teclado, zoom 100% e celular.
- Sidebar: perfil e rodapé fixos, miolo rolável; não regredir animações.
- Calendar: criar/editar/cancelar nos dois lados; conflitos e eventos recorrentes.
- Suíte manual completa: [teste.md](teste.md) e [HOMOLOGATION_V2.md](HOMOLOGATION_V2.md).

Banco: última migration registrada como aplicada em [DATABASE.md](DATABASE.md)
é `20260830000100_anime_related_works.sql`. **Nenhuma migration/consulta remota
executada neste lote.** O banco remoto não foi recertificado pela leitura local.

Histórico detalhado (inclusive pendências antigas):
[TASKS_HISTORY_2026-08.md](archive/TASKS_HISTORY_2026-08.md).
Ideias sem compromisso: [BACKLOG.md](BACKLOG.md). Direção: [ROADMAP.md](ROADMAP.md).
