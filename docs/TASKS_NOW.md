# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — Biblioteca v2 (B1–B6): frontend gerado por completo, teste end-to-end geral pendente
**Bloqueio:** nenhum
**Próxima ação:** teste end-to-end de toda a Biblioteca v2 (filmes, séries, animes, mangás, livros, podcasts) contra o Supabase real — planejado para acontecer em outra sessão, a pedido do usuário


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

## Fase 7.0 — Setup Next.js ✅ CONCLUÍDA

- [x] Estrutura de pastas definida: `frontend-v2/` (nova, separada de `frontend/`)
- [x] Router: App Router
- [x] Estilização: CSS Modules (Tailwind adiado para v3 — ver BACKLOG.md)
- [x] Deploy: segundo projeto Vercel, URL própria, paralelo à produção
- [x] Migrar tokens de `style.css` para `app/globals.css` (paleta, tipografia — migração por componente para CSS Modules acontece módulo a módulo, não de uma vez)
- [x] Reescrever `supabase.js` → `lib/supabase.ts` (2026-07-15 — com correção de `createBrowserClient`, ver DEC-021)
- [x] Reescrever `auth.js` → `middleware.ts` (2026-07-15 — decisão de usar middleware em vez de `lib/auth.ts`, ver DEC-021)
- [x] `.env.local` configurado localmente (URL + anon key) — variáveis do projeto Vercel novo ficam pendentes até o deploy real da v2 (fora de escopo por ora)
- [x] Login testado end-to-end com usuário real (2026-07-15)

**Fase 7.0: concluída.**

## Fase 7.1 — Módulo Treino (v2): planejamento

- [x] Decisão: módulos fixos, sem CRUD de módulo (DEC-022, 2026-07-16)
- [x] `lib/modulos-treino.ts` — seed automático dos 7 módulos + busca ordenada
- [x] `lib/treino.ts` — CRUD de treinos e exercícios (força/cardio)
- [x] `lib/execucoes.ts` — sessão, execuções força (lote) e cardio, detecção de PR
- [x] `app/treino/page.tsx` — hub, lista os 7 módulos fixos
- [x] `app/treino/[moduloUuid]/page.tsx` — CRUD de treinos dentro do módulo
- [x] `app/treino/[moduloUuid]/[treinoUuid]/page.tsx` — CRUD de exercícios (força/cardio)
- [x] `app/treino/[moduloUuid]/[treinoUuid]/academia/page.tsx` — modo execução, séries, detecção de PR
- [x] `app/treino/shape/page.tsx` — fotos + peso via bucket `shape`
 [x] **Teste end-to-end contra o Supabase real** (2026-07-16) — seed dos 7 módulos confirmado (sem duplicar em reload), CRUD de treino e exercícios confirmado, modo academia com detecção de PR confirmado (positivo e negativo), sessões fechando corretamente, shape (foto+peso) confirmado. 3 bugs encontrados e corrigidos nesta rodada (ver CHANGELOG)
- [ ] Gráfico de evolução de peso em `shape` — ficou fora desta leva (Chart.js/react-chartjs-2 não decidido ainda para v2, ver observação no CHANGELOG)
- [ ] Upload de imagem de exercício (`imagem_path`, bucket `exercicios`) — CRUD ficou só textual nesta leva
- [ ] Reordenação de exercícios (`ordem`) — sem UI ainda, só ordem de criação

**Fase 7.1: concluída.** Treino v2 funcional e testado. Pendências remanescentes (gráfico, upload de imagem, reordenação) viraram itens de polimento — ver BACKLOG.md.

## Fase 7.2 — Módulo Biblioteca (v2): planejamento

Escopo dividido em sub-fases (B1–B6), cada uma com migration própria confirmada
antes de avançar — ver DEC-023 para B1.
 [x] B1 — Base compartilhada: gêneros + campos comuns + remoção de tags (schema)
  - [x] `006_biblioteca_v2_base.sql` executada e confirmada (2026-07-16)
  - [x] `007_remover_tags.sql` executada e confirmada (2026-07-16)
  - [x] Frontend B1 gerado: `lib/generos.ts`, `SeletorGenero.tsx`, `app/biblioteca/generos/page.tsx`
  - [ ] Teste end-to-end (adiado junto com o teste geral da Biblioteca v2)
