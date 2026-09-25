# Handoff — continuidade da V2 após publicação parcial

> **Estado vigente — 2026-09-25.** Siga primeiro a ordem obrigatória de leitura
> do `AGENTS.md`. Depois consulte este documento, `RETOMADA_V2.md` e
> `TASK_V2_FECHAMENTO.md`. Os parágrafos abaixo do bloco vigente são evidência
> histórica.

## Ponto de retomada único

- Repositório: `C:\Gabriel Oliveira\05-Sistema-Pessoal`; frontend único em
  `frontend/`; produção em `https://expansiondominionpersonaledition.vercel.app`.
- Publicados em `main`: `c862edb`, `dde129e`, `af05990`, `3eae531`, `e09be53`.
  CI e deploy Vercel passaram. O PDF avulso na raiz pertence ao usuário e segue
  fora do Git.
- Banco: `20260915000100`, `20260917000100`, `20260917000200` e
  `20260917000300` estão aplicadas em produção. A `00100` foi aplicada por
  rito isolado em 2026-09-25; não executar `db push` genérico. A função só
  reordena elenco/trilha/OP-ED dentro de uma obra e a UI ainda não a chama.
- Validação atual: 147 testes Node, typecheck, lint e build de 49 páginas
  passaram. QA local confirmou Treino/Agenda, avaliações, ENEM, Redações,
  progresso de leitura, OFX/CSV sintéticos e Storage privado entre duas contas.
- V2.1 pausa Idiomas, Projetos, Programação e o conjunto Diário (Saúde,
  Finanças, Lugares e Receitas). A lista central em
  `frontend/lib/modulos-pausados.ts` remove navegação/Início e reescreve a URL
  autenticada para “cômodo em pausa”, sem apagar dados ou código.
- O candidato V2.1 passou em 150 testes Node, typecheck, lint e build de
  produção antes do commit; confirmar CI, Vercel e smoke pelo commit publicado.
- Trabalho restante não é “implementar tudo”: usar `TASK_V2_FECHAMENTO.md`.
  Existem escolhas D03/D05/D06/D07/D12/D13/D16/D18/D21/D22, dependências
  E01–E14 e testes reais (arquivo Nubank anonimizado, celular e uso prolongado).
  Não inventar produto nem marcar integração externa como concluída.
- O redesign ainda não começou. `TASK_V2_DESIGN.md` é o briefing para Astra;
  iniciar somente quando o escopo funcional que Gabriel escolher estiver fechado.

## Prompt sugerido para o próximo chat

> Siga `AGENTS.md` e leia os documentos de entrada. Retome pelo primeiro item
> ainda aberto em `TASK_V2_FECHAMENTO.md` que esteja definido pelo Gabriel.
> Preserve o banco de produção: não reaplique `00100`/`00200`/`00300`, não
> remova a pausa central sem decisão nova e não use dados dos amigos em ensaios
> destrutivos.
> Atualize `RETOMADA_V2.md`, `TASKS_NOW.md`, `CHANGELOG.md`, `DECISIONS.md` e
> `DATABASE.md` quando o estado mudar. Não faça commit/push sem autorização
> explícita na nova conversa.

## Evidência histórica anterior

> **Cursor vigente: `RETOMADA_V2.md` (2026-09-23).** As notas abaixo são
> históricas. Nubank conta/fatura tem implementação local ainda em validação;
> escolhas novas de Treino/vídeo/leitura estão no cursor. Não repetir perguntas
> já respondidas nem tratar testes anteriores como homologação deste lote.

> **Retomada 2026-09-17:** ENEM/Redações `20260917000300` preparadas SOMENTE
> LOCAL (DEC-085), sem UI dependente nem operação remota. A cadeia local tem
> 75 tabelas/dez funções; produção continua 71/quatro. Reset/26 scripts SQL,
> 134 testes Node, typecheck, lint e build de 49 páginas passaram. Treino agora
> bloqueia finalização quando rascunho ou execuções apontam exercício removido
> do plano. `V2_ESCOLHAS_POR_TOPICO.md` destrincha D01–D21/E01–E13. Faltam
> aplicação autorizada, transição de UI/legado e E2E. Não houve commit/push.
> Biblioteca `20260917000100` segue local por decisão do Gabriel.

> **Banco I04 — 2026-09-17:** `20260917000200` implementada/testada SOMENTE
> LOCAL: lançamentos de nota, média ponderada e anuladas de simulados (DEC-084).
> Reset e 25 scripts aprovados naquela etapa; agora 75 tabelas/dez funções na cadeia local.
> Não integrar frontend antes de aplicação remota autorizada. Biblioteca
> `20260917000100` continua expressamente fora de qualquer aplicação remota.
> Reset removeu as duas contas fictícias; recriá-las antes de novo E2E local.
> Nenhuma produção alterada, nenhum commit/push. I01/I02 têm somente o modelo
> local preparado; interface e E2E não estão implementados.

