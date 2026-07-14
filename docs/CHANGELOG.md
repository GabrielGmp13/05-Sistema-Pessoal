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

- Decisão: podcasts passam a integrar com a iTunes Search API (gratuita, sem key) — revertendo a premissa original de DEC-011 de que podcasts seriam sempre manuais, mesmo padrão da atualização já feita para mangás em 2026-07-11 (DEC-016)
- `004_podcasts_itunes.sql` criado e executado com sucesso no Supabase: colunas `itunes_id` e `capa_url` adicionadas à tabela `podcasts`. Confirmado no Table Editor.
- `DATABASE.md` atualizado: migration `004` marcada como executada, schema de `podcasts` documentado com as duas colunas novas
- Escopo de UX definido para a integração das 4 APIs (TMDB, Google Books, Jikan, iTunes) em `biblioteca.html`: busca dispara automaticamente com debounce enquanto o usuário digita o título; resultados aparecem em lista (capa + título) para escolha manual, nunca preenchimento automático do primeiro resultado
- Pendente: gerar o código de integração em `biblioteca.html`

2026-07-13 — Integração de metadados concluída, bug de modal corrigido

- Integração das 4 APIs implementada em `biblioteca.html`: Google Books (livros), TMDB (filmes/séries — requer `TMDB_API_KEY` própria, gratuita), Jikan/MyAnimeList (mangás), iTunes Search API (podcasts). Busca com debounce (500ms, mínimo 3 caracteres) no campo Título, resultados em lista com capa+título para escolha manual — testado e confirmado funcionando pelo usuário
- Bug encontrado durante o teste: botões de adicionar item (FAB e o do estado vazio) não abriam o modal — sem erro no Console. Causa raiz: `abrirModal()`/`fecharModal()` setavam `display` inline via JS, mas `.modal-overlay` em `style.css` usa `opacity`/`pointer-events` controlados pela classe `.open` (linhas 625-641), nunca adicionada pelo JS. Corrigido via Cline+DeepSeek: `abrirModal()` e `fecharModal()` agora também adicionam/removem a classe `.open`
- **Ação pendente**: auditar se `treino.html`, `treino-plano.html`, `treino-academia.html`, `treino-shape.html`, `revisao.html` e `estudos.html` têm o mesmo padrão de `abrirModal`/`fecharModal` e sofrem do mesmo bug — não testado ainda nessas páginas, ver `TASKS_NOW.md`
- Fase 4 (Biblioteca): **completa**. Todas as tarefas planejadas (schema, RLS, GRANT, CRUD, tags, upload de capa, testes end-to-end, integração de APIs) concluídas.


## 2026-07-13 — Auditoria de modais concluída em todas as páginas

- Auditoria (via Cline+DeepSeek) do padrão `abrirModal`/`fecharModal` × classe `.open` (bug encontrado em `biblioteca.html` no mesmo dia) nas 6 páginas restantes do projeto:
  - `treino.html` — OK, não possui modais
  - `treino-plano.html` — OK, usa padrão próprio (`.hidden` + `classList`), não sofre do bug
  - `treino-academia.html` — **corrigido**: `confirmar()`/`fecharModal()` só setavam `style.display`, sem tocar em `.open`
  - `treino-shape.html` — **corrigido**: mesmo padrão de bug de `treino-academia.html`
  - `revisao.html` — **corrigido**: `fecharModal()` e a abertura via `btn-novo-card` só setavam `style.display`, sem `.open`
  - `estudos.html` — **corrigido**: `abrirModal()`/`fecharModal()` com o mesmo bug; handlers de clique no backdrop e tecla Escape também fechavam sem remover `.open`
- Total: 4 páginas corrigidas (`treino-academia.html`, `treino-shape.html`, `revisao.html`, `estudos.html`), 2 já corretas (`treino.html`, `treino-plano.html`)
- Todas as correções testadas manualmente (abrir/fechar cada modal) antes de finalizar
- Auditoria de modais: **encerrada**. Nenhuma página do projeto tem mais o bug de classe `.open` faltando.

## 2026-07-13 — RLS de Estudos confirmada, Fase 3 encerrada

- Pendência residual da Fase 3 (nunca verificada desde a execução de `002_estudos.sql` em 2026-07-11) resolvida
- `pg_policies` confirmou policy `user_own_data` nas 5 tabelas (`materias`, `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`), todas com `cmd = ALL` e `qual = auth.uid() = user_id`
- `information_schema.role_table_grants` confirmou GRANT completo (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para `authenticated` nas 5 tabelas
- Observação não-bloqueante: `roles` das policies aparece como `{public}` em vez de `{authenticated}` — comportamento esperado do Supabase (a policy roda para qualquer role, mas o GRANT restrito a `authenticated` já impede acesso anônimo); mesmo padrão observado na Biblioteca
- Fase 3 (Estudos): **concluída**

## 2026-07-13 — Integração de podcasts/iTunes: verificada e finalizada

- Revisão do `biblioteca.html` real mostrou que a integração de podcasts com a iTunes Search API já estava implementada de forma genérica (config-driven) desde a integração das 4 APIs — `TASKS_NOW.md`/`CHANGELOG.md` estavam desatualizados ao registrar isso como pendente
- Lacuna real identificada: `artistName` (produtora/autor) retornado pela iTunes API era descartado, pois `podcasts.campoAutor = null` (tabela não tem coluna de autor)
- Corrigido em `selecionarResultadoBusca()`: tipos sem `campoAutor` (hoje só podcasts) agora salvam `artistName` automaticamente em `comentario` (prefixo "Produtora: "), apenas quando o campo está vazio, para não sobrescrever anotações existentes
- Testado pelo usuário: busca de podcast preenche `comentario` corretamente
- Fecha a pendência "a definir" registrada em DEC-016

## 2026-07-13 — Deploy no Vercel + incidente de deleção de usuário

- `frontend/` publicado no Vercel (`GabrielGmp13/05-Sistema-Pessoal`, projeto `sistemapessoal`), Root Directory `frontend`, sem build step
- Problema pós-deploy: sessão do Live Server não existia na URL do Vercel (domínio diferente); recuperação de senha por e-mail falhou inicialmente porque `Site URL`/`Redirect URLs` no Supabase ainda apontavam para `localhost:3000` — corrigido apontando para a URL do Vercel
- Durante a tentativa de resolver o login, o usuário original foi deletado manualmente em Authentication → Users antes de criar um novo. Por causa de `ON DELETE CASCADE` em `user_id` (convenção universal do projeto, ver DATABASE.md), isso apagou em cascata todos os dados de todas as tabelas vinculados àquele usuário. Sem backup disponível no free tier do Supabase — perda irreversível, porém sem dados relevantes no caso real (dados de teste)
- Gotcha documentado em `DATABASE.md` para evitar repetição
- Login confirmado funcionando na URL do Vercel com o novo usuário (mesmo e-mail)
- Pendente: testar acesso multi-dispositivo (celular) antes de fechar a Fase M

## 2026-07-13 — Fase M encerrada: testes e2e e multi-dispositivo confirmados

- `treino-plano.html`, `treino-academia.html` e `treino-shape.html` testados end-to-end contra o Supabase real na URL do Vercel — nenhum bug encontrado
- Upload de foto confirmado funcionando via bucket `shape`
- Acesso multi-dispositivo confirmado (celular + PC acessando os mesmos dados via URL pública)
- Fase M (Migração para Supabase + deploy): **concluída**, restando apenas as sub-fases planejadas separadamente — M2 (Service Worker/offline) e M3 (Realtime)