- [x] B2 — Filmes + Séries: produção, elenco, trilha sonora, temporadas
  - [x] `008_biblioteca_v2_b2.sql` executada e confirmada (2026-07-17, DEC-024)
  - [x] `010_remover_tecnologias_filmes.sql` executada e confirmada (2026-07-17, DEC-026)
  - [x] Frontend gerado: `lib/filmes.ts`, `lib/series.ts`, `lib/series-temporadas.ts`,
    `lib/elenco.ts`, `lib/trilha-sonora.ts`, `PainelDetalheObra`, `ElencoEditor`,
    `TrilhaSonoraEditor`, `TemporadasEditor`, `app/biblioteca/filmes/page.tsx`,
    `app/biblioteca/series/page.tsx`
  - [ ] Teste end-to-end (adiado)
- [x] B3 — Animes: tabela nova, staff, dublador BR, temporadas+episódios+filler, openings/endings, complementos (via filmes.anime_uuid), ordem de consumo
  - [x] `009_biblioteca_v2_b3.sql` executada e confirmada (2026-07-17, DEC-025)
  - [x] Frontend gerado: `lib/animes.ts`, `lib/animes-temporadas.ts`,
    `lib/animes-episodios.ts`, `lib/openings-endings.ts`,
    `lib/animes-ordem-consumo.ts`, `TemporadasAnimeEditor` (salvo localmente
    como `TemporadasAnimesEditor.tsx`, ver CHANGELOG), `EpisodiosEditor`,
    `OpeningsEndingsEditor`, `ComplementosEditor`, `OrdemConsumoEditor`,
    `app/biblioteca/animes/page.tsx`
  - [ ] `animes_generos` (schema já existe) sem lib nem UI — pendência aberta, ver BACKLOG.md
  - [ ] Teste end-to-end (adiado)
- [x] B4 — Mangás: nome original/traduzido, publicação, volumes por arco com cor
  - [x] Schema desenhado nesta sessão (DEC-028) e `011_biblioteca_v2_b4_mangas.sql` executada (2026-07-18)
  - [x] Frontend gerado: `lib/mangas.ts`, `lib/mangas-volumes.ts`,
    `VolumesEditor`, `app/biblioteca/mangas/page.tsx`
  - [ ] Teste end-to-end (adiado)
- [x] B5 — Livros: dados bibliográficos, leitura (formato), anotações, citações favoritas
  - [x] Schema desenhado nesta sessão (DEC-029) e `012_biblioteca_v2_b5_livros.sql` executada (2026-07-18)
  - [x] Frontend gerado: `lib/livros.ts`, `lib/livros-anotacoes.ts`,
    `AnotacoesLivroEditor`, `app/biblioteca/livros/page.tsx`
  - [ ] Velocidade de leitura (páginas/hora) não entrou nesta migration — ver DEC-029
  - [ ] Teste end-to-end (adiado)
- [x] B6 — Podcasts: reorganização de UI (campo `produtora` próprio, sai do `comentario`)
  - [x] Schema desenhado nesta sessão (DEC-030) e `013_biblioteca_v2_b6_podcasts.sql` executada (2026-07-18)
  - [x] Frontend gerado: `lib/podcasts.ts`, `app/biblioteca/podcasts/page.tsx`
  - [ ] Teste end-to-end (adiado)

**Fase 7.2: frontend completo (B1–B6). Teste end-to-end geral fica para outra sessão — ver "Próxima ação" acima.**

**Pendências transversais de polimento (todas registradas em `BACKLOG.md`):**
integração de gênero (B1) nas 6 telas novas; upload de capa/banner (schema
pronto, sem bucket/UI); busca por API externa nas telas v2; edição de itens já
criados em listas aninhadas; reordenação manual (`ordem`); `animes_generos`
sem lib/UI; `confirm()` nativo; menu "⋯" não fecha ao clicar fora.