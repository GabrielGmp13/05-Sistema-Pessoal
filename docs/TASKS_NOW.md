# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Hub inicial v2, navegação global e logout visível implementados; Biblioteca e Treino v2 funcionalmente prontos; Estudos v2 com 9 rotas de página implementadas e restilizadas, correções de modelagem de 2026-08 aplicadas.
**Bloqueio:** nenhum.
**Banco:** cadeia ativa consolidada; as três baselines estão registradas como `applied` em produção e o dry-run final não encontrou pendências.
**Reprodutibilidade:** consolidada em 2026-08-08 — toolchain fixado, `npm ci`, typecheck e build aprovados, CI mínima criada; lint mantém dívida conhecida.
**Próxima ação:** corrigir pendências de usabilidade seguras restantes (começando por `confirm()` nativo em Treino/Biblioteca), sem misturar com features novas ou mudanças de banco.

---

## 🔴 Cutover v1 → v2 (DEC-031) — pendência antiga, ainda em aberto

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado (confirmado: 2026-07-13)
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [x] Hub inicial v2 com navegação para `/treino`, `/biblioteca`, `/estudos` e logout visível implementado localmente (2026-08-09)
- [x] **Teste de login end-to-end na URL de produção confirmado pelo usuário** (2026-08-09)
- [x] Hub `/` validado em produção pelo usuário (passou; polimento do hub fica para etapa futura)
- [x] Navegação funcionando em produção para `/treino`, `/biblioteca` e `/estudos` (2026-08-09)
- [x] Logout validado em produção pelo usuário (2026-08-09)
- [x] Problemas observados no smoke test online: nenhum relatado pelo usuário

## Próxima tarefa de feature, depois do smoke test — Integração de APIs externas

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
- [x] **Teste manual completo no navegador** — smoke test online das rotas principais concluído pelo usuário em produção (2026-08-09)
- [x] **Teste em produção (Vercel)** — acesso a `/estudos` confirmado no smoke test online (2026-08-09); teste profundo das 9 rotas internas ainda pode ser feito em etapa própria
- [ ] `SubjectManager`: `topics`/`accuracy` ainda fixos em 0 (pendência antiga, não tocada)
- [ ] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` — schema existe e confere com o banco real (reconfirmado em 2026-08), sem página ainda
- [x] Vínculo de conteúdo compartilhado deixou de usar `window.prompt` e passou a usar seleção visível de matéria (2026-08-09)
- [x] Ações destrutivas de Estudos agora passam por modal de confirmação (conteúdo, prova, atividade, módulo de curso e foto de redação)

## Pendências de polimento

Ver `BACKLOG.md` — `confirm()` nativo remanescente em Treino/Biblioteca, menu "⋯" não fecha ao clicar fora, upload de capa/banner manual, edição de itens em listas aninhadas.
