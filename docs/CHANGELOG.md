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

## 2026-07-13 — Integração de metadados concluída, bug de modal corrigido

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

## 2026-07-13 — Links do dashboard corrigidos + classes CSS faltantes no modal

- Bug encontrado: links "Enem", "Olimpíadas" e "Escola" no dashboard
  (`index.html`) apontavam para `enem.html`, `olimpiadas.html` e `escola.html`
  — arquivos que nunca existiram, resíduo do plano pré-DEC-013 (3 páginas
  separadas), nunca atualizado quando a decisão de página única foi tomada
- Corrigido via Cline+DeepSeek: `index.html` agora linka
  `estudos.html?tipo=enem`, `estudos.html?tipo=olimpiada` e
  `estudos.html?tipo=escola`; `estudos.html` (`init()`) passou a ler o
  parâmetro `?tipo=` da URL e pré-selecionar a pill de filtro correspondente
  — comportamento novo registrado em DEC-017
- Bug encontrado: classes `.btn-icon` e `.btn-salvar`, usadas no modal de
  `biblioteca.html` e `estudos.html`, nunca haviam sido definidas em nenhum
  CSS do projeto (nem `style.css`, nem os `<style>` internos das páginas) —
  botão de fechar e botão de salvar apareciam sem estilo em todos os 5 tipos
  da Biblioteca
- Corrigido: `.btn-icon` e `.btn-salvar` adicionadas em
  `frontend/assets/style.css` (linhas 395-420), seguindo os padrões já
  descritos em `DESIGN.md` → Componentes → Botões
- Testado pelo usuário: navegação Enem/Olimpíadas/Escola a partir do
  dashboard confirmada funcionando; modal da Biblioteca com botões
  corretamente estilizados

## 2026-07-14 — v2: decisão de migrar para Next.js/React (DEC-018)

- v1 declarada congelada — todas as fases planejadas (1 a 6 + Fase M) concluídas
- Discussão de arquitetura para v2: identificado que chave TMDB exposta no frontend (`biblioteca.html`) é uma vulnerabilidade real, não só uma questão de gosto
- Duas opções avaliadas para resolver segredo (Edge Functions do Supabase vs. API Routes do Next.js); decisão expandida para migração completa do frontend, já que as novidades planejadas para v2 (dados aninhados na Biblioteca, módulos por categoria no Treino, etc.) pedem componentização que HTML puro não sustenta bem
- DEC-018 registrada: frontend migra para Next.js/React + TypeScript, com API Routes como camada de segredo/servidor. Reabre e supera DEC-006
- `PROJECT_PRINCIPLES.md`, `ARCHITECTURE.md`, `NAMING_CONVENTIONS.md`, `MODULE_TEMPLATE.md`, `ROADMAP.md`, `VISION.md`, `AI_CONTEXT.md`, `TASKS_NOW.md` atualizados para refletir a decisão
- Escopo de features de v2 ainda não fechado e não registrado em nenhum documento — só a decisão de arquitetura (DEC-018) está formalizada
- Nenhuma linha de código gerada ainda — próximo passo é formalizar Fase 7.0 via `MODULE_TEMPLATE.md`

## 2026-07-14 — Fase 7.0: estrutura da v2 definida (DEC-019)

- Decisões de setup fechadas: `frontend-v2/` como pasta nova (v1 mantida intacta em `frontend/` até fim da migração), App Router, CSS Modules (Tailwind adiado para v3)
- Deploy: segundo projeto Vercel, independente do de produção, com URL própria
- `DECISIONS.md`, `ARCHITECTURE.md`, `TASKS_NOW.md`, `BACKLOG.md` atualizados
- Fase 7.0 (planejamento): concluída. Execução técnica (criar o projeto Next.js de fato) ainda não iniciada — próximo passo é iniciar o planejamento do módulo Treino

## 2026-07-15 — Treino v2: schema reestruturado (Fase 7.1, DEC-020)

