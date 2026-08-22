# BACKLOG.md

Ideias futuras e funcionalidades não priorizadas. Nada aqui é compromisso — é uma lista de possibilidades para quando o núcleo do sistema estiver estável. Ver também `ROADMAP.md` → Fase 6 (Integrações Externas) e `VISION.md` para módulos ainda mais distantes.

> **Nota (2026-08):** este arquivo estava com todo o conteúdo duplicado — a
> segunda metade era uma cópia mais antiga e menos completa da primeira.
> Removida a duplicação nesta reconciliação; os dois itens que existiam só
> na cópia antiga (banners estáticos, perfil da sidebar) foram trazidos para
> a seção de Biblioteca abaixo.

---

## Pós-v2 — estado vigente após o fechamento técnico de 2026-08-21

A infraestrutura segura possível no repositório foi concluída. Permanecem
somente evoluções que ampliam o contrato já entregue ou exigem custo, política
de conflito/publicação ou comportamento não definido.

- [ ] Google Calendar bidirecional/importação, conflitos e propagação de
      exclusões. OAuth e exportação unilateral idempotente já estão entregues.
- [ ] Google Photos Picker opcional. Uploads duráveis de Perfil, Receitas,
      Lugares, Biblioteca e provas/simulados já usam Supabase Storage privado.
- [ ] Anki avançado: mídias embutidas e templates/JavaScript complexos. `.apkg`
      básico/cloze, deck, prévia e deduplicação já estão entregues.
- [ ] BRAPI/cotações avançadas: histórico persistido, análises, alertas e
      automações; consulta opcional sob demanda e cache de 60 s já existem.
- [ ] Uploads adicionais somente quando surgir novo domínio/contrato; não há
      upload conhecido da v2.1 sem destino.
- [ ] Publicação da extensão em loja ou captura avançada/autenticada; a versão local Manifest V3 para Artigo/Vídeo já foi entregue.
- [ ] Scraping e importações avançadas/em lote.
- [ ] Testes de integração/E2E autenticados. A base Node agora cobre 18 casos
      de parser/cálculo/ordenação e a suíte SQL cobre 16 scripts.
- [ ] Hardening incremental restante do banco e do Storage, sem editar baselines aplicadas.
- [ ] Polimentos visuais identificados na homologação, sem redesign amplo.

Os detalhes e dependências de cada item permanecem nas seções temáticas abaixo.

---

## Auditoria de fechamento do brainstorm/v2 — 2026-08-20 (histórica)

> Esta fotografia foi superada pelo lote publicado de 2026-08-21. A
> classificação vigente está na seção “Auditoria final” abaixo.

### 1. Implementado e publicado

- Núcleo autenticado, Hub, navegação global, dropdown de perfil e temas claro/suave/nublado/estrelado/escuro.
- Treino/Shape, Biblioteca com oito categorias e metadados, Estudos/Curso,
  Revisão, Agenda, Diário, Projetos/Programação, Receitas, Saúde, Finanças,
  Lugares, Idiomas e Histórico.
- Vídeo → Curso, favoritos e duração da Biblioteca, CSV/TSV de flashcards,
  heatmap retrospectivo, BRAPI opcional sob demanda e uploads privados de
  Shape, exercícios, materiais e Redações.
- Primeira rodada de correções da homologação e migrations até
  `20260820000100_redacoes_nota_mil.sql`.

### 2. Implementado, mas ainda depende de teste manual

- Prioridade baixa/normal/alta da Agenda foi implementada, validada e publicada;
  persistência, ordenação e provas de Estudos ainda dependem de reteste manual.
- Segunda rodada: passos de 40 e tempo de Redação, contagem de respostas em
  branco, anexo da redação no Dia 1 e novo rodapé do card de Shape.
- Persistência e responsividade dos módulos mais recentes com dados reais,
  incluindo Programação, Investimentos, Idiomas, Histórico e Agenda mensal.
- APIs opcionais atuais (TMDB, YouTube e BRAPI) com chaves reais e seus
  fallbacks sem chave; upload/substituição/recarga nos buckets já adotados.