> **Retomada autenticada 2026-09-17:** candidato local em 127.0.0.1:3100,
> Supabase local 54321/54322, sem alteração de .env.local. Edição/retirada/
> reinclusão de matéria, persistência de Faculdade e nome, ausência de seed
> duplicado e preservação de Matemática no ENEM conferidas na interface.
> 133 testes Node, typecheck/lint e build de 49 páginas aprovados. Storage local
> não iniciou; não declarar uploads homologados. Falha/recuperação REST local
> aprovadas na UI; leitura/alteração cruzada entre duas contas recusadas pela API.
> Erro de gravação acadêmica bloqueia reenvio até atualizar. Troca de conta na
> interface pendente: controle da aba bloqueado após reiniciar servidor local.
> Próximo trabalho: I01/I02/I04 e restante de I08, sem pedir redefinição funcional.

> **Continuação 2026-09-17:** Escola/Faculdade implementada localmente (DEC-083),
> edição ampliada de temporadas e distribuição/motivos do resultado ENEM.
> 131 testes Node e 24 scripts SQL locais aprovados; tipos/lint/build aprovados.
> Migration Biblioteca 20260917000100 permanece SOMENTE LOCAL por determinação
> de Gabriel; não aplicar remotamente. UI da reordenação não foi integrada.
> Homologação autenticada pendente; ambiente Supabase completo local em preparação.

> **Lote local adicional em 2026-09-16:** Biblioteca ganhou edição de elenco,
> trilhas, temporadas de séries, volumes e OP/ED/OST. Saúde ganhou tendências;
> ENEM, relógio em blocos. Atalhos por conta em Configurações (DEC-082) e
> exportação ajustada. Validar candidato local antes de commit/push. Sessão
> publicada foi confirmada por navegador; não equivale à sessão de localhost.
> Não anunciar o escopo integral como pronto. O PDF solto na raiz pertence ao
> usuário e não deve ser incluído automaticamente no stage.

> **Retomada 2026-09-16:** migration `20260915000100` aplicada em produção;
> pós-check e dry-run final aprovados. 23 scripts SQL locais aprovados;
> 114 testes Node, typecheck e lint aprovados. Edição, grupos/instruções,
> reordenação transacional, volume e rascunho de Academia integrados localmente.
> Homologação autenticada pendente; sessão do usuário não está acessível no
> navegador de testes atual. Nenhum commit/push. Não reaplicar a migration nem
> guardar credenciais em arquivo. Continuar por `TASK_V2_IMPLEMENTACAO.md`.

> **Retomada atualizada em 2026-09-15:** a prioridade mudou para incluir todas
> as ideias futuras na versão 2. Ler `TASK_V2_IMPLEMENTACAO.md` e
> `TASK_V2_DESIGN.md` antes da fotografia histórica abaixo. O objetivo ainda
> está incompleto; migration Treino já aplicada em produção. Commit/push
> autorizados após conclusão, sem publicação desta rodada.

Atualizado em 2026-09-11. Este é o documento curto para iniciar o próximo chat.
Leia antes `AGENTS.md` e `AI_CONTEXT.md`; depois use `TASKS_NOW.md` e
`RELEASE_V1.0.0_PLAN.md`. Comunicação e documentação são em português.

## Estado confirmado

- Novos requisitos e limites: `EVOLUCAO_ESTUDOS_EDITORES.md`. Próxima ação:
  executar o primeiro acesso real de um amigo e, separadamente, investigar a
  falha sanitizada registrada no autosync.
  Nenhuma expansão de ENEM/PDF/matérias está implementada nesta rodada.
- Repositório: `C:\Gabriel Oliveira\05-Sistema-Pessoal`.
- Aplicação única: `frontend/`, Next.js 16.3.3 + React 19 + TypeScript.
- Produção: `https://expansiondominionpersonaledition.vercel.app`.
- Versão publicada no manifesto: **0.2.0**. A **1.0.0 ainda é planejada**; não
  alterar o número antes de os gates serem aprovados.
- Código publicado: candidato consolidado em `4546ea0`, seguido da correção
  Kitsu `c81c727`; ambos com CI e Vercel aprovadas. Commit/push foram
  explicitamente autorizados. Versão e configurações remotas preservadas.
- Banco de produção: 71 tabelas, 7 buckets privados e 27 migrations aplicadas
  até `20260908000100_treino_integridade_por_usuario.sql`.
- Validação local em 2026-09-10: 106/106 testes Node, typecheck e build de 48
  páginas aprovados sobre a instalação limpa de 2026-09-09. Reset local e
  22/22 testes SQL seguem como evidência da última recertificação de banco.
  O lint completo caiu de 25 erros/29 avisos para **0 erros/0 avisos**.
