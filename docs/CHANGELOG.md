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
## 2026-07-10 — `estudos.html` gerado (não testado)

- `estudos.html` implementado: página única com filtro por tipo (Todas/ENEM/Escola/Olimpíadas/Concurso), CRUD de `materias` e `assuntos` (com slider de progresso), `anotacoes` (gerais ou por assunto), upload de `documentos_estudo` via bucket `documentos` (signed URL, PDF até 50MB) e registro de `sessoes_questoes` com % de acerto
- **Gerado antes da confirmação de execução de `002_estudos.sql` no Supabase** — a pedido explícito do usuário, apesar do risco sinalizado. Página não testada contra o schema real. Ver `TASKS_NOW.md` para a pendência de validação.

## 2026-07-11 — Módulo de Estudos: schema executado no Supabase

- `002_estudos.sql` executado com sucesso no SQL Editor do Supabase ("Success. No rows returned")
- 5 tabelas confirmadas no Table Editor: `materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`
- Tentativa acidental de re-executar `001_schema_inicial.sql` — travou em `CREATE POLICY "user_own_data" ON treinos` (policy já existia). Sem impacto: execução interrompida no primeiro erro, nenhuma tabela alterada. Nenhuma ação corretiva necessária.
- Pendência: validar `estudos.html` (gerado antes da confirmação do SQL) contra o schema agora confirmado no banco

## 2026-07-11 — `estudos.html` validado contra o schema real

- Validação linha por linha de `estudos.html` (1335 linhas) contra o schema confirmado no Supabase
- Nenhuma incompatibilidade de coluna/tabela encontrada nas 5 tabelas (`materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`) — diferente do padrão de bug visto em `revisao.html`
- Conformidade confirmada: `esc()` em toda interpolação de innerHTML, nenhum `confirm()` nativo, `softDelete()` usado corretamente, FKs com sufixo `_uuid`
- Observações não bloqueantes registradas: filtro de tipo na UI não cobre `materias.tipo = 'outro'`; `mudarAba()` usa `event` global implícito

## 2026-07-11 — `revisao.html` corrigido, `treino-plano.html` verificado

- `revisao.html`: nomes de coluna corrigidos via Cline+DeepSeek — `frente`→`pergunta`, `verso`→`resposta`, `intervalo`→`intervalo_dias`, `fator`→`ef` em `mostrarCardAtual()`, `avaliarCard()`, `criarCard()` e `renderListaCards()`. Chamada de `calcularSM2()` corrigida para a assinatura real de `sm2.js`. Bug ativo desde a Fase 5 — encerrado.
- `treino-plano.html`: verificado via Cline+DeepSeek — já usava `treino_uuid` corretamente e não continha `grupo_muscular`. Nenhuma alteração necessária.

## 2026-07-11 — Módulo Biblioteca: escopo definido e schema criado

- Planejamento formal da Fase 4 iniciado, seguindo `MODULE_TEMPLATE.md`
- Decisões de escopo tomadas em sequência:
  - Estrutura de tabelas: separadas por tipo de mídia (`livros`, `filmes`, `series`, `mangas`, `podcasts`), não tabela única — registrado em DEC-014, contrastando deliberadamente com DEC-013 (Estudos)
  - Avaliação: nota 1-10 + comentário livre
  - Tags: tabela `tags` compartilhada + junção many-to-many por tipo (`livros_tags`, `filmes_tags`, `series_tags`, `mangas_tags`, `podcasts_tags`)
  - Filmes e séries separados em tabelas distintas (não combinados)
  - IDs externos adicionados para refresh futuro de metadados: `tmdb_id` (filmes/séries), `google_books_id` (livros), `mal_id` (mangás)
  - Mangás passam a ter API definida — MyAnimeList/Jikan (gratuita, sem key) — revertendo a premissa original de DEC-011 de que mangás seriam sempre manuais; atualização registrada como nota em DEC-011