- Planejamento via MODULE_TEMPLATE.md: hierarquia `modulos_treino` → `treinos` → `exercicios_forca`/`exercicios_cardio`, separando por natureza de dado em vez de tabela genérica
- `005_treino_v2.sql` criada e executada com sucesso no Supabase: `modulos_treino` (nova), `treinos.modulo_uuid` (nova coluna), `exercicios_forca`, `exercicios_cardio`, `execucoes_forca`, `execucoes_cardio` (novas); `cardio`, `exercicios`, `series_executadas` descontinuadas
- Bucket `exercicios` criado (privado, 5MB, aceita JPEG/PNG/WebP/GIF)
- Verificado via `pg_tables`, `pg_policies` e `information_schema.role_table_grants`: RLS ativa e policy `user_own_data` nas 5 tabelas novas, GRANT completo para `authenticated`; tabelas antigas confirmadas removidas
- Seed de 7 módulos padrão (Cardio, Força, Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência) definido como responsabilidade do frontend, não da migration (evita repetir o incidente de perda de dados por `user_id` fixo em SQL — ver Gotchas em DATABASE.md)
- Fase 7.1 (planejamento e schema): **concluída**. Páginas ainda não geradas.

## 2026-07-15 — Fase 7.0 técnica concluída: projeto Next.js, auth e CSS global funcionando

- Projeto `frontend-v2/` criado via `create-next-app` (TypeScript, App Router, sem Tailwind — CSS Modules conforme DEC-019, sem `src/`, sem React Compiler, sem AGENTS.md)
- `@supabase/supabase-js` e `@supabase/ssr` instalados
- `.env.local` configurado com `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (confirmado fora do Git via `.env*` já presente no `.gitignore` padrão do Next.js — nenhuma mudança necessária)
- Decisão: proteção de rota via `middleware.ts` (fail-safe, protege tudo por padrão) em vez de hook por página — DEC-021
- `lib/supabase.ts` implementado (equivalente TypeScript de `supabase.js`) — bug real encontrado e corrigido: client precisa ser `createBrowserClient` (`@supabase/ssr`), não `createClient` (`@supabase/supabase-js`), senão a sessão fica invisível para o middleware (login "funciona" mas nunca autentica do ponto de vista do servidor). Ver DEC-021 e `ARCHITECTURE.md`
- `middleware.ts` implementado e testado — bloqueia rota sem sessão, redireciona para `/login`
- `app/login/page.tsx` implementado e testado com usuário real (mesma conta da v1) — login confirmado funcionando após a correção do client
- `app/globals.css` implementado com os tokens de `DESIGN.md` (paleta, tipografia). Bug encontrado e corrigido: `@font-face` assumia um arquivo único por família (`Syne.woff2`), mas os arquivos reais em `public/fonts/` são por peso (`syne-latin-400-normal.woff2` etc.) — corrigido para declarar um `@font-face` por peso
- `app/layout.tsx` implementado — importa `globals.css`, metadata base
- `app/page.tsx` — placeholder mínimo confirmando visualmente que login + middleware + CSS estão integrados (não é o dashboard final da v2; dashboard real fica para quando o módulo Dashboard for formalizado)
- Fase 7.0 (setup técnico do Next.js): **concluída**

## 2026-07-15 — Módulo Treino v2: planejamento fechado (Fase 7.1, DEC-020)

- Planejamento via `MODULE_TEMPLATE.md`: hierarquia `modulos_treino` (CRUD livre) → `treinos` → `exercicios_forca`/`exercicios_cardio` (tabelas separadas por natureza de dado)
- Decisões de escopo fechadas em conversa: módulos livres com seed inicial de 7 (Cardio, Força, Resistência, Hipertrofia, Flexibilidade, Mobilidade, Potência) implementado no frontend, não na migration; imagem de exercício via upload manual com suporte a GIF (bucket novo `exercicios`, 5MB); execução força mantém granularidade série a série com PR (mesma lógica da v1, mas salvamento em lote por exercício); execução cardio é registro simples (concluído + tempo/km real opcional)
- Tabela `cardio` (existia desde `001_schema_inicial.sql`, nunca teve tela) descontinuada — absorvida pelo novo sistema de módulos
- Páginas do Treino v2 ainda não geradas — dependiam da Fase 7.0 técnica (ver entrada acima), agora desbloqueadas
```

