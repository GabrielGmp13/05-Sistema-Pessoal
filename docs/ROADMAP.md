# ROADMAP.md

## Visão de Produto

Sistema de gestão pessoal online, multi-dispositivo, para uso pessoal de longo prazo. Fases independentes e entregáveis por si sós.

---

## Fase M — Migração para Supabase 🔄 EM ANDAMENTO

**Objetivo:** Adaptar toda a arquitetura para hospedagem online antes de continuar o desenvolvimento de features.
**Fase M: CONCLUÍDA** — M0 e M1 entregues e testados. M2 e M3 descartados do
escopo (ver justificativa na tabela de sub-fases acima). Este projeto é considerado "terminado" na v1 sem essas duas sub-fases.

### Sub-fases

| Sub-fase | Descrição | Status |
|---|---|---|
| M0 — Infraestrutura | Projeto Supabase, schema PostgreSQL, buckets, repositório GitHub | ✅ Supabase completo · 🔄 Vercel deferido de propósito |
| M1 — Auth + Core JS | `login.html`, `supabase.js`, `auth.js`, `sm2.js`, `treino-plano.html`, `treino-academia.html` | ✅ Todos os arquivos gerados — pendente testes e limpeza de arquivos LAN |
| M2 — Storage + SW | Service Worker, upload real de arquivos | ⛔ Fora de escopo — uso real sempre terá wifi disponível (inclusive na academia), offline não é necessário. Reavaliar só se essa premissa mudar. |
| M3 — Realtime | Subscrições Postgres Changes em páginas principais | ⛔ Fora de escopo — sync entre dispositivos já ocorre via banco central; a única diferença de Realtime é atualização automática sem reload, o que não importa no uso sequencial real (um dispositivo por vez). |

### Critério de conclusão da Fase M
- [x] Sistema acessível via URL pública com HTTPS (Vercel) — deploy em 2026-07-13
- [x] Login funciona (email + senha) — testado com usuário real na URL do Vercel (2026-07-13, após recriação do usuário — ver CHANGELOG)
- [x] `treino-plano.html` testado e confirmado com Supabase (2026-07-13 — sem bugs encontrados)
- [x] `treino-academia.html` testado com Supabase (2026-07-13 — sem bugs encontrados; offline continua pendente, Fase M2 — Service Worker)
- [x] Dados sincronizados entre PC e celular automaticamente — confirmado via acesso multi-dispositivo (2026-07-13)
- [x] Upload de foto funciona via Supabase Storage (`treino-shape.html`, bucket `shape` — 2026-07-13)

### O que já foi entregue (M0 + M1 completo)
- Schema PostgreSQL completo executado e verificado (`001_schema_inicial.sql`): 8 tabelas, RLS em todas, 3 buckets privados, índices parciais
- Repositório GitHub criado como privado, projeto enviado
- `supabase.js` — cliente configurado + helpers (auth, storage com signed URL, soft delete)
- `auth.js` — verificação de sessão com redirect automático
- `sm2.js` — algoritmo SM-2 completo, incluindo integração direta com o Supabase
- `login.html` — tela de autenticação funcionando (testada com conta real)
- `index.html` — dashboard adaptado para Supabase (testado e confirmado)
- `treino-plano.html` — CRUD de divisões e exercícios via Supabase, reordenação por `ordem` (gerado — aguardando teste)
- `treino-academia.html` — modo academia: sessão salva incrementalmente, timer 90s, detecção de PR, sem Chart.js (gerado — aguardando teste)

### O que é aproveitado da Fase 1/2 existente
- `style.css` — 100% (zero mudança)
- Fontes e ícones — 100%
- Estrutura HTML das páginas — ~80%
- Lógica de negócio (timer, PR detection, modais) — ~80%
- Schema das tabelas — 100% (já migrado para PostgreSQL e executado)

### Arquivos LAN removidos
`app.py`, `database.db`, `requirements.txt`, `iniciar.bat`, `db.js`, `api.js`, `sync.js` e a pasta `backend/` foram removidos do projeto.

## Fase 1 — Fundação ✅ COMPLETA (arquitetura LAN — aproveitada na migração)

- 20 tabelas (schema migrado para PostgreSQL)
- CRUD genérico (substituído por Supabase JS)
- Algoritmo SM-2 (reimplementado em JavaScript — `sm2.js`)
- Biblioteca CSS completa (100% aproveitada)
- PWA manifest + ícones
- Fontes self-hosted
- Dashboard básico

---

## Fase 2 — Módulo de Treino ✅ COMPLETA

**Objetivo:** sistema completo de gestão de treino físico.

| Arquivo | Descrição | Status |
|---|---|---|
| `treino-plano.html` | CRUD divisões + exercícios | ⚠️ Implementado — verificar nomes de coluna (ver DATABASE.md → Gotchas) |
| `treino-academia.html` | Modo Academia mobile | ✅ Implementado e corrigido (auditoria M1) |
| `treino.html` | Hub: calendário + radar chart | ✅ Implementado |
| `treino-shape.html` | Shape: fotos (Supabase Storage) + gráfico peso | ✅ Implementado |