- `003_biblioteca.sql` criado: 11 tabelas, todas com RLS + policy `user_own_data`, seguindo a convenção universal (`uuid`, `user_id`, `updated_at`, `deleted`)
- Execução da migration no Supabase ainda pendente — `biblioteca.html` só será gerado após confirmação, seguindo a disciplina de `MODULE_TEMPLATE.md` (mesmo cuidado que faltou originalmente em `estudos.html`)

## 2026-07-11 — Módulo Biblioteca: schema executado no Supabase

- `003_biblioteca.sql` executado com sucesso no SQL Editor do Supabase ("Success. No rows returned")
- 11 tabelas confirmadas no Table Editor: `livros`, `livros_tags`, `filmes`, `filmes_tags`, `series`, `series_tags`, `mangas`, `mangas_tags`, `podcasts`, `podcasts_tags`, `tags`
- Pendência: confirmar RLS + policy `user_own_data` ativa nas 11 tabelas antes de gerar `biblioteca.html`

 ## 2026-07-12 — `biblioteca.html` gerado e `DATABASE.md` atualizado
 - `biblioteca.html` implementado: página única com filtro por tipo, CRUD dos 5 tipos via config compartilhada, tags (`tags` + 5 junções `*_tags`), upload manual de capa (bucket `capas`), soft delete
 - Confirmado via `pg_policies` que as 11 tabelas têm RLS + `user_own_data` ativas antes da geração da página
 - `DATABASE.md`: adicionada seção `Schema — 003_biblioteca.sql`; removidos marcadores de diff colados por engano, que duplicavam a seção `## Storage`
 - Pendente: teste end-to-end de `biblioteca.html`; integração TMDB/Google Books/Jikan

 ## 2026-07-13 — `biblioteca.html` testado end-to-end

- Teste manual completo contra o Supabase real: login, CRUD dos 5 tipos (livros, filmes, séries, mangás, podcasts), edição persistente, soft delete (confirmado `deleted = true` via Table Editor), tags compartilhadas entre tipos (tabela `tags` + junções `*_tags`), upload manual de capa no bucket `capas`
- Bug encontrado e corrigido: `<link rel="stylesheet" href="style.css">` apontava para caminho errado — corrigido para `assets/style.css` (ver DATABASE.md → Gotchas)
- Confirmado: rejeição correta de upload > 2MB pelo bucket `capas` (limite do DEC-010); UI não oferece busca de capa via API para podcasts (não têm `capa_url` no schema)
- Aviso não-bloqueante: "Tracking Prevention blocked access to storage" no Edge — comportamento do navegador para script de CDN de terceiros, sem impacto funcional
- Melhoria registrada em BACKLOG.md: validar tamanho do arquivo no frontend antes do upload, evitando round-trip desnecessário ao Storage
- Fase 4 (Biblioteca): testes completos. Próxima etapa: integração TMDB/Google Books/Jikan

## 2026-07-13 — Podcasts ganham API de metadados (DEC-016) e schema atualizado
+
+- Decisão: podcasts passam a integrar com a iTunes Search API (gratuita, sem key) — revertendo a premissa original de DEC-011 de que podcasts seriam sempre manuais, mesmo padrão da atualização já feita para mangás em 2026-07-11 (DEC-016)
+- `004_podcasts_itunes.sql` criado e executado com sucesso no Supabase: colunas `itunes_id` e `capa_url` adicionadas à tabela `podcasts`. Confirmado no Table Editor.
+- `DATABASE.md` atualizado: migration `004` marcada como executada, schema de `podcasts` documentado com as duas colunas novas
+- Escopo de UX definido para a integração das 4 APIs (TMDB, Google Books, Jikan, iTunes) em `biblioteca.html`: busca dispara automaticamente com debounce enquanto o usuário digita o título; resultados aparecem em lista (capa + título) para escolha manual, nunca preenchimento automático do primeiro resultado
+- Pendente: gerar o código de integração em `biblioteca.html`