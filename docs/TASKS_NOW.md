# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Biblioteca e Treino v2 funcionalmente prontos; Estudos v2 com as 8 telas implementadas e restilizadas, correções de modelagem de 2026-08 aplicadas.
**Bloqueio:** nenhum.
**Próxima ação:** aplicar as correções de documentação e código listadas na seção "🔴 Auditoria de migração para o Codex" abaixo, começando pelo `package.json`.

---

## 🔴 Auditoria de migração para o Codex (2026-08) — em andamento

O projeto passou por uma auditoria completa (feita pelo Codex, revisada e reconciliada com o Claude) para preparar a transição de desenvolvimento assistido por IA de chat para Codex/`AGENTS.md`. Achados principais e o que já foi resolvido nesta sessão de documentação:

- [x] Extraído dump real do schema de produção (`schema_real.sql`, via Supabase CLI) e reconciliado contra `DATABASE.md` — duas tabelas estavam documentadas de forma desatualizada (`conteudos`, `questoes_individuais`); corrigidas.
- [x] Confirmado que as migrations `004`, `005`, `007`, `010`, `014`, `019` nunca foram copiadas para o VS Code (falha de cópia manual, não perda de dado) — todas estavam executadas no Supabase. Arquivos `.sql` reconstruídos e adicionados a `backend/supabase/migrations/`.
- [x] Confirmado que `015_estudos_v2.sql` e `016_estudos_v2_fase1b.sql` locais estavam com conteúdo corrompido (referências circulares entre tabelas) — o banco de produção nunca teve esse problema, só a cópia no repositório. Ambos os arquivos foram reescritos para bater com o dump real.
- [x] `DECISIONS.md` corrigido: `014` e `015` estavam marcadas como "execução pendente" quando já estavam executadas há semanas; DEC-032 estava marcada como "código pendente" quando já foi implementada em 2026-07-19.
- [x] `ARCHITECTURE.md` reescrito — descrevia partes da v1 (HTML puro, `window.sb`, `sm2.js`) como se fossem a arquitetura atual, e dizia "deploy do Vercel ainda não feito" (o deploy é de 2026-07-13).
- [x] `BACKLOG.md` estava com todo o conteúdo duplicado a partir da metade do arquivo — deduplicado.
- [ ] **Corrigir `frontend/package.json`:** remover a dependência `shadcn` (é CLI, não lib de runtime) e trocar `"name": "frontend-v2"` para `"name": "frontend"`. Depois, `rm -rf node_modules package-lock.json && npm install` para regenerar o lockfile limpo.
- [ ] Investigar as 26 ocorrências de lint `react-hooks/set-state-in-effect` antes de corrigir em lote — pode ser estilo ou pode ser `setState` mal guardado dentro de `useEffect`. Ver `BACKLOG.md`.
- [ ] Criar `AGENTS.md` (adaptado de `CLAUDE.md`) com os caminhos corretos confirmados nesta auditoria — `docs/` (não raiz), `backend/supabase/migrations/` (não `supabase/migrations/`), sem menção a `frontend-v2`.
- [ ] `CLAUDE.md` na raiz deve virar um stub curto apontando pra `AGENTS.md`, não duas fontes de instrução paralelas.
- [ ] Confirmar diretamente no Supabase se `materias.user_id` deveria ganhar `ON DELETE CASCADE` (hoje é a única FK do projeto sem essa cláusula) e se vale adicionar `CHECK` em `materias.tipo` — ver `DATABASE.md` → Gotchas e `BACKLOG.md`.

---

## 🔴 Cutover v1 → v2 (DEC-031) — pendência antiga, ainda em aberto

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado (confirmado: 2026-07-13)
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [ ] **Confirmar teste de login end-to-end na URL de produção** — ainda não formalmente confirmado pelo usuário, apesar do deploy estar de pé há semanas
- [ ] Confirmar navegação funcionando em `/treino`, `/biblioteca` e `/estudos` na URL de produção (Estudos nunca foi testado em produção — só em `localhost`, ver seção Estudos abaixo)

## Próxima tarefa de escopo — Integração de APIs externas

Precisa de `MODULE_TEMPLATE.md` completo antes de começar. Confirmado por
inspeção do código (2026-08): **nenhuma `app/api/**/route.ts` existe ainda**
no projeto — esta será a primeira.
- TMDB (filmes/séries) — única que precisa de API Route por causa da chave secreta (ver DEC-018)
- Google Books (livros), Jikan/MyAnimeList (mangás), iTunes Search (podcasts) — sem key, podem ser chamadas direto do client
- Animes: sem API própria definida ainda (Jikan cobre mangá, não anime — verificar se cobre também)

