# ROADMAP.md

## Visão de Produto

Sistema de gestão pessoal online, multi-dispositivo, para uso pessoal de longo prazo. Fases independentes e entregáveis por si sós.

---

## Fase M — Migração para Supabase ✅ CONCLUÍDA

**Objetivo:** Adaptar toda a arquitetura para hospedagem online antes de continuar o desenvolvimento de features.

M0 e M1 entregues e testados. M2 e M3 descartados do escopo (ver
justificativa na tabela de sub-fases abaixo). Este projeto é considerado
"terminado" na v1 sem essas duas sub-fases — a v1 em si foi aposentada por
completo em 2026-07-19 (DEC-031), toda esta fase é histórico.

### Sub-fases

| Sub-fase | Descrição | Status |
|---|---|---|
| M0 — Infraestrutura | Projeto Supabase, schema PostgreSQL, buckets, repositório GitHub | ✅ Completo |
| M1 — Auth + Core JS | `login.html`, `supabase.js`, `auth.js`, `sm2.js`, `treino-plano.html`, `treino-academia.html` (v1, arquivos não existem mais no repositório) | ✅ Completo |
| M2 — Storage + SW | Service Worker, upload real de arquivos | ⛔ Fora de escopo — uso real sempre terá wifi disponível (inclusive na academia), offline não é necessário. Reavaliar só se essa premissa mudar. |
| M3 — Realtime | Subscrições Postgres Changes em páginas principais | ⛔ Fora de escopo — sync entre dispositivos já ocorre via banco central; a única diferença de Realtime é atualização automática sem reload, o que não importa no uso sequencial real (um dispositivo por vez). |

### Critério de conclusão da Fase M
- [x] Sistema acessível via URL pública com HTTPS (Vercel) — deploy em 2026-07-13
- [x] Login funciona (email + senha) — testado com usuário real na URL do Vercel (2026-07-13)
- [x] `treino-plano.html` testado e confirmado com Supabase (2026-07-13 — sem bugs encontrados)
- [x] `treino-academia.html` testado com Supabase (2026-07-13 — sem bugs encontrados)
- [x] Dados sincronizados entre PC e celular automaticamente — confirmado via acesso multi-dispositivo (2026-07-13)
- [x] Upload de foto funciona via Supabase Storage (`treino-shape.html`, bucket `shape` — 2026-07-13)

### Arquivos LAN removidos (histórico)
`app.py`, `database.db`, `requirements.txt`, `iniciar.bat`, `db.js`, `api.js`, `sync.js` e a pasta `backend/` da arquitetura LAN antiga foram removidos do projeto. (Nota: a pasta `backend/` que existe hoje no repositório é outra coisa — só guarda `backend/supabase/migrations/*.sql`, não tem relação com o `backend/` da arquitetura LAN descontinuada.)

## Fase 1 — Fundação ✅ COMPLETA (histórico — arquitetura LAN, aproveitada na migração)

- 20 tabelas (schema migrado para PostgreSQL)
- CRUD genérico (substituído por Supabase JS)
- Algoritmo SM-2 (reimplementado em JavaScript — `sm2.js`, v1; hoje vive em `frontend/lib/revisao.ts`, TypeScript)
- Biblioteca CSS completa (100% aproveitada na v1, substituída por CSS Modules/Tailwind na v2)
- PWA manifest + ícones
- Fontes self-hosted
- Dashboard básico

---

## Fase 2 — Módulo de Treino ✅ COMPLETA (v1, histórico — ver Fase 7.1 para o estado real em v2)

**Arquivo (v1, não existe mais):** `treino-plano.html`, `treino-academia.html`, `treino.html`, `treino-shape.html`

### Funcionalidades herdadas pela v2
- CRUD de divisões e exercícios
- Modo Academia: séries, timer, detecção de PR (carga real acima do máximo histórico do exercício)
- Calendário mensal (verde = treino feito · azul = treino feito com PR · vermelho = agendado e não feito · cinza = agendado no futuro)
- Upload de foto de shape via Supabase Storage (bucket `shape`, privado)
- Gráfico de evolução de peso (ainda não portado pra v2, ver `BACKLOG.md`)

---

## Fase 3 — Módulo de Estudos ✅ COMPLETA (v1, histórico — ver Fase 7.3 para o estado real em v2)

**Arquivo (v1, não existe mais):** `estudos.html` (página única com filtro por tipo — ver DEC-013)
**Migração:** `002_estudos.sql` — executada e confirmada no Supabase (2026-07-11). Tabelas substituídas pela v2 em `015_estudos_v2.sql` (ver `DATABASE.md`).

