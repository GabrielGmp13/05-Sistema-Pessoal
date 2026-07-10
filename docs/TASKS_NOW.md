# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, não aqui.

---

## Status geral

**Fase atual:** Fase 3 — Módulo de Estudos (em andamento)
**Bloqueio:** nenhum bloqueio duro, mas há 2 bugs conhecidos pendentes (ver abaixo)
**Próxima ação:** rodar `002_estudos.sql` no Supabase SQL Editor, depois gerar `estudos.html`

---

## 🔴 Bugs conhecidos — prioridade alta

- [ ] **`revisao.html`** usa nomes de coluna incompatíveis com o schema real (`frente`/`verso`/`intervalo`/`fator` em vez de `pergunta`/`resposta`/`intervalo_dias`/`ef`) e uma assinatura de `calcularSM2()` diferente da implementada em `sm2.js`. Ver `DATABASE.md` → Gotchas para o mapeamento completo antes de corrigir.
- [ ] **`treino-plano.html`** — verificar se ainda referencia `treino_id` (deveria ser `treino_uuid`) e `grupo_muscular` (coluna que não existe). O resumo de correções do DeepSeek não menciona ter corrigido isso.

## Fase 3 — Módulo de Estudos

- [x] Desenhar schema (`materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`)
- [x] Criar `002_estudos.sql`
- [ ] Rodar `002_estudos.sql` no Supabase SQL Editor
- [ ] Gerar `estudos.html` (página única com filtro por tipo — ver DEC-013)

## Pendências da Fase M (migração)

- [ ] Deploy no Vercel — pronto para ser feito, ainda não realizado
- [ ] Teste final de `treino-plano.html` end-to-end com Supabase
- [ ] Teste final de `treino-academia.html` end-to-end com Supabase
- [ ] Validar upload de foto em `treino-shape.html` contra o bucket real

## Fase M2 — Service Worker + Storage (não iniciada)

- [ ] `frontend/sw.js` — cache first para assets estáticos, network first para dados
- [ ] Fila de escrita offline para `treino-academia.html`
- [ ] Atualizar `manifest.json` com registro do SW

## Fase M3 — Realtime (não iniciada)

- [ ] Subscrição `postgres_changes` em `treino-plano.html` (tabela `treinos`)

---

## Concluído recentemente (mover para CHANGELOG.md periodicamente)

- [x] Auditoria M1: correção de nomes de coluna em `treino-academia.html`, `softDelete` retornando `{error}`, migração de `index.html` e `treino-plano.html` para Supabase JS
- [x] `treino.html` (hub: calendário, agenda, radar chart) implementado
- [x] `treino-shape.html` (upload de fotos, gráfico de peso) implementado
- [x] `revisao.html` implementado (com os bugs listados acima)
- [x] Arquivos LAN removidos do projeto (`db.js`, `api.js`, `sync.js`, `backend/`, `iniciar.bat`)
- [x] Decisão: sistema ENEM standalone descontinuado, integrado ao Supabase (DEC-012)
- [x] Decisão: `estudos.html` única em vez de 3 páginas separadas (DEC-013)
