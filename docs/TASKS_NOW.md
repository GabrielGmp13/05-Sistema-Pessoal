# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Biblioteca e Treino v2 funcionalmente prontos; Estudos v2 com 9 rotas de página implementadas e restilizadas, correções de modelagem de 2026-08 aplicadas.
**Bloqueio:** nenhum.
**Banco:** cadeia ativa consolidada; as três baselines estão registradas como `applied` em produção e o dry-run final não encontrou pendências.
**Próxima ação:** validar a reprodutibilidade do frontend/repositório, sem mudança funcional.

---

## 🔴 Próximo bloco técnico — reprodutibilidade do frontend/repositório

Não resolver junto com features. Executar como uma etapa própria, preservando
o comportamento atual:

- [ ] Corrigir `frontend/package.json`: `name` ainda é `frontend-v2` e
  `shadcn` precisa ser avaliada/removida como dependência de runtime.
- [ ] Regenerar e revisar `frontend/package-lock.json` de forma controlada.
- [ ] Confirmar instalação limpa com `npm ci`.
- [ ] Rodar typecheck (`npx tsc --noEmit`, de dentro de `frontend/`).
- [ ] Rodar `npm run build`.
- [ ] Rodar `npm run lint` e registrar/classificar os achados antes de
  qualquer correção em lote.

## 🟢 Consolidação do banco — concluída em 2026-08-08

- [x] Arqueologia e proveniência de `001`–`019` encerradas; arquivos movidos
  para `backend/supabase/history/legacy-migrations/`, sem suporte a replay.
- [x] Snapshot forense de produção consolidado, sem dados pessoais.
- [x] Cinco buckets, 14 policies Storage, RLS, grants, função e event trigger
  recapturados e validados.
- [x] Três baselines timestamped geradas e preservadas como cadeia ativa.
- [x] Dois replays locais completos, testes estruturais/comportamentais e
  comparação local × produção aprovados.
- [x] Ensaio remoto descartável comprovou que `migration repair` registra
  histórico sem executar SQL de migration.
- [x] Produção recapturada imediatamente antes da adoção e confirmada
  equivalente às baselines.
- [x] Produção passou a registrar exatamente `20260807000100`,
  `20260807000200` e `20260807000300` como `applied`.
- [x] `migration list` local/remoto alinhado e `db push --dry-run` final com
  `upToDate=true`, `dryRun=true`, `migrations=[]`.
- [x] Nenhum `db push` real e nenhuma baseline SQL executados em produção.
- [x] `AGENTS.md` e `CLAUDE.md` consolidados como instrução principal e stub.

Hardenings conhecidos (`materias.user_id`, `materias.tipo`, policies de
Storage e grants atuais) não pertencem à baseline retroativamente. Permanecem
no `BACKLOG.md` para migrations incrementais futuras e separadas.

---

## 🔴 Cutover v1 → v2 (DEC-031) — pendência antiga, ainda em aberto

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado (confirmado: 2026-07-13)
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [ ] **Confirmar teste de login end-to-end na URL de produção** — ainda não formalmente confirmado pelo usuário, apesar do deploy estar de pé há semanas
- [ ] Confirmar navegação funcionando em `/treino`, `/biblioteca` e `/estudos` na URL de produção (Estudos nunca foi testado em produção — só em `localhost`, ver seção Estudos abaixo)

## Próxima tarefa de feature, depois da reprodutibilidade — Integração de APIs externas

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
- [x] Páginas de Estudos atualizadas (Hub, ENEM, área ENEM nova, Escola, Curso×2, Matéria, Gabarito e Redações: 9 rotas de página) — `npx tsc --noEmit` limpo
- [ ] **Teste manual completo no navegador** — em andamento pelo usuário
- [ ] **Teste em produção (Vercel)** — nenhuma das 9 rotas de página de Estudos foi validada fora do `localhost` até agora (mesma pendência da seção de Cutover, acima)
- [ ] `SubjectManager`: `topics`/`accuracy` ainda fixos em 0 (pendência antiga, não tocada)
- [ ] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` — schema existe e confere com o banco real (reconfirmado em 2026-08), sem página ainda
- [ ] Vínculo de conteúdo compartilhado ainda via `window.prompt` (confirmado por inspeção do código em `app/estudos/materia/[materiaUuid]/page.tsx`, 2026-08)

## Pendências de polimento

Ver `BACKLOG.md` — `confirm()` nativo (9 arquivos, 10 ocorrências, em Treino e Biblioteca), menu "⋯" não fecha ao clicar fora, upload de capa/banner manual, edição de itens em listas aninhadas.

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