### 3. Pendente implementável sem integração externa grande

- Recorrência/parcelamento financeiro manual; exige definir geração, edição e
  cancelamento das parcelas, vínculo do grupo e efeito da edição antes do schema.
- Dashboards analíticos adicionais de Treino/Finanças e cobertura automatizada
  dos fluxos de maior risco (frontend, integração e E2E).
- Hardening incremental restante de banco/Storage, sempre em migrations
  pequenas e testadas. Upload de capa da Biblioteca pode aproveitar o bucket
  `capas` após revisão de path, substituição e remoção; banner ainda não tem
  destino inequívoco. Nenhum upload sem contrato foi incluído neste lote.

### 4. Pós-v2 por integração externa ou decisão maior

- YouTube playlists/conta do usuário, Google Calendar e Google Photos: OAuth,
  consentimento, sincronização e tratamento de revogação.
- BRAPI avançada: histórico/cache/análises; a consulta atual permanece
  pontual e não persistida.
- Importação avançada de artigos, scraping e extensão Edge/Chrome: segurança,
  limites de origem, manutenção e política de captura ainda precisam de decisão.
- Anki `.apkg`: pacote ZIP/SQLite/mídia e reconciliação de modelos; CSV/TSV é
  o limite implementado.
- Uploads binários de Perfil, Receitas, Lugares e provas/simulados, além de
  banners da Biblioteca: faltam contrato completo de coluna, bucket e policy
  por domínio; as URLs e uploads já existentes continuam sendo o comportamento
  esperado, não bug.

---

## Treino

- [ ] Notificações push (Service Worker Push API) — lembrete de treino — **depende de M2, fora de escopo v1**
- [ ] Gráfico de evolução de carga por exercício
- [ ] Volume semanal por grupo muscular
- [ ] Página dedicada para `cardio` — evolução pós-v2; o dashboard e os fluxos de cardio atuais permanecem como entrega da release candidate

## Geral

- [ ] Exportação geral de dados CSV/JSON via Supabase; o Histórico já exporta o recorte visível em CSV.
- [x] Google Calendar OAuth server-side e exportação unilateral idempotente
      implementados por API Routes; bidirecional permanece no topo deste arquivo.
- [ ] Dashboard analytics avançado
- [x] Heatmap retrospectivo transversal implementado em `/historico` sem tabela
      agregada: conta registros por fonte/dia, permite filtro por área e evita
      comparar duração, valor financeiro ou nota como se fossem a mesma métrica.
- [x] Uploads de capas/banners, provas/simulados, Perfil, Receitas e Lugares
      concluídos com buckets privados, paths por usuário e signed URLs.
- [ ] Modo múltiplos usuários (RLS já suporta — bastaria criar contas; não é objetivo do projeto por princípio, ver PROJECT_PRINCIPLES.md)
- [x] Navegação global entre módulos e botão de logout visível — implementado em 2026-08-09 com hub `/`, navegação para Treino/Biblioteca/Estudos e logout via Supabase Auth.
- [ ] Corrigir o corte residual da letra “g” em “Agenda” na navegação em uma combinação específica de largura/zoom; o usuário decidiu não bloquear o teste atual por isso (2026-08-12).
- [x] Área global de perfil evoluída para dropdown de resumo com avatar, nome, descrição, background, e-mail e link para `/configuracoes`, sem criar rota ou domínio social.

## Estudos

- [x] ~~Questões individuais estruturadas~~ — resolvido no schema da Fase 1 do Estudos v2 (`questoes_individuais`, DEC-035)
- [ ] Importação de dados do sistema ENEM standalone antigo, se houver conteúdo relevante a resgatar
- [x] Upload de materiais de estudo no bucket privado `documentos`, usando `arquivo_path` e signed URLs, implementado em 2026-08-12 sem mudança de Storage.
- [x] Cursos (estrutura própria — módulos/aulas/certificado) — implementado na Fase 1B de Estudos v2 (DEC-036)
- [x] Importação leve de exportações CSV/TSV implementada em `/revisao`, com
      `pergunta`, `resposta`, módulo opcional, limites, prévia antes de gravar,
      módulo padrão, filtro e deduplicação simples.
