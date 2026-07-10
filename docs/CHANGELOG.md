# CHANGELOG.md

Histórico de mudanças por marco.

> Todas as entradas abaixo foram reconstruídas retroativamente e consolidadas em **2026-07-09** — essa é a data em que o registro foi criado, não a data em que cada evento realmente ocorreu (que não foi registrada na hora). A partir desta data, toda entrada nova deve levar a data real do dia em que foi adicionada.

---

## 2026-07-09 — Módulo de Estudos: schema criado

- `002_estudos.sql` criado com 5 tabelas: `materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`
- Decisão: sistema ENEM standalone antigo descontinuado, integrado ao Supabase (DEC-012)
- Decisão: página única `estudos.html` em vez de 3 arquivos separados (DEC-013)
- Execução da migration no Supabase ainda pendente

## 2026-07-09 — Módulo de Treino completo (Fase 2)

- `treino.html` implementado — hub com calendário mensal, agenda manual, radar chart de métricas
- `treino-shape.html` implementado — upload de fotos via Storage, gráfico de evolução de peso
- `revisao.html` implementado (Fase 5) — **com bug de schema conhecido**, ver DATABASE.md → Gotchas

## 2026-07-09 — Auditoria M1

- `supabase.js`: `softDelete` corrigido para retornar `{ error }` em vez de `boolean`
- `treino-academia.html`: 6 nomes de coluna corrigidos, navbar padronizada, `grupo_muscular` removido
- `index.html`: migrado para Supabase JS + `auth.js`
- `treino-plano.html`: migrado para Supabase JS + `auth.js`, classes CSS corrigidas
- `style.css`: adicionadas `.container` e `.form-control`
- Arquivos da arquitetura LAN removidos do projeto: `db.js`, `api.js`, `sync.js`, `backend/`, `iniciar.bat`

## 2026-07-09 — Fase M1: Auth + Core JS

- `login.html`, `supabase.js`, `auth.js`, `sm2.js` implementados
- `index.html` (dashboard) implementado e testado
- `treino-plano.html`, `treino-academia.html` gerados (correções na auditoria seguinte)

## 2026-07-09 — Fase M0: Infraestrutura Supabase

- Projeto Supabase criado
- `001_schema_inicial.sql` executado e verificado: 8 tabelas com RLS
- 3 buckets de Storage privados criados (`shape`, `documentos`, `capas`)
- Repositório GitHub criado como privado

## 2026-07-09 — Decisão de migração LAN → Supabase

- DEC-001 a DEC-011 registradas — ver DECISIONS.md
- Arquitetura sai de Flask + SQLite + LAN para Supabase (PostgreSQL + Auth + Storage + Realtime) + Vercel

## 2026-07-09 — Fase 1: Fundação (arquitetura LAN)

- 20 tabelas no schema original (SQLite)
- CRUD genérico via Flask
- Algoritmo SM-2 em Python
- Biblioteca CSS completa (~1100 linhas, 100% reaproveitada na migração)
- PWA manifest + ícones + fontes self-hosted
- Dashboard básico