## 2026-07-16 — DEC-022: módulos de treino fixos (reabre parte da DEC-020)

- Decisão: os 7 módulos de treino (Cardio, Força, Resistência, Hipertrofia,
  Flexibilidade, Mobilidade, Potência) passam a ser **fixos**, sem CRUD de
  módulo pela interface — reverte a premissa de "CRUD livre" da DEC-020.
  Módulo novo, se necessário no futuro, é ajuste manual feito pelo próprio
  desenvolvedor, fora do produto. Ver DEC-022.
- Decisão de implementação: um treino pode ter exercícios de força e cardio
  ao mesmo tempo — tipo é escolhido por exercício, não por módulo.

## 2026-07-16 — Treino v2: páginas Next.js geradas (Fase 7.1)

- `lib/modulos-treino.ts`: seed automático dos 7 módulos fixos (roda se a
  tabela estiver vazia para o usuário) + busca ordenada pela ordem canônica
- `lib/treino.ts`: CRUD de `treinos`, `exercicios_forca`, `exercicios_cardio`
  (soft delete em todos)
- `lib/execucoes.ts`: criação/finalização de `sessoes_treino`, salvamento em
  lote de `execucoes_forca`, registro simples de `execucoes_cardio`, cálculo
  de recorde de carga para detecção de PR (mesma lógica da v1)
- Páginas geradas: `app/treino/page.tsx` (hub), `app/treino/[moduloUuid]/page.tsx`
  (treinos do módulo), `app/treino/[moduloUuid]/[treinoUuid]/page.tsx`
  (exercícios), `.../academia/page.tsx` (modo execução com detecção de PR),
  `app/treino/shape/page.tsx` (fotos + peso via bucket `shape`)
- Dois bugs de TypeScript corrigidos durante a integração: mismatch de nome
  de arquivo (`modulos-treino.ts` vs. `modulos-treinos.ts` no import),
  parâmetros implícitos `any` em `.sort()` por falta de tipagem explícita do
  retorno do Supabase client
- Escopo deixado de fora desta leva, registrado em `TASKS_NOW.md`: gráfico
  de evolução de peso (dependência de gráfico não decidida para v2), upload
  de imagem de exercício (`imagem_path`), reordenação de exercícios (`ordem`)
- Pendente: teste end-to-end contra o Supabase real

## 2026-07-16 — Treino v2: teste end-to-end concluído, 3 bugs corrigidos

- Teste manual completo contra o Supabase real: seed automático dos 7 módulos
  fixos (confirmado idempotente — reload não duplica), CRUD de treino e de
  exercícios força/cardio, modo academia (séries, cardio, finalização de
  sessão), detecção de PR testada nos dois sentidos (carga menor não marca
  PR, carga maior marca), shape (foto + peso) — todos confirmados funcionando
- **Bug 1 (funcional):** campos numéricos de criação de exercício
  (`series`, `reps`, `carga`, `descanso`, `distancia`, `duracao`) usavam
  `useState<number>` com `Number(e.target.value)` a cada tecla — campo vazio
  virava `0` e o zero "grudava" à esquerda ao digitar novo valor, impedindo
  inserir números normalmente. Corrigido: estados viram string durante a
  digitação, conversão para `Number` só no submit; `onFocus={select()}`
  adicionado em todos os inputs numéricos do projeto (criação de exercício e
  modo academia) para selecionar o valor existente ao focar
- **Bug 2 (visual):** botões de check (`✓`) no modo academia vazavam a borda
  do card em `.linhaSerie`/`.linhaCardio` — `.numSerie` e `.checkOff/checkOn`
  sem `flex-shrink: 0`, inputs sem `min-width: 0`. Corrigido em
  `academia/page.module.css`
- **Observação registrada, não corrigida:** `confirm()` nativo do navegador
  usado ao apagar treino contraria `DESIGN.md` ("nunca `confirm()` nativo").
  Adiado deliberadamente para uma leva de polimento — ver BACKLOG.md