## Próximo módulo a planejar (v2)

- [ ] Definir se Revisão Espaçada dedicada ou Agenda entra primeiro (Estudos já está em estado avançado)
- [ ] Rodar `MODULE_TEMPLATE.md` completo antes de qualquer schema ou código
- [ ] Antes de planejar Agenda: decidir onde mora "cronograma de estudo" (o que estudar, quando, prioridade — ver `BACKLOG.md`), porque toca os dois módulos

---

## 🟢 Estudos v2 — Correção de modelagem pós-design (2026-08) — concluída, teste manual em andamento

- [x] Migration 017 (área ENEM, letra do gabarito, redação com imagem) executada
- [x] Migration 018 (matéria única, mostra_escola/mostra_enem, limpeza de dado duplicado) executada
- [x] Migration 019 (gabarito 2 fases, domínio de conteúdo, dificuldade) executada — **reconfirmado no dump real do schema em 2026-08**
- [x] `lib/materias.ts`, `lib/conteudos.ts`, `lib/questoes-individuais.ts`, `lib/provas.ts`, `lib/revisao.ts`, `lib/redacoes.ts` atualizados
- [x] Páginas de Estudos atualizadas (Hub, ENEM, área ENEM nova, Escola, Curso×2, Matéria, Gabarito) — `npx tsc --noEmit` limpo
- [ ] **Teste manual completo no navegador** — em andamento pelo usuário
- [ ] **Teste em produção (Vercel)** — nenhuma das 8 telas de Estudos foi validada fora do `localhost` até agora (mesma pendência da seção de Cutover, acima)
- [ ] `SubjectManager`: `topics`/`accuracy` ainda fixos em 0 (pendência antiga, não tocada)
- [ ] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` — schema existe e confere com o banco real (reconfirmado em 2026-08), sem página ainda
- [ ] Vínculo de conteúdo compartilhado ainda via `window.prompt` (confirmado por inspeção do código em `app/estudos/materia/[materiaUuid]/page.tsx`, 2026-08)

## Pendências de polimento

Ver `BACKLOG.md` — `confirm()` nativo (8 arquivos confirmados: Treino e Biblioteca), menu "⋯" não fecha ao clicar fora, upload de capa/banner manual, edição de itens em listas aninhadas.

---

## Histórico recente (para contexto, não ação pendente)

As seções abaixo documentam trabalho já concluído e servem de referência —
não são tarefas ativas.

### Estudos v2 — Fase 1 (núcleo) e Fase 1B — concluídas
Migration `015_estudos_v2.sql` gerada em 2026-07-20, executada e confirmada
em 2026-07-22. `lib/revisao.ts` criado em 2026-07-25 (não existia na v2),
desbloqueando `lib/simulados.ts`. Migration `016_estudos_v2_fase1b.sql`
executada e confirmada em 2026-07-23. Primeira leva de frontend (versão crua)
aplicada sem erros pelo usuário. Ver `CHANGELOG.md` para o detalhamento
completo.

### Estudos v2 — Design (Tailwind + shadcn, DEC-037/038/039) — concluído
Paleta v0.dev adotada como padrão do sistema (exceto Biblioteca), Tailwind
v4 + shadcn/ui adotado para Estudos, toggle claro/escuro implementado. As 8
telas de Estudos (Hub, ENEM, Gabarito, Escola, Curso×2, Matéria, Redações)
foram restilizadas entre 2026-07-26 e 2026-07-31, preservando 100% da
lógica de dados real. `GradeManager` do v0.dev descartado por completo (sem
schema equivalente) — registrado em `BACKLOG.md`. Ver `CHANGELOG.md`.

### Correção de tipos em `lib/supabase.ts` (2026-07-27) — concluída
`sbErr()` e `softDelete()` corrigidas, resolvendo 37 + 15 erros de
TypeScript em cascata por todo o projeto. Bug de rota corrigido
(`[materialUuid]` → `[materiaUuid]`). `npx tsc --noEmit` confirmado limpo —
e reconfirmado nesta auditoria de 2026-08 (o relatório do Codex também
encontrou 0 erros de TypeScript, só de lint).

### Biblioteca v2: consolidação (DEC-032) e identidade visual (DEC-034) — concluídas
Página única com sidebar por categoria (2026-07-19) e redesign dourado/âmbar
(2026-07-20), ambas testadas e ajustadas pelo usuário. Ver `CHANGELOG.md`.