---

## Fase 4 — Biblioteca ✅ COMPLETA (v1, histórico — ver Fase 7.2 para o estado real em v2)

**Arquivo (v1, não existe mais):** `biblioteca.html`
**Migração:** `003_biblioteca.sql` — executada e confirmada no Supabase (2026-07-11)

Schema original: 11 tabelas (`livros`, `filmes`, `series`, `mangas`, `podcasts`, `tags`, 5 tabelas de junção `*_tags`) — ver DEC-014. Estendido pela v2 (`006`–`014`, ver `DATABASE.md`).

## Fase 5 — Revisão Espaçada ✅ COMPLETA (v1, histórico — sem equivalente de página dedicada em v2 ainda)

**Arquivo (v1, não existe mais):** `revisao.html`

A página havia sido gerada assumindo colunas (`frente`, `verso`, `intervalo`, `fator`) diferentes das reais (`pergunta`, `resposta`, `intervalo_dias`, `ef`), e uma assinatura de `calcularSM2()` incompatível. Corrigido em 2026-07-11 — ver `DATABASE.md` → Gotchas. O algoritmo SM-2 em si está ativo e em uso pela v2 via `frontend/lib/revisao.ts`, reaproveitado por Estudos (ver DEC-035) — só não existe uma tela dedicada de Revisão Espaçada na v2 ainda (Fase 7.4, abaixo).

## Fase 6 — Integrações Externas ⏳ FUTURO

| Integração | Finalidade | Via |
|---|---|---|
| Google Calendar OAuth | Importar agenda de treinos | Supabase Edge Function (ver DEC-009 — decisão de não fazer isso no MVP) |
| TMDB API | Metadados filmes/séries | API Route (`app/api/tmdb/search/route.ts`) — nenhuma API Route existe no projeto ainda |
| Google Books, Jikan, iTunes Search | Metadados livros/mangás/podcasts | Fetch direto no client (sem key) |
| Notificações push | Lembretes de treino e revisão | Service Worker Push API |

## Fase 7 — v2: Migração para Next.js/React 🔄 EM ANDAMENTO

**Objetivo:** migrar o frontend de HTML puro para Next.js/React (DEC-018), de
forma incremental, módulo por módulo.

**Importante:** v1 foi removida do projeto em 2026-07-19 (DEC-031) — o
frontend Next.js (pasta `frontend/`, renomeada de `frontend-v2/`) é o único
frontend ativo. Revisão Espaçada dedicada e Agenda ainda não têm equivalente
v2 — ausência deliberada e temporária (ver DEC-031), não bug.

**Escopo de features por módulo:** cada módulo migrado passa primeiro por
`MODULE_TEMPLATE.md` completo — incluindo a pergunta "precisa de API Route?"
— antes de qualquer linha de código.

### Sub-fases

| Sub-fase | Descrição | Status |
|---|---|---|
| 7.0 | Setup do projeto Next.js — estrutura de pastas, `lib/supabase.ts`, `proxy.ts` (renomeado de `middleware.ts`, DEC-031), layout base, CSS global | ✅ Completo |
| 7.1 | Treino v2 | ✅ Completo — pendências de polimento em `BACKLOG.md` (confirm() nativo, gráfico de peso, upload de imagem de exercício) |
| 7.2 | Biblioteca v2 (B1–B6) | ✅ Frontend completo, consolidado em página única com sidebar (DEC-032), identidade visual própria (DEC-034) — teste E2E geral em produção ainda pendente (ver `TASKS_NOW.md`) |
| 7.3 | Estudos v2 (Fase 1 + Fase 1B) | ✅ 8 telas implementadas e restilizadas (Tailwind/shadcn); schema estendido por `017`/`018`/`019` (gabarito ENEM em 2 fases, matéria única Escola/ENEM, domínio de conteúdo) — todas as migrations confirmadas executadas via dump real do banco (2026-08). Teste manual completo no navegador em andamento; teste em produção ainda pendente — ver `TASKS_NOW.md` |
| 7.4 | Revisão Espaçada v2 (página dedicada) | ⏳ a planejar |
| 7.5 | Agenda v2 (módulo dedicado, hoje só existe como tabela `agenda` sem UI) | ⏳ a planejar — depende de decidir onde mora "cronograma de estudo" primeiro, ver `BACKLOG.md` |