## 2026-07-16 — Biblioteca v2: escopo definido (visão completa do usuário)

- Planejamento formal da Fase 7.2 iniciado. Usuário forneceu especificação
  detalhada categoria por categoria (livros, filmes, séries, animes, mangás,
  podcasts), incluindo dados aninhados (temporadas, elenco, trilha sonora,
  volumes por arco) e regras de exibição (campos vazios ocultos na
  visualização, "Informação indisponível" só pra campos vindos de API)
- Dado o volume de novidades, decisão de fatiar a migração em sub-fases
  B1–B6 (uma migration por vez, confirmada antes de avançar) em vez de uma
  migration única — ver DEC-023, DEC-024, DEC-025
- Escopo revisado e reduzido em conjunto: removidos "onde está disponível"
  (streaming, via API) e "recomendaria" — avaliados como desproporcionais
  ao uso pessoal (risco de manutenção contínua sem benefício real)
- Decisão: sistema de tags livres (`tags` + `*_tags`, da v1/DEC-014)
  descontinuado — substituído inteiramente por gêneros estruturados

## 2026-07-16 — Biblioteca v2 (B1): schema executado, frontend gerado

- `006_biblioteca_v2_base.sql` executada com sucesso no Supabase: tabela
  `generos` (com campo de descrição/tooltip) + 5 junções `*_generos`; campos
  novos em `livros`/`filmes`/`series`/`mangas`/`podcasts` (`favorito`,
  `vezes_consumido`, `onde_consumi`, `valor_pago`, `banner_url`/`banner_path`,
  `classificacao_indicativa`, `duracao_minutos`, `link_imdb`, `link_mal`,
  `link_anilist`, `link_oficial`); `nota` recriada como `NUMERIC(2,1)`
  (escala 1-5 com meia estrela, substituindo 1-10) — dados antigos
  descartados de propósito (usuário confirmou não ter uso real acumulado)
- `007_remover_tags.sql` executada com sucesso: `tags` e as 5 junções
  `*_tags` removidas do banco
- Ver DEC-023 para o raciocínio completo
- Frontend B1 gerado: `lib/generos.ts` (seed automático de gêneros padrão,
  incluindo japoneses com tooltip — Shounen, Seinen, Isekai etc. — CRUD
  completo, diferente do seed fixo do Treino porque gênero é editável pelo
  usuário), `components/SeletorGenero.tsx` (chip multi-seleção com tooltip
  na descrição, componente reutilizável pros próximos tipos de mídia),
  `app/biblioteca/generos/page.tsx`
- Bug de estrutura de pastas encontrado durante a integração: `components/`
  e `app/biblioteca/` foram criados por engano dentro de `.next/` (pasta de
  build gerada automaticamente pelo Next.js, recriada a cada build, fora do
  Git) — corrigido movendo ambos para a raiz de `frontend-v2/`, mesmo nível
  de `app/`, `lib/`, `middleware.ts`
- Pendente: confirmar teste da tela `/biblioteca/generos` após a correção
  de pasta (seed + CRUD)

## 2026-07-17 — Biblioteca v2 (B2 e B3): schemas executados

- `008_biblioteca_v2_b2.sql` executada com sucesso: colunas de produção em
  `filmes` e `series` (roteirista, produtores, estúdio, distribuidora,
  orçamento/bilheteria em filmes, tecnologias como IMAX/Dolby Vision);
  tabela `series_temporadas` (contagem de episódios, nota IMDb, minha nota,
  data assistida); tabelas reutilizáveis `elenco` e `trilha_sonora` com FK
  polimórfica (`tipo_obra` + `obra_uuid`) — mesmo padrão de exceção já
  documentado para `revisao_espacada.referencia_uuid`. Ver DEC-024
