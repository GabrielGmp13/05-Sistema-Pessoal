# ROADMAP.md

## Visão de Produto

Sistema de gestão pessoal online, multi-dispositivo, para uso pessoal de longo prazo. Fases independentes e entregáveis por si sós.

---

## Fase M — Migração para Supabase 🔄 EM ANDAMENTO

**Objetivo:** Adaptar toda a arquitetura para hospedagem online antes de continuar o desenvolvimento de features.

### Sub-fases

| Sub-fase | Descrição | Duração estimada | Status |
|---|---|---|---|
| M0 — Infraestrutura | Criar projeto Supabase, schema PostgreSQL, deploy Vercel | 1-2 dias | 🔄 Pendente |
| M1 — Auth + Core JS | login.html, supabase.js, auth.js, sm2.js, adaptar páginas existentes | 3-4 dias | 🔄 Pendente |
| M2 — Storage + SW | Service Worker, upload real de arquivos | 2-3 dias | 🔄 Pendente |
| M3 — Realtime | Subscrições Postgres Changes em páginas principais | 1 dia | 🔄 Pendente |

### Critério de conclusão da Fase M
- [ ] Sistema acessível via URL pública com HTTPS
- [ ] Login funciona (email + senha)
- [ ] `treino-plano.html` funcionando com Supabase
- [ ] `treino-academia.html` funcionando offline (Service Worker)
- [ ] Dados sincronizados entre PC e celular automaticamente
- [ ] Upload de foto funciona via Supabase Storage

### O que é aproveitado da Fase 1/2 existente
- `style.css` — 100% (zero mudança)
- Fontes e ícones — 100%
- Estrutura HTML das páginas — ~80%
- Lógica de negócio (timer, PR detection, modais) — ~80%
- Schema das tabelas — 100% (migra para PostgreSQL)

### O que é eliminado
- `app.py`, `requirements.txt` → Flask eliminado
- `iniciar.bat` → sem servidor local
- `db.js`, `api.js`, `sync.js` → Supabase substitui
- IP LAN `10.0.0.188` → URL pública

---

## Fase 1 — Fundação ✅ COMPLETA (arquitetura LAN — aproveitada na migração)

- 20 tabelas (schema migrado para PostgreSQL)
- CRUD genérico (substituído por Supabase JS)
- Algoritmo SM-2 (reimplementado em JavaScript — sm2.js)
- Biblioteca CSS completa (1105 linhas — 100% aproveitada)
- PWA manifest + ícones
- Fontes self-hosted
- Dashboard básico

---

## Fase 2 — Módulo de Treino 🔄 PARCIALMENTE COMPLETA

**Objetivo:** sistema completo de gestão de treino físico.

| Arquivo | Descrição | Status |
|---|---|---|
| `treino-plano.html` | CRUD divisões + exercícios | ✅ Gerado (adaptar para Supabase JS) |
| `treino-academia.html` | Modo Academia mobile | ✅ Gerado (adaptar para Supabase JS + SW) |
| `treino.html` | Hub: calendário + radar chart | ⏳ Após Fase M |
| `treino-shape.html` | Shape: fotos (Supabase Storage) + gráfico peso | ⏳ Após Fase M |
| Schema `agenda` | Tabela de agenda manual | ⏳ Incluído na migração M0 |

### Funcionalidades (inalteradas — só a camada de dados muda)
- CRUD de divisões e exercícios
- Modo Academia: séries, timer, PR detection
- Calendário mensal (verde/azul/vermelho/cinza)
- Agenda semanal manual
- Upload de foto de shape via Supabase Storage
- Gráfico de evolução de peso
- Radar chart: Disciplina / Força / Resistência

---

## Fase 3 — Módulo de Estudos ⏳ PLANEJADA

**Arquivos:** `enem.html`, `olimpiadas.html`, `escola.html`

Sistema ENEM standalone existente (`C:\Gabriel Oliveira\04-Educacional\Enem\`, 13 páginas localStorage): decidir se integra ao sistema principal ou permanece separado.

---

## Fase 4 — Biblioteca ⏳ PLANEJADA

**Arquivo:** `biblioteca.html`

Tracking de livros (Google Books), filmes/séries (TMDB), mangás, podcasts.

---

## Fase 5 — Revisão Espaçada ⏳ PLANEJADA

**Arquivo:** `revisao.html`

SM-2 já implementado em `sm2.js`. Esta fase é apenas a interface.

---

## Fase 6 — Integrações Externas ⏳ FUTURO

| Integração | Finalidade | Via |
|---|---|---|
| Google Calendar OAuth | Importar agenda de treinos | Supabase Edge Function |
| TMDB API | Metadados filmes/séries | Fetch no frontend |
| Google Books API | Metadados livros | Fetch no frontend |
| Notificações push | Lembretes de treino e revisão | Service Worker Push API |
