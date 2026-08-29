# Handoff curto para o próximo chat de engenharia

Use este arquivo para retomar o projeto com baixo gasto de contexto. Ele não
substitui `AGENTS.md`, `AI_CONTEXT.md`, `DATABASE.md` ou `DECISIONS.md`; serve
como mapa rápido do estado atual e das próximas ações.

## Estado atual

- Projeto: Sistema Pessoal, Next.js 16/React 19/TypeScript em `frontend/`.
- Banco: Supabase com cadeia ativa em `backend/supabase/migrations/`.
- Produção: Vercel, branch `main`.
- Último estado documentado: v2.1 tecnicamente implementada; faltam testes
  manuais reais e correções encontradas neles.
- Produção e migrations estavam alinhadas até
  `20260827000100_homologacao_fluxos_pessoais.sql`.
- A UI global recente usa `AppChrome` com coluna pessoal à esquerda em telas
  largas e barra superior dedicada somente à navegação. Biblioteca e telas de
  foco são exceções sem a coluna pessoal; na Biblioteca, perfil, atmosfera e
  saída ficam compactos no topo e a sidebar local permanece fixa. A navegação
  usa transições curtas e transforma o perfil entre a coluna e esse topo.

## Leitura mínima antes de editar

1. `AGENTS.md`
2. Este arquivo
3. `docs/TASKS_NOW.md`
4. `docs/teste.md`
5. Só abrir `docs/DATABASE.md` ou `docs/DECISIONS.md` quando a mudança tocar
   banco, Auth, Storage, API Route, regra de produto ou decisão já tomada.

## Correção mais recente

A coluna pessoal da esquerda passou a rolar como uma área única quando o
conteúdo excede a altura disponível. A linha temporal não cria mais um scroll
concorrente, o seletor de atmosfera abre sem ficar preso à coluna e falhas
parciais não deixam o carregamento travado.

Arquivos mais prováveis:

- `frontend/components/RightRail.module.css`
- `frontend/components/RightRail.tsx`
- `frontend/components/ThemeToggle.module.css`
- `frontend/components/AppChrome.module.css`

Reteste manual ainda necessário:

- A coluna inteira deve rolar verticalmente quando o conteúdo exceder a tela.
- Evitar scroll interno concorrente na linha temporal, se isso atrapalhar.
- O seletor de tema não pode ser cortado quando a coluna tiver overflow.
- Calendário, perfil, relógio, agenda, tema e sair devem continuar acessíveis.
- Conferir desktop largo e altura menor; em telas estreitas a coluna recolhe.

## Regras operacionais rápidas

- Não criar migration se o problema for apenas CSS/layout.
- Se criar migration: reset local, testes SQL, dry-run remoto exclusivo,
  autorização explícita antes de produção, pós-check e dry-run final.
- Não commitar nem fazer push sem autorização explícita do Gabriel.
- Antes de commit autorizado: typecheck, build, `git diff --check`, busca por
  `confirm(` e `window.prompt`, e verificação de segredos.
- Preservar relatos do Gabriel em `docs/teste.md`; reescrever apenas a parte de
  próximos testes para evitar retrabalho.

## Áreas que existem hoje

- Hub `/`
- Treino e Shape
- Biblioteca com oito categorias, capas, metadados, playlists e Vídeo -> Curso
- Estudos, ENEM, Redações, Revisão e sessão focada
- Agenda com prioridade, visão semanal/mensal e Google Calendar
- Diário: Saúde, Finanças, Lugares e Receitas
- Projetos e Programação
- Idiomas
- Histórico
- Configurações, perfil, temas/atmosferas e integrações

## Itens que dependem mais do Gabriel do que do código

- Testes manuais no deploy com dados reais.
- Chaves e credenciais externas: Google, YouTube, Calendar, Places, TMDB,
  BRAPI e Vercel.
- Decisões de privacidade/LGPD e termos antes de abrir para mais pessoas.
- Ajustes de gosto visual fino, principalmente atmosfera, gradientes e coluna.

## Prompt recomendado para abrir o próximo chat

Você está trabalhando no repositório `C:\Gabriel Oliveira\05-Sistema-Pessoal`.
Responda em português e aja como engenheiro principal do projeto.

Antes de editar, leia `AGENTS.md`, `docs/NEXT_ENGINEER_HANDOFF.md`,
`docs/TASKS_NOW.md` e `docs/teste.md`. Só leia documentos longos como
`DATABASE.md`, `DECISIONS.md`, `ARCHITECTURE.md` e `DESIGN.md` quando a mudança
tocar banco, Auth, Storage, API Route, decisão de produto ou visual global.

Tarefa inicial: acompanhar Gabriel na homologação manual detalhada do deploy,
seguindo `docs/teste.md`. Registrar os relatos sem apagar evidências úteis,
corrigir os problemas confirmados em lotes coerentes e manter a lista somente
com os testes que ainda dependem de validação humana. Começar pelo reteste da
coluna pessoal em tela larga e altura reduzida, incluindo mouse/trackpad,
teclado e seletor de atmosfera.

Escopo permitido:

- CSS/layout da coluna, barra superior e shell global se necessário.
- Pequenas correções no `RightRail.tsx` para falhas parciais ou estado preso.
- Atualizar `docs/teste.md` para registrar somente o que Gabriel ainda precisa
  testar manualmente.
- Atualizar `TASKS_NOW.md`/`CHANGELOG.md` se a correção for concluída.

Não faça:

- Não criar migration para esse bug.
- Não alterar regras de negócio.
- Não mexer em APIs externas, Supabase remoto, Vercel ou credenciais.
- Não reescrever documentos longos sem necessidade.
- Não fazer commit/push sem autorização explícita no prompt.

Validações esperadas:

- `npm run typecheck` em `frontend/`
- `npm run build` em `frontend/`
- `git diff --check`
- busca por `confirm(` e `window.prompt`
- verificação simples de segredos no diff/stage

Ao final, relate: causa, arquivos alterados, validações, o que Gabriel deve
conferir no deploy e se há necessidade de autorização para commit/push.