- `009_biblioteca_v2_b3.sql` executada com sucesso: tabela `animes`
  completa (nomes original/traduzido, staff de animação, produção, campos
  comuns); `elenco` estendida com `dublador_original`/`dublador_br`;
  `animes_temporadas` + `animes_episodios` (granularidade por episódio,
  marcação de filler — % de filler calculado no frontend, não persistido);
  `openings_endings`; `filmes` ganha `anime_uuid` + `tipo_complemento`
  (complementos de anime são filmes reais e editáveis na tela de Filmes,
  não uma tabela paralela — pedido explícito do usuário);
  `animes_ordem_consumo` com referência polimórfica (temporada ou
  complemento). Ver DEC-025
- Frontend de B2 e B3 ainda não gerado — próximo passo real de código

## 2026-07-18 — Biblioteca v2 (B4/B5/B6): Mangás, Livros, Podcasts — schema desenhado, executado e frontend gerado

- Schema de B4 (Mangás), B5 (Livros) e B6 (Podcasts) desenhado nesta sessão
  (não existia desenho prévio, só a intenção registrada em `BACKLOG.md`/
  `TASKS_NOW.md`) — ver DEC-028, DEC-029, DEC-030
- `011_biblioteca_v2_b4_mangas.sql`, `012_biblioteca_v2_b5_livros.sql` e
  `013_biblioteca_v2_b6_podcasts.sql` criadas e executadas com sucesso no
  Supabase
- Novo componente `PainelSimples` (leitura) criado para Mangá/Livro/Podcast —
  variante mais enxuta do `PainelDetalheObra`, sem lógica de elenco/trilha
  sonora (ver DEC-027)
- Gerados: `lib/mangas.ts`, `lib/mangas-volumes.ts`, `lib/livros.ts`,
  `lib/livros-anotacoes.ts`, `lib/podcasts.ts`, `components/VolumesEditor.tsx`,
  `components/AnotacoesLivroEditor.tsx`, `components/PainelSimples.tsx`,
  `app/biblioteca/mangas/page.tsx`, `app/biblioteca/livros/page.tsx`,
  `app/biblioteca/podcasts/page.tsx`
- Isso fecha o frontend de todas as 6 sub-fases da Biblioteca v2 (B1 a B6) —
  teste end-to-end geral fica para uma sessão futura, a pedido do usuário
- **Bug 1 (TypeScript, 5 ocorrências):** `MangaVolumeInput`/`AnimeEpisodioInput`
  exigiam campo `numero` obrigatório, mas `VolumesEditor.tsx`/
  `EpisodiosEditor.tsx` usam `atualizarVolume()`/`atualizarEpisodio()` para
  toggles simples (`lido`, `filler`, `assistido`) sem reenviar `numero`.
  Corrigido via Cline+DeepSeek: tipos `MangaVolumeUpdate`/`AnimeEpisodioUpdate`
  (Partial completo, sem campo obrigatório) criados separados dos tipos
  `Input` usados na criação — ver `DATABASE.md` → Gotchas para o padrão a
  seguir daqui em diante
- **Bug 2 (arquivo sobrescrito):** durante a mesma correção,
  `components/AnotacoesLivroEditor.tsx` foi acidentalmente sobrescrito com a
  lógica de `VolumesEditor.tsx` (import de `lib/mangas-volumes`, prop
  `mangaUuid` em vez de `livroUuid`) — os dois componentes têm estrutura
  muito parecida e foram confundidos numa correção automática. Corrigido:
  conteúdo original de `AnotacoesLivroEditor.tsx` restaurado, prop de volta
  para `livroUuid` em `app/biblioteca/livros/page.tsx`
- Pendências de polimento registradas em `BACKLOG.md`: integração de gênero
  (B1) nas 6 telas novas; upload de capa/banner (campos existem no schema,
  sem bucket/UI); busca por API externa (TMDB/Google Books/Jikan/iTunes) nas
  telas v2 (a v1 tinha, a v2 ainda não); edição de itens já criados em listas
  aninhadas (hoje só criar/apagar + toggles); reordenação manual (`ordem`);
  `animes_generos` sem lib/UI; `confirm()` nativo; menu "⋯" não fecha ao
  clicar fora