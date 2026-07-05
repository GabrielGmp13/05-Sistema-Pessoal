# ROADMAP.md

## Visão de Produto

Sistema de gestão pessoal online, multi-dispositivo, para uso pessoal de longo prazo. Fases independentes e entregáveis por si sós.

---

## Fase M — Migração para Supabase 🔄 EM ANDAMENTO

**Objetivo:** Adaptar toda a arquitetura para hospedagem online antes de continuar o desenvolvimento de features.

### Sub-fases

| Sub-fase | Descrição | Status |
|---|---|---|
| M0 — Infraestrutura | Projeto Supabase, schema PostgreSQL, buckets, repositório GitHub | ✅ Supabase completo · 🔄 Vercel deferido de propósito |
| M1 — Auth + Core JS | `login.html`, `supabase.js`, `auth.js`, `sm2.js`, `treino-plano.html`, `treino-academia.html` | ✅ Todos os arquivos gerados — pendente testes e limpeza de arquivos LAN |
| M2 — Storage + SW | Service Worker, upload real de arquivos | 🔄 Pendente |
| M3 — Realtime | Subscrições Postgres Changes em páginas principais | 🔄 Pendente |

### Critério de conclusão da Fase M
- [ ] Sistema acessível via URL pública com HTTPS (Vercel)
- [x] Login funciona (email + senha) — testado com usuário real
- [ ] `treino-plano.html` testado e confirmado com Supabase
- [ ] `treino-academia.html` testado com Supabase (offline = Fase M2 — Service Worker)
- [ ] Dados sincronizados entre PC e celular automaticamente
- [ ] Upload de foto funciona via Supabase Storage

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

### O que ainda existe no disco mas será eliminado
`app.py`, `requirements.txt`, `iniciar.bat`, `db.js`, `api.js`, `sync.js` continuam no repositório. **Remoção agora desbloqueada** — pode ser feita após confirmar que `treino-plano.html` e `treino-academia.html` estão funcionando via Supabase. Não apagar antes da confirmação dos testes.

---

## Fase 1 — Fundação ✅ COMPLETA (arquitetura LAN — aproveitada na migração)

- 20 tabelas (schema migrado para PostgreSQL)
- CRUD genérico (substituído por Supabase JS)
- Algoritmo SM-2 (reimplementado em JavaScript — `sm2.js`)
- Biblioteca CSS completa (100% aproveitada)
- PWA manifest + ícones
- Fontes self-hosted
- Dashboard básico

---

## Fase 2 — Módulo de Treino 🔄 PARCIALMENTE COMPLETA

**Objetivo:** sistema completo de gestão de treino físico.

| Arquivo | Descrição | Status |
|---|---|---|
| `treino-plano.html` | CRUD divisões + exercícios | ✅ Gerado — aguardando teste/confirmação |
| `treino-academia.html` | Modo Academia mobile | ✅ Gerado — aguardando teste/confirmação |
| `treino.html` | Hub: calendário + radar chart | ⏳ Após Fase M1 (tabela `agenda` já existe no schema) |
| `treino-shape.html` | Shape: fotos (Supabase Storage) + gráfico peso | ⏳ Após Fase M2 (bucket `shape` já existe; falta UI de upload) |

### Funcionalidades (inalteradas — só a camada de dados muda)
- CRUD de divisões e exercícios
- Modo Academia: séries, timer, detecção de PR (carga real acima do máximo histórico do exercício)
- Calendário mensal (verde = treino feito · azul = treino feito com PR · vermelho = agendado e não feito · cinza = agendado no futuro)
- Agenda semanal manual (tabela `agenda` já criada)
- Upload de foto de shape via Supabase Storage (bucket `shape`, privado)
- Gráfico de evolução de peso
- Radar chart: Disciplina / Força / Resistência

---

## Fase 3 — Módulo de Estudos ⏳ PLANEJADA

**Arquivos:** `enem.html`, `olimpiadas.html`, `escola.html`
**Migração futura:** `supabase/migrations/002_estudos.sql`

Sistema ENEM standalone existente (`C:\Gabriel Oliveira\04-Educacional\Enem\`, 13 páginas localStorage): decidir se integra ao sistema principal ou permanece separado.

---

## Fase 4 — Biblioteca ⏳ PLANEJADA

**Arquivo:** `biblioteca.html`
**Migração futura:** `supabase/migrations/003_biblioteca.sql`

**Escopo revisado (DEC-011):** catálogo pessoal de mídia, no estilo Skoob / Letterboxd / MyAnimeList. O sistema **não** armazena arquivos de mídia (livros, filmes, séries, músicas) — apenas identificação, metadados, notas, avaliações, datas, progresso, comentários, categorias e tags.

| Mídia | API de metadados | Origem da capa |
|---|---|---|
| Livros | Google Books API | URL da API; upload manual para `capas` só se a API não tiver capa |
| Filmes / Séries | TMDB API | URL da API; upload manual para `capas` só se a API não tiver capa |
| Mangás | Manual | Upload manual para `capas` (sem API definida ainda) |
| Podcasts | Manual | Upload manual para `capas` (sem API definida ainda) |

Funcionalidades: status de leitura/visualização (lendo, pausado, concluído, abandonado), avaliações, notas pessoais.

---

## Fase 5 — Revisão Espaçada ⏳ PLANEJADA

**Arquivo:** `revisao.html`

Backend pronto: tabela `revisao_espacada` já existe no schema; `sm2.js` já implementa `calcularSM2` e `avaliarCard`. Esta fase é apenas a interface — listar cards vencidos do dia e capturar a avaliação de qualidade (0–3).

---

## Fase 6 — Integrações Externas ⏳ FUTURO

| Integração | Finalidade | Via |
|---|---|---|
| Google Calendar OAuth | Importar agenda de treinos | Supabase Edge Function (ver DEC-009) |
| TMDB API | Metadados filmes/séries | Fetch no frontend |
| Google Books API | Metadados livros | Fetch no frontend |
| Notificações push | Lembretes de treino e revisão | Service Worker Push API |