- [ ] Importação Anki `.apkg` permanece etapa própria: o pacote combina ZIP,
      SQLite e mídia e exige parser/dependência, escolha de baralho/modelo e
      tratamento de HTML/cloze; não misturar com o importador tabulado atual.
- [ ] Redação versionada (múltiplas versões, competências detalhadas), Fase 1 entrega só versão leve (DEC-035)
- [x] Calendário acadêmico/cronograma absorvido pela Agenda v2; provas continuam em Estudos e são apenas exibidas na Agenda, sem duplicação
- [ ] Metas diárias/semanais/mensais e sequência de dias estudando (streak) — avaliar sobreposição com o módulo Hábitos (ainda não iniciado) antes de construir algo específico de Estudos
- [ ] Notas por avaliação com peso (ex: "Prova bimestral" peso 2, "Lista" peso 1) e nota máxima customizável por avaliação, com média ponderada calculada — ideia trazida por um componente gerado pelo v0.dev (`GradeManager`) na tela de Matéria, descartada da restilização de 2026-07-31 por não ter schema equivalente. `provas.nota` hoje é só uma nota simples por prova. Se for adotada, exige tabela nova (algo como `lancamentos_nota`) e entra como decisão de schema em `DECISIONS.md`, não como ajuste de UI.
- [ ] Estatísticas avançadas de Estudos (ranking de conteúdos fracos/fortes, eficiência de estudo) — depende de volume real de dado acumulado, sem sentido construir com o schema vazio
- [ ] Upload de arquivo de prova/gabarito em `simulados` — Fase 1 entrega só campos numéricos/observação, sem anexo
- [x] Base do modo "fazer prova na hora" publicada no fechamento da primeira
      rodada de homologação: botão por prova, contagem regressiva (Dia 1 5h30,
      Dia 2 5h), prazo persistido no navegador, gabarito de 90 questões e
      salvamento ao finalizar. A segunda rodada integrou tema/imagem da redação
      do Dia 1 e contagem explícita de respostas em branco (DEC-059).
- [ ] Evolução do modo de prova: upload/abertura do PDF e visual alternativo de
      "relógio de sala de aplicador" em blocos de 30 minutos. Exige contrato de
      upload próprio; não bloqueia a base cronometrada já entregue.
- [ ] Vínculo direto entre um card de Revisão Espaçada e um compromisso da
      Agenda. A Agenda v2 já oferece horário/duração para estudo por matéria e
      conteúdo, mas não cria compromissos automaticamente a partir de cards.
- [x] Áreas de estudo além de ENEM/Escola/Curso: Olimpíadas, Vestibulares e
      Outros reutilizam Matéria→Conteúdo; Idiomas ganhou domínio próprio por
      precisar de vocabulário, prática e métricas específicas (DEC-055).
- [x] Programação implementada como visão especializada de `projetos` em
      `/programacao`, com repositório, linguagem, status e destaque; conteúdos
      didáticos continuam em Estudos e não foi criado domínio paralelo.
- [x] Cronograma/planejamento temporal de estudo pertence à Agenda; Estudos
      permanece fonte de verdade de matérias, conteúdos e provas. Metas e
      prioridades avançadas continuam fora do escopo atual.
- [x] Widgets de tempo estudado no Hub (hoje / semana / mês) — implementados
      em 2026-08-12 com agregação real de `sessoes_estudo` no fuso local.
- [ ] Campo "questões anuladas" em `simulados` — presente no rascunho
      original do módulo, sem equivalente no schema atual.

## Documentação / processo

