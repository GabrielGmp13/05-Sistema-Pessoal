# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` (Next.js, ex-`frontend-v2/`) é o único frontend ativo. Cutover de infra Vercel em andamento.
**Bloqueio:** nenhum
**Próxima ação:** confirmar teste de login end-to-end na nova URL do Vercel; depois, hub da Biblioteca + home mínima; depois, planejar Estudos ou Revisão Espaçada v2

---

## 🔴 Cutover v1 → v2 (DEC-031) — em andamento

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [x] Deploy realizado
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [ ] **Confirmar teste de login end-to-end na URL de produção nova** (pendente de confirmação do usuário)
- [ ] Confirmar navegação funcionando em `/treino` e em uma tela da Biblioteca (ex: `/biblioteca/filmes`) na URL de produção
- [ ] Gerar `app/biblioteca/page.tsx` (hub — hoje não existe, só as 6 telas soltas)
- [ ] Transformar `app/page.tsx` de placeholder em home mínima navegável (links para Treino e Biblioteca)

## Fase 7.2 — Biblioteca v2 (B1–B6): pendências

- [ ] Teste end-to-end geral contra o Supabase real (filmes, séries, animes, mangás, livros, podcasts) — adiado pelo usuário para sessão futura
- [ ] `animes_generos` (schema já existe) sem lib nem UI — ver `BACKLOG.md`

**Pendências de polimento (Treino v2 e Biblioteca v2):** ver `BACKLOG.md` — gráfico de peso, upload de imagem de exercício, reordenação de exercícios, integração de gênero nas 6 telas, upload de capa/banner, busca por API externa, edição de itens em listas aninhadas, `confirm()` nativo, menu "⋯" não fecha ao clicar fora.

## Próximo módulo a planejar (v2)

- [ ] Definir se Estudos ou Revisão Espaçada entra primeiro — aguardando detalhamento do usuário sobre o escopo pretendido (mencionado como "mais complexo" que a v1 atual)
- [ ] Rodar `MODULE_TEMPLATE.md` completo antes de qualquer schema ou código
- [ ] Agenda (módulo dedicado — hoje só existia dentro de `treino.html` na v1, sem equivalente v2) fica para depois, por decisão do usuário (abordagem "camada por camada", DEC-031)

## Fase 6 — Integrações Externas ⏳ FUTURO (sem mudança)

Ver `ROADMAP.md` — Google Calendar OAuth, notificações push. Sem planejamento ativo.