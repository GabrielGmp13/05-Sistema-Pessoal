# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, não aqui.

---

## Status geral

**Fase atual:** Fase 3 — Módulo de Estudos (em andamento)
**Bloqueio:** nenhum — os 3 bugs/riscos conhecidos anteriores foram resolvidos ou descartados
**Próxima ação:** deploy no Vercel (Fase M) ou avançar Fase 3 (confirmar RLS nas 5 tabelas de Estudos)
---

## 🔴 Bugs conhecidos — prioridade alta

## 🔴 Bugs conhecidos — prioridade alta

- [x] ~~`revisao.html`~~ — resolvido em 2026-07-11 (via Cline+DeepSeek). Colunas corrigidas em `mostrarCardAtual()`, `avaliarCard()`, `criarCard()` e `renderListaCards()`: `frente`→`pergunta`, `verso`→`resposta`, `intervalo`→`intervalo_dias`, `fator`→`ef`. Chamada de `calcularSM2()` corrigida para a assinatura real (`ef, repeticoes, intervaloDias, qualidade`).
- [x] ~~`treino-plano.html`~~ — verificado em 2026-07-11 (via Cline+DeepSeek). Nenhuma correção necessária: já usa `treino_uuid` corretamente (linha 544) e não referencia `grupo_muscular`.
- [x] ~~`estudos.html` não validado~~ — resolvido em 2026-07-11. Migration executada e página validada linha por linha contra o schema real; nenhuma incompatibilidade encontrada nas 5 tabelas. Observações menores (não bloqueantes): filtro de tipo na UI não cobre `tipo = 'outro'`; `mudarAba()` usa `event` global implícito em vez de parâmetro explícito.
## Fase 3 — Módulo de Estudos

- [x] Desenhar schema (`materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`)
- [x] Criar `002_estudos.sql`
- [x] Rodar `002_estudos.sql` no Supabase SQL Editor (2026-07-11 — sucesso, 5 tabelas confirmadas no Table Editor)
- [x] Validar `estudos.html` contra o schema real (2026-07-11 — validado linha por linha, nenhuma incompatibilidade encontrada nas 5 tabelas)
- [ ] Confirmar RLS + policy `user_own_data` ativa nas 5 tabelas novas

## Fase 4 — Biblioteca

- [x] Definir escopo (estrutura de tabelas, avaliação, tags, API de mangás)
- [x] Criar `003_biblioteca.sql`
- [ ] Rodar `003_biblioteca.sql` no Supabase SQL Editor
- [ ] Confirmar RLS + policy `user_own_data` nas 11 tabelas novas
- [ ] Gerar `biblioteca.html`
- [ ] Integrar TMDB, Google Books, Jikan (fetch direto no frontend)


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