- [ ] Revisar `NAMING_CONVENTIONS.md` de classes CSS — hoje há mistura de prefixo por página (`.rev-`, `.cal-`, `.ex-`) com nomes genéricos (`.btn-sm`, `.toast`); avaliar se vale padronizar
- [ ] Auditoria completa do CSS contra `DESIGN.md` para confirmar que todas as classes documentadas realmente existem
- [x] `frontend/README.md` reconciliado com o setup real, toolchain, variáveis e validações do projeto.
- [x] `estrutura.txt` substituído em 2026-08-08 por um mapa conciso da estrutura atual; não incluir novamente dumps de `.next`/`node_modules`.
- [x] SVGs padrão do Create Next App confirmados ausentes de `frontend/public/`.
- [x] `frontend/app/page.module.css` confirmado ausente; o Hub atual usa Tailwind.
- [ ] Recapturar snapshots de produção periodicamente e comparar com a cadeia ativa em `backend/supabase/migrations/` — nunca usar o acervo `history/legacy-migrations/` como referência operacional.

## Biblioteca

### Biblioteca v2 (B2–B6) — polimento

- [x] YouTube API preparada para importar título, canal, duração e thumbnail
      por uma API Route server-side; requer `YOUTUBE_API_KEY` no ambiente.
- [ ] Extensão de navegador, importação em lote e scraping para Vídeos/Artigos
      continuam fora do produto atual. O cadastro manual permanece disponível.
- [x] Fluxo manual Vídeo → Curso em Estudos — implementado localmente com
      `conteudos.video_uuid`, escolha explícita de curso/módulo e bloqueio de
      duplicação no mesmo curso (DEC-048). Migration aplicada em produção em
      2026-08-12; fluxo liberado para publicação.
- [ ] Sincronizar opcionalmente progresso entre vídeo da Biblioteca e aula do
      Curso. O fluxo inicial mantém `assistido`, `teoria_vista` e domínio
      independentes por decisão; só reavaliar após uso real.

- [x] Seletor de gênero integrado de ponta a ponta nas 6 categorias originais:
      leitura em lote, seleção no formulário, persistência ao criar/editar,
      seed seguro e acesso ao gerenciamento pela sidebar (2026-08-12).
- [x] Upload de capa/banner usa o bucket privado `capas`, com UI, substituição,
      rollback e signed URL; links externos permanecem fallback.
- [x] Busca externa integrada aos formulários de Filmes, Séries, Animes,
      Mangás, Livros e Podcasts via TMDB, Jikan, Google Books e iTunes Search.
      TMDB usa `TMDB_API_KEY` server-only; as fontes públicas mantêm fallback
      manual quando há limite ou indisponibilidade temporária. A v2.1 tornou
      origem, prévia e orientação sobre limites mais explícitas.
- [ ] Edição de itens já criados em listas aninhadas (elenco, trilha sonora, temporadas, openings/endings, volumes) — hoje só dá pra criar ou apagar; os únicos campos editáveis depois de criado são os toggles (`lido`, `filler`, `assistido`)
- [ ] Reordenação manual (drag-and-drop) do campo `ordem` em elenco/trilha sonora/openings-endings/volumes — hoje `ordem` só reflete sequência de criação
- [x] `animes_generos` consumida por `lib/generos.ts` e pela UI de Animes.
- [x] `confirm()` nativo do navegador ao apagar item — as 10 ocorrências em Biblioteca e Treino foram substituídas pelo `ConfirmDialog` reutilizável em 2026-08-11; busca no frontend ficou zerada.
- [x] Menu de ações dos cards fecha por clique externo, Escape ou escolha de ação, com foco devolvido ao botão quando fechado pelo teclado e botão visível em dispositivos sem hover (2026-08-12).
- [ ] Velocidade de leitura (páginas/hora) em Livros (B5) — `paginas_total`/`pagina_atual` permitem progresso, mas não velocidade; exigiria registro de sessões de leitura com data, não desenhado ainda (ver DEC-029)
- [ ] Imagens estáticas de banner por categoria (`public/biblioteca/banners/{filmes,series,animes,mangas,livros,podcasts,videos,artigos}.jpg`) — suporte já existe no `BibliotecaBanner` (DEC-034), mas depende do usuário fornecer as imagens; sem elas, cada categoria usa mosaico de capas ou fallback visual. Confirmado que ao menos `animes.jpg` já está versionado.
- [x] Perfil removido da sidebar e promovido à navegação global de todo o site, com avatar, nome, background opcional e fallback (2026-08-12, DEC-049).
- [x] Tela `/configuracoes` para editar nome, descrição curta, `user_metadata.avatar_url` e `background_url`, implementada em 2026-08-12.

