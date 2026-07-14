# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — planejamento da migração para Next.js/React (DEC-018)
**Bloqueio:** nenhum
**Próxima ação:** formalizar escopo da Fase 7.0 (setup do projeto Next.js) via MODULE_TEMPLATE.md antes de gerar qualquer código


## 🔴 Bugs conhecidos — prioridade alta

- [x] ~~`revisao.html`~~ — resolvido em 2026-07-11 (via Cline+DeepSeek). Colunas corrigidas em `mostrarCardAtual()`, `avaliarCard()`, `criarCard()` e `renderListaCards()`: `frente`→`pergunta`, `verso`→`resposta`, `intervalo`→`intervalo_dias`, `fator`→`ef`. Chamada de `calcularSM2()` corrigida para a assinatura real (`ef, repeticoes, intervaloDias, qualidade`).
- [x] ~~`treino-plano.html`~~ — verificado em 2026-07-11 (via Cline+DeepSeek). Nenhuma correção necessária: já usa `treino_uuid` corretamente (linha 544) e não referencia `grupo_muscular`.
- [x] ~~`estudos.html` não validado~~ — resolvido em 2026-07-11. Migration executada e página validada linha por linha contra o schema real; nenhuma incompatibilidade encontrada nas 5 tabelas. Observações menores (não bloqueantes): filtro de tipo na UI não cobre `tipo = 'outro'`; `mudarAba()` usa `event` global implícito em vez de parâmetro explícito.
- [x] ~~Auditoria de modais~~ — resolvida em 2026-07-13 (via Cline+DeepSeek). 4 páginas corrigidas (`treino-academia.html`, `treino-shape.html`, `revisao.html`, `estudos.html`), 2 já corretas (`treino.html`, `treino-plano.html`). Ver `CHANGELOG.md`.
- [x] ~~Links quebrados do dashboard (Enem/Olimpíada/Escola)~~ — resolvido em 2026-07-13 (via Cline+DeepSeek). Causa: hrefs apontavam para arquivos inexistentes, resíduo pré-DEC-013. Corrigido com `?tipo=` em `estudos.html` — ver DEC-017.
- [x] ~~Classes `.btn-icon`/`.btn-salvar` faltando no modal da Biblioteca~~ — resolvido em 2026-07-13 (via Cline+DeepSeek). Classes nunca haviam sido definidas em `style.css`. Ver `CHANGELOG.md`.
 

## Fase 3 — Módulo de Estudos

- [x] Desenhar schema (`materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`)
- [x] Criar `002_estudos.sql`
- [x] Rodar `002_estudos.sql` no Supabase SQL Editor (2026-07-11 — sucesso, 5 tabelas confirmadas no Table Editor)
- [x] Validar `estudos.html` contra o schema real (2026-07-11 — validado linha por linha, nenhuma incompatibilidade encontrada nas 5 tabelas)
- [x] Confirmar RLS + policy `user_own_data` ativa nas 5 tabelas novas (2026-07-13 — confirmado via `pg_policies` e `information_schema.role_table_grants`: 5/5 tabelas com policy `user_own_data` e GRANT completo para `authenticated`)

**Fase 3: concluída.**

## Fase 4 — Biblioteca

- [x] Definir escopo (estrutura de tabelas, avaliação, tags, API de mangás)
- [x] Criar `003_biblioteca.sql`
- [x] Rodar `003_biblioteca.sql` no Supabase SQL Editor (2026-07-11 — sucesso, 11 tabelas confirmadas no Table Editor)
- [x] Confirmar RLS + policy `user_own_data` ativa nas 11 tabelas novas (2026-07-11 — confirmado via pg_policies)
- [x] Gerar `biblioteca.html` (2026-07-12) — CRUD dos 5 tipos, tags, upload manual de capa
- [x] Testar `biblioteca.html` end-to-end contra o Supabase real (2026-07-13 — login, CRUD dos 5 tipos, edição, soft delete, tags compartilhadas e upload de capa confirmados; ver CHANGELOG.md)
- [x] Integrar TMDB, Google Books, Jikan e iTunes/podcasts (DEC-016) — fetch direto no frontend, testado e funcionando (2026-07-13)
- [x] Podcasts: schema atualizado (DEC-016, 004_podcasts_itunes.sql executado) e integração no frontend confirmada (2026-07-13) — artistName agora salvo em comentario

**Fase 4: concluída.**

## Pendências da Fase M (migração)

- [x] Deploy no Vercel — feito em 2026-07-13 (projeto `sistemapessoal`, Root Directory `frontend`)
- [x] Auditoria de segurança pós-deploy: RLS + GRANT confirmados nas 24 tabelas, cadastro público desabilitado, sem `service_role` exposta (2026-07-13)
- [x] Testar acesso multi-dispositivo (celular) na URL do Vercel — confirmado (2026-07-13)
- [x] Teste final de `treino-plano.html` end-to-end com Supabase — sem bugs encontrados (2026-07-13)
- [x] Teste final de `treino-academia.html` end-to-end com Supabase — sem bugs encontrados (2026-07-13)
- [x] Validar upload de foto em `treino-shape.html` contra o bucket real — confirmado (2026-07-13)

**Fase M: concluída** (exceto Service Worker/offline = Fase M2, e Realtime = Fase M3, ambas planejadas separadamente).

## Fase M2 — Service Worker + Storage (não iniciada)

**Descartada.** Uso real sempre terá wifi disponível, inclusive na academia. Ver ROADMAP.md.

## Fase M3 — Realtime (não iniciada)

**Descartada.** Sync entre dispositivos já ocorre via banco central; diferença de Realtime (atualização sem reload) não é relevante no uso real sequencial. Ver ROADMAP.md.

## Concluído recentemente (mover para CHANGELOG.md periodicamente)

- [x] Auditoria M1: correção de nomes de coluna em `treino-academia.html`, `softDelete` retornando `{error}`, migração de `index.html` e `treino-plano.html` para Supabase JS
- [x] `treino.html` (hub: calendário, agenda, radar chart) implementado
- [x] `treino-shape.html` (upload de fotos, gráfico de peso) implementado
- [x] `revisao.html` implementado (com os bugs listados acima)
- [x] Arquivos LAN removidos do projeto (`db.js`, `api.js`, `sync.js`, `backend/`, `iniciar.bat`)
- [x] Decisão: sistema ENEM standalone descontinuado, integrado ao Supabase (DEC-012)
- [x] Decisão: `estudos.html` única em vez de 3 páginas separadas (DEC-013)

## Fase 7.0 — Setup Next.js (não iniciada)

- [ ] Definir estrutura de pastas do projeto Next.js (App Router) dentro de `frontend/`
- [ ] Migrar `style.css` para CSS global do projeto (sem mudar paleta/tipografia — ver DESIGN.md)
- [ ] Reescrever `supabase.js` → `lib/supabase.ts`
- [ ] Reescrever `auth.js` → `lib/auth.ts` (adaptado para Next.js)
- [ ] Configurar variáveis de ambiente server-only no Vercel (segredo nunca com prefixo `NEXT_PUBLIC_`)
- [ ] Layout base + navbar como componente compartilhado
- [ ] Escolher a primeira página a migrar como prova de conceito — decisão pendente, não presa a nenhum módulo específico ainda

**Próxima ação:** concluir Fase 7.0. Escopo de features de cada módulo (Treino, Biblioteca, Estudos, Agenda, etc.) só entra em pauta depois, módulo a módulo, via `MODULE_TEMPLATE.md`.