- Auditoria local de dependências: Next.js/`eslint-config-next` 16.3.3,
  `sharp` 0.35.4 e `baseline-browser-mapping` 2.11.21; `npm audit --omit=dev`
  retornou 0 vulnerabilidades. Atualizações publicadas em `cc2ccde`.
- Homologação funcional encerrada em `teste.md`; toda massa `TESTE FINAL` foi
  removida. Contas, integrações Google e agenda real foram preservadas.

## O que já está pronto

- Auth por e-mail/senha, confirmação, recuperação e login Google.
- CAPTCHA Turnstile ativo; signup público continua fechado no Supabase e na UI.
- Termos de uso em `/termos`: a conta autenticada sem aceite da versão vigente
  só acessa essa página; páginas redirecionam e APIs retornam 403 até aceitar.
- RLS, Storage privado, FKs compostas no Treino e segunda camada de escopo nas
  rotas privilegiadas.
- Bugs e sugestões com protocolo, histórico e prints privados; operação pelo
  Supabase, sem painel admin público.
- Exportação JSON e procedimento local ensaiado de exclusão de conta.
- Google Calendar bilateral básico e YouTube separados por usuário/serviço.
- Otimização de uploads para WebP apenas quando o resultado é menor.
- Coluna pessoal fixa desde 1024 px; abaixo disso, menu de três linhas.

## Decisão de lançamento confirmada

A v1.0.0 será um piloto controlado para uso pessoal do Gabriel e amigos nos
primeiros meses. Signup público continua fechado; contas são liberadas
nominalmente e OAuth permanece limitado a testadores autorizados. A decisão
não autorizou nenhuma mudança remota em Auth, OAuth ou Vercel.

## Pendências reais para a 1.0

- Anime/Mangá: a Kitsu exige `Accept: application/vnd.api+json`. A correção foi
  publicada em `c81c727`; `attac` retornou Attack on Titan em Anime e Mangá no
  domínio de produção, sem salvar massa de teste.
  Termos aceitos com autorização específica e persistência confirmada.
  ENEM completo foi adiado por Gabriel; resta touch em celular físico. Google Places está fora da
  v1.0.0 por decisão de custo zero e o cadastro manual permanece.
- Se cadastro aberto: fechar SMTP/remetente, URLs/templates/rate limits, OAuth
  publicado/verificado e signup/CAPTCHA/recuperação fora da equipe.
- Revisar privacidade/LGPD, retenção de chamados/prints e incidentes.
- CSP/headers publicados passaram no smoke; CAPTCHA interativo não bloqueia o
  piloto com signup fechado. O erro isolado do autosync não reapareceu e a
  requisição amostrada no Vercel respondeu 200; reabrir somente se recorrer.
- Conta de amigo pode ser criada manualmente no Supabase com senha temporária e
  auto-confirmação, sem SMTP. A troca autenticada está publicada e o formulário
  foi conferido em Configurações; o primeiro ciclo real será feito ao cadastrar
  o primeiro amigo. Procedimento em `BETA_PRIVADO.md` e guia em
  `GUIA_PARA_AMIGOS.md`.
- Congelar escopo, validar, mudar `frontend/package.json` para `1.0.0`, criar
  notas e publicar somente com autorização explícita.

## Não refazer

- Não repetir a limpeza nem apagar contas/dados reais.
- Não reaplicar migrations ou editar baselines.
- Não recriar painel administrativo para suporte.
- Não substituir Next.js/Supabase/Vercel nem a stack mista de CSS.
- Não reabrir o breakpoint de 1024 px sem evidência nova.
- Não colocar senhas, JSON OAuth, chaves, dumps ou relatórios privados no Git.

## Validação-base

Em `frontend/`: `npm ci`, `npm test`, `npm run typecheck`, `npm run build` e
`npm run lint`. Typecheck/test/build são bloqueantes; lint é informativo. Banco
local: reset e 22 scripts SQL quando houver mudança ou recertificação deliberada.

## Prompt para o próximo chat

> Vamos concluir a versão 1.0.0 do Sistema Pessoal. Leia `AGENTS.md`,
> `docs/AI_CONTEXT.md`, `docs/NEXT_ENGINEER_HANDOFF.md`,
> `docs/TASKS_NOW.md` e `docs/RELEASE_V1.0.0_PLAN.md`. Não repita trabalhos já
> homologados em `docs/teste.md`. A 1.0 será um piloto para uso pessoal e amigos,
> com signup público fechado; congele o escopo e feche somente os gates desse
> lançamento controlado. Não altere banco remoto, Auth/OAuth, Vercel, versão,
> commit ou push sem minha autorização explícita para a etapa exata.