## Saúde, Finanças e Lugares

- [x] Primeira versão manual de Saúde, Finanças e Lugares implementada em
      2026-08-13, sem integração externa ou dependência nova.
- [ ] Saúde: gráficos de tendência, lembretes e fotos próprias ficam para uma
      evolução posterior; peso continua em `shape` e não deve ser duplicado.
- [x] Finanças: posições manuais e consulta opcional sob demanda pela BRAPI
      implementadas sem cache nem persistência da cotação; token fica somente
      no servidor e a UI funciona sem ele. A v2.1 adicionou valor atual,
      resultado e cobertura das cotações disponíveis.
- [ ] Finanças: importação bancária, histórico de cotação, proventos e análise
      avançada continuam futuros. Recorrência finita já está implementada.
- [ ] Lugares: Maps/Places API e Google Photos Picker permanecem opcionais;
      upload privado de capa e link externo para Maps já estão entregues.

## Treino v2

- [x] Substituir `confirm()` nativo do navegador por modal de confirmação ao apagar treino — concluído com o `ConfirmDialog` reutilizável em 2026-08-11.
- [ ] Gráfico de evolução de peso em `app/treino/shape/page.tsx` — decisão de dependência ainda não tomada para v2 (Chart.js não está no `package.json` atual — se retomado, escolher biblioteca do zero, não assumir Chart.js como já decidido)
- [x] Upload de imagem/GIF de exercício (`imagem_path`) entregue na v2.1 com bucket privado, signed URL, validação de tipo/tamanho, rollback e policy endurecida pela migration incremental `20260815000200`.
- [ ] Reordenação de exercícios (`ordem`) via drag-and-drop ou setas — hoje `ordem` só reflete sequência de criação

## Dívida técnica de código (achados da auditoria de 2026-08)

- [ ] Lint: 51 achados na execução reproduzível de 2026-08-15 (27 erros e
      24 warnings), concentrados na dívida preexistente de efeitos síncronos,
      dependências de hooks e imagens sem otimização. Os arquivos tocados no
      lote Programação/Investimentos/CSV passaram lint direcionado sem erros;
      restou apenas o `no-img-element` já conhecido do avatar global. Investigar
      o restante caso a caso; lint continua informativo na CI.
- [ ] npm 12 bloqueia por padrão os scripts de instalação transitivos de `sharp@0.34.5` e `unrs-resolver@1.12.2`. Instalação, typecheck e build passaram nesse estado; não aprovar scripts cegamente. Reavaliar somente se uma plataforma limpa demonstrar falha funcional (especialmente otimização de imagens ou resolução nativa).
- [ ] `@types/node` permanece na linha 20, herdada do setup do Next, enquanto o runtime é Node 24. Typecheck e build passam e o código não depende de APIs exclusivas da major 24; alinhar os tipos apenas numa atualização deliberada, sem misturar com feature.
- [ ] Hardening do banco, sempre em migrations incrementais separadas: revisar o `GRANT ALL` atual de `authenticated` e a configuração `SECURITY DEFINER`/`search_path` de `public.rls_auto_enable()`. Policies de `redacoes`/`exercicios`, cascade e domínio de `materias` foram corrigidos em `20260815000200`; a baseline permanece histórica e não deve ser editada.
- [x] `materias.user_id` alinhada com `ON DELETE CASCADE` pela migration incremental `20260815000200`.
- [x] `materias.tipo` normalizado, com default `academica` e CHECK do domínio real pela migration incremental `20260815000200`.
- [ ] Frontend sem testes unitários, de integração ou E2E automatizados. A CI mínima já valida instalação, tipos e build; a única suíte automatizada funcional existente é a validação SQL local da baseline. Adicionar testes quando houver um primeiro caso de alto valor, sem introduzir framework apenas por cobertura nominal.

