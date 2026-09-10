# Handoff — fechamento da versão 1.0.0

Atualizado em 2026-09-10. Este é o documento curto para iniciar o próximo chat.
Leia antes `AGENTS.md` e `AI_CONTEXT.md`; depois use `TASKS_NOW.md` e
`RELEASE_V1.0.0_PLAN.md`. Comunicação e documentação são em português.

## Estado confirmado

- Novos requisitos e limites: `EVOLUCAO_ESTUDOS_EDITORES.md`. Próxima ação:
  restante do lint; depois recuperação manual privada e aceite dos termos.
  Nenhuma expansão de ENEM/PDF/matérias está implementada nesta rodada.
- Repositório: `C:\Gabriel Oliveira\05-Sistema-Pessoal`.
- Aplicação única: `frontend/`, Next.js 16.3.3 + React 19 + TypeScript.
- Produção: `https://expansiondominionpersonaledition.vercel.app`.
- Versão publicada no manifesto: **0.2.0**. A **1.0.0 ainda é planejada**; não
  alterar o número antes de os gates serem aprovados.
- Último commit documentado: `4467a06`; `main` enviada ao GitHub, CI aprovada e
  worktree limpa ao encerrar a homologação.
- Banco de produção: 71 tabelas, 7 buckets privados e 27 migrations aplicadas
  até `20260908000100_treino_integridade_por_usuario.sql`.
- Validação local em 2026-09-10: 103/103 testes Node, typecheck e build de 48
  páginas aprovados sobre a instalação limpa de 2026-09-09. Reset local e
  22/22 testes SQL seguem como evidência da última recertificação de banco.
  O lint completo caiu de 25 para 8 erros
  e 27 avisos; não publicar a v1.0.0 sem resolver ou aceitar
  formalmente essa dívida.
- Auditoria local de dependências: Next.js/`eslint-config-next` 16.3.3,
  `sharp` 0.35.4 e `baseline-browser-mapping` 2.11.21; `npm audit --omit=dev`
  retornou 0 vulnerabilidades. Nada foi publicado.
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

- Validar em produção Anime/Mangá com Kitsu, o primeiro aceite dos termos,
  ENEM manual completo e touch em celular físico. Google Places está fora da
  v1.0.0 por decisão de custo zero e o cadastro manual permanece.
- Se cadastro aberto: fechar SMTP/remetente, URLs/templates/rate limits, OAuth
  publicado/verificado e signup/CAPTCHA/recuperação fora da equipe.
- Revisar privacidade/LGPD, retenção de chamados/prints e incidentes.
- Fazer smoke publicado da CSP/headers — o smoke local de runtime passou —,
  inclusive integrações e imagens externas.
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