### Funcionalidades (inalteradas — só a camada de dados muda)
- CRUD de divisões e exercícios
- Modo Academia: séries, timer, detecção de PR (carga real acima do máximo histórico do exercício)
- Calendário mensal (verde = treino feito · azul = treino feito com PR · vermelho = agendado e não feito · cinza = agendado no futuro)
- Agenda semanal manual (tabela `agenda` já criada)
- Upload de foto de shape via Supabase Storage (bucket `shape`, privado)
- Gráfico de evolução de peso
- Radar chart: Disciplina / Força / Resistência

---

## Fase 3 — Módulo de Estudos ✅ COMPLETA

**Arquivo:** `estudos.html` (página única com filtro por tipo — ver DEC-013)
**Migração:** `supabase/migrations/002_estudos.sql` — ✅ criado · ✅ executado e confirmado no Supabase (2026-07-11) · ✅ RLS + GRANT confirmados (2026-07-13)

---
## Fase 4 — Biblioteca 🔄 EM ANDAMENTO

**Arquivo:** `biblioteca.html` (não iniciado)
**Migração:** `supabase/migrations/003_biblioteca.sql` — ✅ criada · ✅ executada e confirmada no Supabase (2026-07-11)

Schema: 11 tabelas (`livros`, `filmes`, `series`, `mangas`, `podcasts`, `tags`,
5 tabelas de junção `*_tags`) — ver DEC-014.

APIs de metadados (buscadas ao vivo, não persistidas): TMDB (filmes/séries),
Google Books (livros), MyAnimeList/Jikan (mangás). Podcasts seguem manuais —
sem API definida ainda.

## Fase 5 — Revisão Espaçada ✅ COMPLETA

**Arquivo:** `revisao.html` — implementado e corrigido

A página havia sido gerada assumindo colunas (`frente`, `verso`, `intervalo`, `fator`) diferentes das reais (`pergunta`, `resposta`, `intervalo_dias`, `ef`), e uma assinatura de `calcularSM2()` incompatível com a de `sm2.js`. Corrigido em 2026-07-11 (via Cline+DeepSeek) — ver `DATABASE.md` → Gotchas e `CHANGELOG.md` para o detalhamento.
## Fase 6 — Integrações Externas ⏳ FUTURO

| Integração | Finalidade | Via |
|---|---|---|
| Google Calendar OAuth | Importar agenda de treinos | Supabase Edge Function (ver DEC-009) |
| TMDB API | Metadados filmes/séries | Fetch no frontend |
| Google Books API | Metadados livros | Fetch no frontend |
| Notificações push | Lembretes de treino e revisão | Service Worker Push API |

## Fase 7 — v2: Migração para Next.js/React 🔄 PLANEJAMENTO

**Objetivo:** migrar o frontend de HTML puro para Next.js/React (DEC-018), de
+forma incremental, módulo por módulo.
+
+**Importante:** v1 foi removida do projeto em 2026-07-19 (DEC-031) — o
+frontend Next.js (pasta `frontend/`, renomeada de `frontend-v2/`) é agora o
+único frontend ativo. Estudos, Revisão Espaçada e Agenda dedicada ainda não
+têm equivalente v2 — ausência deliberada e temporária (ver DEC-031), não bug.

**Escopo de features por módulo:** ainda não definido. Cada módulo migrado
passa primeiro por `MODULE_TEMPLATE.md` completo — incluindo a nova pergunta
"precisa de API Route?" — antes de qualquer linha de código. Nenhuma novidade
de funcionalidade deve ser assumida como decidida até esse processo acontecer
módulo a módulo.

### Sub-fases

| Sub-fase | Descrição | Status |
|---|---|---|
| 7.0 | Setup do projeto Next.js — estrutura de pastas, `lib/supabase.ts`, `middleware.ts` (substitui `lib/auth.ts`, ver DEC-021), layout base, CSS global migrado | ✅ |
| 7.1 | Treino v2 | ✅ |
| 7.2 | Biblioteca v2 (B1–B6) | ✅ frontend completo · teste E2E geral pendente |
| 7.3 | Estudos v2 (Fase 1 + Fase 1B) | 🔄 8 telas geradas e restilizadas (Tailwind/shadcn); schema estendido por `017`/`018`/`019` (gabarito ENEM em 2 fases, matéria única Escola/ENEM, domínio de conteúdo); teste manual completo em andamento — ver CHANGELOG.md (2026-08) |
| 7.4 | Revisão Espaçada v2 | ⏳ a planejar |
| 7.5 | Agenda v2 (módulo dedicado, hoje só existia dentro do treino.html da v1) | ⏳ a planejar |