## v3 (futuro distante)

- [ ] Migrar Treino/Biblioteca (CSS Modules) para Tailwind — Estudos já migrou (DEC-038, 2026-07-25); decisão de estender pro resto do sistema ainda não tomada, sem data

## Reclassificação após o lote de 2026-08-21

- [x] Parcelamento e recorrência financeira manual, finitos e sem cron.
- [x] Upload privado de capa nas oito categorias e banner nas seis categorias
      cujo schema possui `banner_path`.
- [x] Importação mínima e segura de metadados Open Graph para Artigos.
- [x] Extensão Edge/Chrome Manifest V3 para abrir Artigo/Vídeo pré-preenchido.
- [x] Testes automatizados de funções puras e hardening MIME dos buckets.
- [x] YouTube playlists e exportação unilateral do Calendar com OAuth server-side,
      PKCE, cofre AES-256-GCM e revogação.
- [x] Alternativa completa ao Google Photos via Supabase Storage privado.
- [x] Anki `.apkg` com ZIP/SQLite, deck, prévia, limite e deduplicação; CSV/TSV preservado.
- [ ] BRAPI avançada com histórico/análises — PÓS-V2; cache curto e consulta sob demanda já existem.
- [ ] Scraping em lote/agressivo — PÓS-V2; somente Open Graph limitado foi adotado.
- [x] Uploads de Perfil, Receitas, Lugares e provas/simulados com coluna,
      bucket privado, signed URL, validação e rollback.
- [ ] Testes de integração/E2E e hardening incremental restante continuam evoluções pós-homologação.

## Auditoria final — fechamento v2.1 em 2026-08-21

### 1. Feito e publicado

- Módulos centrais, Agenda com prioridade, Redações/ENEM, Treino/Shape,
  Biblioteca com oito categorias, Estudos/Revisão, Diário e módulos derivados.
- Parcelamento e recorrência finitos, capas privadas nas oito categorias,
  Open Graph limitado de Artigos, cache BRAPI de 60 s, extensão local Manifest
  V3, OAuth Google separado para YouTube/Calendar, `.apkg`, uploads privados
  restantes e 23 testes Node.
- Migrations e Storage alinhados até
  `20260822000200_integracoes_google_servicos.sql`, com pós-check remoto e dry-run vazio.

### 2. Precisa apenas de teste manual

- Homologação autenticada dos módulos, CRUDs, responsividade e segurança básica.
- Cinco iluminações, cinco opções de estação, foco arredondado do controlador,
  Lua neutro e combinações sazonais representativas.
- Extensão com Artigo/YouTube, capas privadas, Open Graph, parcelamento,
  recorrência, `.apkg`, uploads, Google e BRAPI com os estados reais do deploy.

### 3. Precisa de credencial ou configuração externa

- `TMDB_API_KEY`, `YOUTUBE_API_KEY` e `BRAPI_TOKEN` são opcionais e server-only;
  sem eles, os respectivos fallbacks manuais devem continuar funcionando.
- Google requer as cinco variáveis server-side documentadas e autorização da
  conta; sem elas, o estado “não configurado” é o comportamento esperado.
- Extensão local exige carregar a pasta em modo desenvolvedor e configurar a
  origem HTTPS publicada; isso não é autenticação própria.

### 4. Integrações ampliadas ainda pós-v2

- Calendar bidirecional, Google Photos Picker e publicação da extensão em loja
  exigem políticas/custos externos; as bases unilaterais e os uploads duráveis
  já estão implementados.

### 5. Pós-v2

- Mídias/templates complexos do Anki, scraping/importação em lote, BRAPI
  histórica/analítica, publicação da extensão em loja, testes E2E autenticados,
  dashboards adicionais e hardening incremental de banco/Storage.
