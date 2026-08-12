# CHANGELOG.md

Histórico de marcos do projeto. Bugs corrigidos e seus detalhes técnicos vivem em `DATABASE.md` → Gotchas (se forem de schema/coluna) ou ficam registrados apenas aqui em 1 linha (se forem pontuais e sem risco de repetição). Decisões arquiteturais vivem em `DECISIONS.md`, não aqui.

> Entradas até 2026-07-09 foram reconstruídas retroativamente nessa data. A partir dali, cada entrada leva a data real do evento.

---

## v1 (HTML puro) — histórico resumido

- **2026-07-09** — Migração LAN → Supabase decidida e executada (DEC-001 a DEC-011). Schema inicial (`001_schema_inicial.sql`, 8 tabelas) executado. Auth + Core JS (`login.html`, `supabase.js`, `auth.js`, `sm2.js`) implementados. Módulo de Treino completo (`treino.html`, `treino-shape.html`, `treino-plano.html`, `treino-academia.html`). `revisao.html` implementado com bug de schema conhecido (corrigido depois, ver abaixo).
- **2026-07-09/10** — Schema de Estudos (`002_estudos.sql`) criado; `estudos.html` gerado antes da confirmação de execução (a pedido do usuário, risco assumido).
- **2026-07-11** — `002_estudos.sql` executado e verificado. `estudos.html` validado contra o schema real, sem incompatibilidades. `revisao.html` corrigido (colunas e assinatura de `calcularSM2()` — ver DATABASE.md → Gotchas). Módulo Biblioteca planejado (DEC-014) e `003_biblioteca.sql` (11 tabelas) executado.
- **2026-07-11 a 07-13** — GRANT retroativo aplicado a todas as tabelas (DEC-015, badge "API DISABLED" era falta de GRANT, não erro de RLS). `biblioteca.html` gerado, testado end-to-end, path de CSS corrigido. Auditoria de modais (`abrirModal`/`.open`) corrigiu 4 páginas (`treino-academia.html`, `treino-shape.html`, `revisao.html`, `estudos.html`). RLS de Estudos confirmada. Podcasts ganham iTunes Search API (DEC-016).
- **2026-07-13** — Deploy no Vercel (`sistemapessoal`). Incidente: usuário deletado manualmente em Auth causou `ON DELETE CASCADE` e apagou todos os dados de teste (ver DATABASE.md → Gotchas, nunca repetir). Fase M (migração + deploy) encerrada: e2e e multi-dispositivo confirmados. Links quebrados do dashboard (Enem/Olimpíada/Escola) corrigidos via `?tipo=` (DEC-017). Classes `.btn-icon`/`.btn-salvar` faltantes adicionadas.

**v1 congelada em 2026-07-14** (DEC-018) — todas as fases (1–6, M) concluídas. Removida do projeto em 2026-07-19 (DEC-031), mantida só como backup local.

---

## v2 (Next.js) — em andamento

- **2026-08-12 (perfil, uploads e novos módulos)** — `/configuracoes` passou a
  editar os metadados visuais do perfil no Supabase Auth e atualizar o topo
  global. Materiais de Estudos ganharam upload privado no bucket `documentos`
  com signed URLs; o fluxo de imagem de Redações ganhou validação e limpeza de
  arquivos em substituições/falhas. Projetos e Receitas foram implementados
  com CRUD, soft delete, navegação e resumos no Hub. A migration incremental
  `20260812000200_projetos_receitas.sql` e seu teste específico passaram no
  banco Docker local. Após novo dry-run limpo, a migration foi aplicada em
  produção em 2026-08-12; o pós-check remoto não encontrou pendências.

- **2026-08-12 (alinhamento estrutural da navegação global)** — O topo deixou
  de combinar `flex-wrap`, reordenação e larguras independentes: `GlobalNav`
  passou a usar uma única grade responsiva com áreas de perfil, navegação e
  logout. No desktop, as três áreas compartilham a mesma linha de `3.5rem`; em
  larguras menores, apenas a navegação quebra de forma controlada. O efeito de
  perfil ficou contido na célula esquerda, com fallback neutro baseado em
  `surface-2`, e a borda inferior passou a pertencer exclusivamente ao
  `header`. Os offsets e o acabamento da Biblioteca foram preservados.

- **2026-08-12 (acabamento do perfil global)** — O background do perfil no
  `GlobalNav` deixou de depender de uma cor sólida mascarada. O fallback agora
  é um gradiente transparente próprio, e `background_url` ocupa uma segunda
  camada com máscaras CSS padrão e WebKit. As duas camadas se dissolvem no
  fundo da navegação sem formar uma faixa retangular; avatar, nome, link
  “Início” e comportamento mobile foram preservados. Nenhuma mudança de banco,
  dependência ou integração foi necessária.

- **2026-08-12 (correções após o primeiro deploy do polimento final)** — O
  perfil deixou de ser uma exceção da Biblioteca e substituiu “Sistema
  Pessoal” no topo de todas as rotas autenticadas, mantendo “Início” como
  acesso único à Home. O background do perfil passou a degradar logo depois
  do nome. A sidebar da Biblioteca foi compactada para exibir categorias e
  ações sem a pequena rolagem observada no teste, e o item ativo passou a usar
  `--accent-foreground`, corrigindo o rótulo invisível sobre o fundo de
  destaque. Nenhuma mudança de banco ou dependência foi necessária.

- **2026-08-12 (ajustes do teste manual final)** — Corrigidos o contraste do
  login e o corte de “Agenda” na navegação responsiva. O Hub ganhou um bloco
  compacto de provas futuras baseado em `provas`. A Biblioteca deixou o tema
  dourado fixo, passou a acompanhar o tema global, moveu o perfil para o topo
  e eliminou a disputa de rolagem entre página, conteúdo e sidebar. Revisão
  Espaçada ganhou arquivamento reversível separado do soft delete; a migration
  `20260812000100_revisao_arquivados.sql` e seu teste passaram em reset local
  e na suíte SQL completa. Após dry-run limpo, a migration foi aplicada em
  produção com autorização explícita e o pós-check remoto não encontrou
  pendências. A importação Anki foi auditada e mantida como etapa própria por
  depender de ZIP/SQLite e de
  decisões de mapeamento, sem nova dependência nesta leva.

- **2026-08-12 (auditoria final local)** — Revisão completa dos fluxos centrais
  antes do teste manual definitivo. Corrigido o uso de data UTC em operações
  de Hub, Estudos, Revisão e Shape; o Hub passou a preservar dados disponíveis
  quando uma fonte falha. O Hub de Estudos deixou de mostrar UUID de matéria.
  Cursos e provas ganharam controles coerentes de conclusão, e o gabarito ENEM
  completo marca a prova como feita. Simulados, competências de redação e
  correção do gabarito passaram a validar os limites/requisitos já definidos.
  Na Biblioteca, o gatilho de adicionar não vaza entre categorias e os menus
  fecham ao escolher uma ação, com acesso visível por toque. Nenhuma migration,
  dependência ou operação remota foi necessária; typecheck aprovado e lint
  informativo reduzido de 44 para 40 achados conhecidos.

- **2026-08-12 (cont.)** — Hub inicial transformado em painel operacional
  com tempo estudado hoje/semana/mês, compromissos e provas do dia e revisões
  pendentes, todos derivados das tabelas existentes e com estados de loading,
  vazio e falha parcial. Na Biblioteca, o fluxo de gêneros das seis categorias
  originais foi completado: seed quando necessário, leitura em lote,
  persistência na criação/edição e acesso ao gerenciamento pela sidebar. O
  menu compartilhado dos cards agora fecha por clique externo e Escape. Seis
  erros de lint em efeitos das telas tocadas foram removidos; nenhuma migration,
  dependência ou operação remota foi necessária.

- **2026-08-11 (cont.)** — Migration de Vídeos/Artigos aplicada em produção.
  Implementado localmente o fluxo manual Vídeo → Curso: escolha explícita de
  curso e módulo existente ou novo, criação de conteúdo com FK opcional para
  `videos`, prevenção de duplicação no mesmo curso e manutenção de progresso
  independente. A tela de Curso identifica aulas vindas da Biblioteca, abre o
  vídeo e permite controlar teoria vista e domínio separadamente. A migration
  `20260811000300_conteudos_video.sql` passou por reset e testes locais, foi
  aplicada em produção em 2026-08-12 e teve pós-check remoto sem pendências,
  liberando o lote para publicação.

- **2026-08-11 (cont.)** — Biblioteca v2 expandida localmente com as
  categorias Vídeos e Artigos na página única da DEC-032. Foram adicionados
  CRUD manual, busca, painel de detalhe, links externos e soft delete com
  `ConfirmDialog`; URLs reconhecidas do YouTube fornecem ID e thumbnail sem
  API. A migration `20260811000200_biblioteca_videos_artigos.sql` cria as duas
  tabelas com RLS, GRANT, checks e índices parciais. Reset e três testes SQL
  passaram localmente; a migration foi aplicada em produção em 2026-08-11.

- **2026-08-11 (cont.)** — Agenda v2 implementada localmente em `/agenda`,
  com visão semanal, CRUD de compromissos, soft delete, eventos gerais, de
  estudo e de treino, além da exibição de provas diretamente da fonte de
  verdade de Estudos. Hub e navegação global passaram a incluir Agenda. A
  migration incremental `20260811000100_agenda_v2.sql` evolui a tabela
  existente sem recriá-la; reset, teste consolidado e teste específico da
  Agenda passaram localmente. A migration foi aplicada em produção pela
  cadeia ativa em 2026-08-11 e o pós-check remoto não encontrou pendências,
  liberando a publicação do frontend.

- **2026-08-11** — Fechamento seguro de UX da v2: as 10 ocorrências restantes
  de `confirm()` nativo em Treino e Biblioteca foram substituídas pelo
  `ConfirmDialog` reutilizável, preservando as mesmas operações de exclusão.
  `window.prompt` continua ausente. Documentação reconciliada com o hub `/`,
  navegação global, logout, smoke principal de produção e modais atuais. Sem
  mudança de banco, migration, dependência ou infraestrutura.

- **2026-08-11 (cont.)** — Estudos v2 passou a consumir as três tabelas que
  ainda não tinham fluxo: materiais por conteúdo, anotações por matéria com
  conteúdo opcional e sessões manuais com início/duração. Foram adicionadas
  três libs e um componente reutilizado nos detalhes de Matéria e Curso, com
  soft delete e `ConfirmDialog`. O `SubjectManager` órfão, única fonte das
  métricas artificiais antigas, foi removido. A auditoria concluiu que o
  schema consolidado já era suficiente; nenhuma migration, dependência ou
  configuração de Storage foi alterada.

- **2026-08-11 (cont.)** — Revisão Espaçada ganhou página dedicada em
  `/revisao`, acessível pelo hub, navegação global e Hub de Estudos. A tela
  separa cards vencidos/para hoje dos futuros, permite revelar resposta,
  registrar resultado pelos mesmos níveis do SM-2 existente, criar card
  manual e apagar com `ConfirmDialog` + soft delete. Cards de Estudos são
  identificados como conteúdo e têm `conteudos.revisao_uuid` desvinculado ao
  apagar. O schema existente foi suficiente; sem migration ou dependência.

- **2026-08-09** — Primeira etapa segura para tornar a v2 usável como site:
  rota `/` deixou de ser placeholder técnico e virou hub inicial com acesso
  direto a Treino, Biblioteca e Estudos. Navegação global simples adicionada
  ao layout raiz, com ação visível de logout via Supabase Auth e
  redirecionamento para `/login`. Nenhuma mudança de banco, migration,
  dependência, Storage, Vercel ou API externa.

- **2026-08-09 (cont.)** — Smoke test online em produção consolidado:
  login, hub, navegação para Treino/Biblioteca/Estudos e logout passaram,
  sem problema relatado pelo usuário. Em Estudos, ações destrutivas
  receberam modal de confirmação e o vínculo de conteúdo compartilhado
  deixou de usar `window.prompt`, passando para seleção visível de matéria.
  Sem mudança de schema, migration, dependência ou infraestrutura.

- **2026-07-14** — Decisão de migrar para Next.js/React + TypeScript (DEC-018). Estrutura da v2 definida: `frontend-v2/`, App Router, CSS Modules (DEC-019).
- **2026-07-15** — Fase 7.0 (setup técnico) concluída: projeto Next.js criado, `lib/supabase.ts` (bug real: precisa de `createBrowserClient`, não `createClient` — ver ARCHITECTURE.md), `middleware.ts` (DEC-021), login testado, CSS global com tokens de `DESIGN.md`. Treino v2 planejado (Fase 7.1, DEC-020): hierarquia `modulos_treino` → `treinos` → `exercicios_forca`/`exercicios_cardio`. `005_treino_v2.sql` executado.
- **2026-07-16** — DEC-022: módulos de treino viram fixos (reabre parte da DEC-020). Páginas do Treino v2 geradas (hub, CRUD de treino/exercícios, modo academia, shape). Teste e2e: 3 bugs corrigidos (inputs numéricos com `useState<number>`, `.linhaSerie`/`.linhaCardio` vazando borda; `confirm()` nativo adiado deliberadamente, ver BACKLOG.md). Biblioteca v2: escopo completo definido, fatiado em B1–B6 (DEC-023 a DEC-025 abrem o desenho). B1 executado e gerado (`generos`, remoção de `tags`).
- **2026-07-17** — Biblioteca v2 B2 (`elenco`/`trilha_sonora` polimórficos, `series_temporadas` — DEC-024) e B3 (`animes`, `animes_episodios`, `openings_endings`, complementos como filmes reais — DEC-025) executados. Campo `tecnologias` de `filmes` removido antes de qualquer uso (DEC-026). Padrão de UI da Biblioteca definido: `PainelDetalheObra`/`PainelSimples` somente leitura + menu "⋯" (DEC-027).
- **2026-07-18** — Biblioteca v2 B4 (Mangás — DEC-028), B5 (Livros — DEC-029), B6 (Podcasts — DEC-030) desenhados, executados e com frontend gerado. Fecha o frontend das 6 sub-fases da Biblioteca. 2 bugs corrigidos: tipos `Update` vs `Input` para toggles simples (ver DATABASE.md → Gotchas); `AnotacoesLivroEditor.tsx` sobrescrito por engano com lógica de `VolumesEditor.tsx`, restaurado.
- **2026-07-19** — v1 aposentada, `frontend-v2/` renomeada para `frontend/`, único frontend ativo (DEC-031). Cutover de infra Vercel: projeto recriado, env vars configuradas, `middleware.ts` renomeado para `proxy.ts` (bug real: `@supabase/ssr` incompatível com Edge Runtime — ver ARCHITECTURE.md). Deploy concluído, teste de login pendente de confirmação final. Biblioteca v2: decisão de consolidar as 6 rotas numa página única com sidebar por categoria (DEC-032) — código pendente, ver TASKS_NOW.md.
- **2026-07-19 (cont.)** — DEC-032 executada via Cline+DeepSeek: `Sidebar.tsx` genérico, `app/biblioteca/layout.tsx` (2/9+7/9) e `app/biblioteca/page.tsx` consolidados; conteúdo das 6 rotas antigas migrado para `app/biblioteca/_components/*Section.tsx`; 6 rotas antigas removidas. `lib/*.ts`, painéis de detalhe e editores de listas aninhadas 100% reaproveitados sem alteração. Bug real encontrado ao apagar as pastas antigas: `.module.css` das 6 categorias tinha ficado nas pastas de rota antigas (`filmes/`, `series/`) em vez de `_components/` — resolvido criando `BibliotecaSection.module.css` compartilhado e trocando o import nas 6 Sections.
- **2026-07-20** — Redesign visual completo da Biblioteca + nova identidade visual do sistema inteiro (DEC-034). Usuário trouxe referência real (export do Figma Make: `theme.css` + `App.tsx`), usada como fonte da verdade de cor e estrutura em vez de aproximação. Paleta trocada de verde-limão para dourado/âmbar via `globals.css` — cascateia pra todo o sistema por já usar CSS Modules com variáveis. `Sidebar` ganhou faixa de perfil com imagem de fundo, avatar com anel dourado, badge de contagem só no item ativo. `BibliotecaBanner` reescrito com hero de 168px, prioridade de fundo (imagem estática do módulo → mosaico das capas reais do usuário → gradiente), sub-header fora do hero em fluxo normal (não fixo). `BibliotecaCard` reescrito: título 1 linha, ano+nota★ na mesma linha, 1 gênero, menu "⋯" só no hover. Nota migrada de escala 1-5 para 0-10 nos 6 formulários e nos painéis de detalhe (DEC-033, migration `014_nota_escala_dez.sql` confirmada executada pelo usuário). Contagem por categoria conectada via callback `onTotalCarregado` (Section → page.tsx → Sidebar). Dois bugs de estrutura JSX corrigidos pelo usuário durante a aplicação manual (key prop espalhada incorretamente; `<div>` do container sem fechamento ao trocar por Fragment). Integração de APIs externas (TMDB/Google Books/Jikan/iTunes) explicitamente adiada como próxima tarefa de escopo, não incluída neste redesign.

### Pendências ativas
Ver `TASKS_NOW.md` para o que está em aberto agora. Ver `BACKLOG.md` para polimento não bloqueante (gráficos, upload de imagem, reordenação etc.).

- **2026-07-20** — Planejamento de Estudos v2 (Fase 1/núcleo, DEC-035): rascunho amplo do usuário analisado, 3 sobreposições identificadas com módulos existentes/planejados (checklist de revisão duplicando SM-2; calendário próprio duplicando Agenda; Cursos/Flashcards como escopo de produto à parte). Escopo fasado com o usuário: núcleo cobre matérias (mantidas), conteúdos, anotações, materiais, sessões de estudo com tempo, questões individuais, simulados e redação leve — todas como tabelas novas, substituindo as equivalentes da v1 a pedido do usuário. Revisão de conteúdo reaproveita `revisao_espacada` existente como lembrete (não flashcard). Migration `015_estudos_v2.sql` gerada, execução pendente. Fase 2 (Cursos, Flashcards/Anki, Redação versionada, Calendário próprio, metas/streak, estatísticas avançadas) registrada em `BACKLOG.md`, não descartada.

- **2026-07-23** — Estudos v2 Fase 1B (DEC-036): sessão de perguntas e respostas detalhou o funcionamento real de ENEM (dia de prova com gabarito questão-a-questão, separado de simulado informal por conteúdo que alimenta SM-2), Escola (atividades, provas, conteúdo compartilhado com ENEM) e Curso (hierarquia Curso → Módulo → Aula). Migration `015_estudos_v2.sql` confirmada executada pelo usuário (2026-07-22). Migration `016_estudos_v2_fase1b.sql` gerada: `conteudos` passa a N:N com `materias` via `conteudos_materias`; novas tabelas `modulos_curso`, `atividades`, `provas`; `questoes_individuais` ganha gabarito (`prova_uuid`/`numero`/`motivo_erro`); `simulados` ganha `conteudo_uuid` (dispara SM-2) e `redacao_uuid`; `redacoes` ganha 5 notas de competência; `materias` ganha campos de Curso. Pesquisa confirmou ausência de API pública do YPT (Yeolpumta) — integração automática de tempo estudado descartada por ora, mesmo raciocínio de DEC-009.

- **2026-07-23 (cont.)** — Migration `016_estudos_v2_fase1b.sql` executada e confirmada pelo usuário no Supabase. Cline+DeepSeek desativado do projeto (ver PROJECT_PRINCIPLES.md) — Claude passa a gerar código diretamente. Camada de dados da Fase 1B gerada em bloco único (exceção consciente à disciplina schema-first, pois o usuário não pôde testar no momento — ver nota em DECISIONS.md): `lib/materias.ts` (estendido com campos de curso), `lib/conteudos.ts` (com N:N via `conteudos_materias`), `lib/modulos-curso.ts`, `lib/atividades.ts`, `lib/provas.ts`, `lib/questoes-individuais.ts` (gabarito digital em lote), `lib/simulados.ts` (dispara SM-2 quando vinculado a conteúdo), `lib/redacoes.ts` (com notas por competência). Aplicados pelo usuário. Pendência identificada e não resolvida nesta sessão: `lib/simulados.ts` depende de `avaliarCard`/`lib/revisao.ts`, inexistente na v2 (Revisão Espaçada v2 ainda não planejada, sub-fase 7.4) — bloqueia build até resolução.

- **2026-07-25** — Estudos v2: dependência bloqueante resolvida. `lib/revisao.ts`
  criado (não existia na v2) com `calcularSM2`, `avaliarCard` e
  `avaliarCardPorConteudo`, desbloqueando `lib/simulados.ts` (que já importava
  `avaliarCard` de um arquivo inexistente). Assinatura conferida contra o
  código real de `lib/simulados.ts` fornecido pelo usuário (não assumida) —
  ajuste necessário: `sbErr(error, contexto)` recebe 2 parâmetros, não 1;
  `qualidade` é `number` puro, não union type literal.
  Primeira leva de frontend de Estudos v2 (Fase 1 + 1B) gerada em bloco,
  versão deliberadamente crua (sem estilização, decisão do usuário — design
  vem depois): `app/estudos/page.tsx` (hub), `app/estudos/enem/page.tsx`,
  `app/estudos/escola/page.tsx`, `app/estudos/curso/page.tsx`,
  `app/estudos/curso/[materiaUuid]/page.tsx` (Curso → Módulo → Aula),
  `app/estudos/materia/[materiaUuid]/page.tsx` (tela mais densa, compartilhada
  entre ENEM/Escola: conteúdos, provas, atividades, questões avulsas,
  simulados), `app/estudos/redacoes/page.tsx`. Leva seguinte adicionou
  `app/estudos/enem/gabarito/[provaUuid]/page.tsx` (lançamento em lote do
  gabarito ENEM por área) e ações de apagar (conteúdo/atividade/prova) +
  vínculo cru de conteúdo compartilhado (`vincularConteudoAMateria` via
  prompt, sem seletor — pendência de UI). Navegação decidida como **rota
  real** (não `useState`/DEC-032) — usuário confirmou explicitamente que
  entra num mundo (ENEM/Escola/Curso), usa, e volta pro hub pra escolher
  outro. Todos os 11 arquivos aplicados pelo usuário sem erros.
  `materiais_estudo`, `anotacoes_estudo` e `sessoes_estudo` ficaram sem
  página nesta leva — schema existe, UI não foi gerada.
- **2026-07-25 (cont.)** — Exploração de design de Estudos v2.
  3 rodadas de prompt geradas: (1) prompt único cobrindo as 8 telas
  (excedeu 5.000 caracteres do limite do Figma, refeito compacto); (2) prompt
  compacto único (~3.900 caracteres); (3) reescrito como 8 prompts
  independentes, um por tela, sem instrução de cor/estilo (só lógica/estrutura),
  a pedido do usuário pra deixar o Figma mais livre. Usuário testou o prompt 1
  (Hub) no Figma Make e gostou da direção, mas achou os 3 mockups HTML/CSS
  cru gerados por Claude (lista, cards, sidebar) ainda distantes da visão
  desejada — 3 refinamentos adicionais gerados em cima do mockup "lista"
  (escolhido pelo usuário), agora usando os tokens reais de `DESIGN.md`
  (paleta dourado/âmbar, tipografia). Figma atingiu limite de uso do usuário;
  fluxo de design migrado para v0.dev. Os 8 prompts foram reescritos num
  formato adaptado pra geração de UI React/Next.js (cabeçalho padrão pedindo
  mock data e nenhuma lógica real, reforço de escopo por página, states
  explícitos, nota de Design System consistente entre páginas) e entregues
  como `.zip`. Usuário está rodando os prompts no v0.dev aos poucos (limite
  de geração da ferramenta) — 2 de 8 páginas prontas até agora. Combinado:
  conforme o v0 for entregando páginas, Claude adapta a estrutura/visual
  delas para o Next.js real do projeto (reaproveitando os `lib/*.ts`
  existentes) em vez de aplicar o código do v0 direto — os componentes
  gerados lá usam mock data solto, sem noção do schema real.

  ### Stack mista de estilização (DEC-038, 2026-07-25)
Desde a adoção do design gerado no v0.dev para Estudos v2, o projeto passou
a ter **duas stacks de estilização coexistindo conscientemente**:
- **Treino, Biblioteca, Dashboard:** CSS Modules puro (convenção original da v2, DEC-019)
- **Estudos:** Tailwind v4 + shadcn/ui (`components/ui/*`), DEC-038

`app/globals.css` é a fonte única de cor pros dois sistemas — variáveis
CSS Modules antigas (`--bg`, `--surface`, `--accent`...) e variáveis shadcn
(`--background`, `--card`, `--primary`...) coexistem no mesmo `:root`/`.dark`,
a maioria das antigas como alias direto das novas (ver DESIGN.md → Paleta).

**Toggle claro/escuro (DEC-039):** `components/ThemeProvider.tsx` +
`components/ThemeToggle.tsx`, controlado por classe `.dark` na tag `<html>`
(sem lib externa — contexto React + `localStorage`, script anti-flash
inline no `<head>` de `app/layout.tsx`). Vale pro sistema todo, **exceto
Biblioteca**, que fica com tema dourado fixo via classe `.bibliotecaTheme`
aplicada em `app/biblioteca/layout.tsx` (sobrescreve as variáveis
localmente, ganha de qualquer `.dark` herdada).

- **2026-07-26** — Estudos v2: infraestrutura de design adotada. Duas
  primeiras telas geradas no v0.dev (Hub, ENEM/Gabarito, Escola) aprovadas
  visualmente pelo usuário — decisão de manter a stack Tailwind v4 +
  shadcn/ui gerada por padrão, em vez de portar pra CSS Modules (DEC-038),
  puxando parcialmente pra frente o item de Tailwind que estava registrado
  em `BACKLOG.md` como "v3, futuro distante". Paleta do v0.dev (verde-oliva/
  off-white) adotada como padrão do sistema — Dashboard, Treino e Estudos —
  substituindo o dourado da DEC-034, que fica como exceção só da Biblioteca
  (DEC-037). Toggle claro/escuro real implementado no sistema inteiro exceto
  Biblioteca (DEC-039, `ThemeProvider`/`ThemeToggle` próprios, sem lib
  externa). `app/globals.css` mesclado: dois vocabulários de variável (CSS
  Modules antigo + shadcn novo) coexistindo, maioria das variáveis antigas
  como alias das novas — única fonte de verdade de cor. Conteúdo de
  `shadcn/dist/tailwind.css` colado direto no `globals.css` (variantes
  `data-*` e keyframes de accordion) em vez de manter `shadcn` como
  dependência do projeto — é só uma CLI, não usada em runtime. Setup
  testado (`npm install` + `npm run dev`, sem erros). Próximo passo: gerar
  as 4 páginas do zip do v0 com mock data pra validação visual, antes de
  conectar aos `lib/*.ts` reais de Estudos.

  - **2026-07-27** — Estudos v2: Hub, ENEM e Gabarito Digital restilizados com
  os componentes `study/*`/`ui/*` gerados pelo v0.dev (Tailwind v4 +
  shadcn/ui + Base UI), aplicados via Cline+DeepSeek em cima das páginas
  reais já existentes — lógica de dados 100% preservada, nenhuma chamada a
  `lib/*.ts` alterada. v0.dev entregou só 2 de 8 telas antes de atingir
  limite de geração (Hub confirmado; ENEM e Gabarito construídos mas não
  testados pelo próprio v0; Escola foi iniciada e descartada desta leva —
  incompleta). `SubjectManager` integrado na página ENEM, exigindo correção
  própria: o componente vindo do v0 mantinha estado interno via `useState`
  duplicando a prop de matérias — corrigido para componente controlado
  (fonte da verdade é a página pai). Durante os testes, 3 bugs reais foram
  encontrados e corrigidos, nenhum deles causado por esta restilização:
  (1) `lib/supabase.ts` — `sbErr()` e `softDelete()` com assinatura
  incompatível com o resto do projeto, gerando 37 erros de TypeScript em 9
  arquivos de Estudos + 15 callers de Biblioteca corrigidos em cascata;
  (2) pasta de rota `app/estudos/materia/[materialUuid]/` com erro de
  digitação desde a geração original (Fase 1B), travando a página em
  "Carregando..." permanentemente sem erro visível — corrigida a causa raiz
  (rename de pasta), não só o sintoma; (3) cache `.next/` desatualizado após
  o rename de pasta, exigindo limpeza manual (`rm -rf .next`) e restart
  limpo do `npm run dev` — Fast Refresh sozinho não bastou.
  Pendência aberta: `SubjectManager` exibe contagem de conteúdos e taxa de
  acerto como `0` fixo (placeholder), já que a página ENEM não carrega esses
  dados reais ainda — resolver em leva futura.

  - **2026-07-31** — Estudos v2: as 4 telas restantes restilizadas (Escola,
  Curso — lista e detalhe —, Redações, Matéria/detalhe), fechando as 8 telas
  do módulo com o design Tailwind v4/shadcn (`components/study/*`, `ui/*`)
  iniciado em 2026-07-27. Mesmo tratamento das telas anteriores: só
  visual/estrutura aproveitado, lógica de dados 100% dos `lib/*.ts` reais.

  **Contexto da leva de origem:** após ~1 semana sem atividade no projeto, o
  usuário pediu ao v0.dev pra continuar de onde parou; o limite de geração
  havia resetado, e o agente gerou sozinho, sem revisão prévia, as 5 telas
  que faltavam de uma vez — incluindo um data layer mockado próprio
  (`lib/study-data.ts`) e rotas fora da convenção do projeto (`/materia/[id]`,
  `/curso`, `/escola`, `/redacoes`, sem prefixo `/estudos/` nem os UUIDs
  nomeados corretamente). Nenhum desses artefatos foi usado — mesmo
  princípio já aplicado a toda geração do v0.dev (DEC-034/038): só
  visual/estrutura, nunca dado mockado nem decisão estrutural.

  **Decisões tomadas durante a adaptação:**
  - `GradeManager` do v0 (notas por avaliação com peso, nota máxima
    customizável, média ponderada calculada no client) **descartado por
    completo** na tela de Matéria — não existe schema equivalente (`provas`
    só tem uma `nota` por prova, sem peso). Ideia registrada em
    `BACKLOG.md` como possibilidade futura, não perdida.
  - Seção de "materiais de apoio" do mock de Matéria também descartada —
    não existe `lib/materiais-estudo.ts`; `materiais_estudo` segue sem
    página (pendência já registrada, ver `TASKS_NOW.md`).
  - Curso (detalhe): toggle de aula agora marca/desmarca concluída (o crú
    original só marcava) — melhoria de UX trivial, sem mudança de schema,
    dentro do escopo da restilização.
  - Curso (lista): barra de progresso mostra só 0%/100% (`concluido`), não
    o cálculo granular do mock do v0 — buscar contagem de aulas de todos os
    cursos na tela de lista teria custo desproporcional; o progresso
    detalhado continua disponível na tela de detalhe.

  Todos os 5 arquivos testados localmente: `tsc --noEmit` limpo, navegação e
  CRUD confirmados manualmente pelo usuário em ambiente de desenvolvimento.
  **Teste em produção (Vercel) ainda pendente** — nenhuma das 8 telas de
  Estudos foi validada fora do `localhost` até agora.

  - **2026-08** — Estudos v2: sessão extensa de correção pós-restilização,
  motivada pelo usuário revisando o resultado contra o que havia sido
  originalmente planejado (dois documentos de referência trazidos: rascunho
  original "Módulo Estudos" e uma auditoria prévia "Especificação — módulo
  Estudos" gerada em outra conversa). Diagnóstico: várias decisões da leva
  anterior seguiram estrutura importada do v0.dev/Figma em vez de
  questionar se batia com o domínio real do ENEM — indo contra a regra já
  estabelecida (do v0 só se aproveita visual, nunca lógica/estrutura).

  **Correções de modelagem, em ordem:**
  1. Hierarquia real confirmada por pesquisa (Inep): ENEM tem 4 áreas fixas
     (Linguagens, Humanas, Natureza, Matemática — não a lista solta
     cadastrada antes), cada dia com 90 questões numeradas 1-90 (não
     corrido 1-180), Linguagens/Humanas no dia 1 (1-45/46-90),
     Natureza/Matemática no dia 2, mesma numeração. Redação não é área nem
     matéria — vira tile de navegação separado.
  2. `materia.tipo` perde `'enem'`/`'escola'`, ganha `'academica'`; matéria
     é linha única com `mostra_escola`/`mostra_enem` (booleans) — reverte
     um erro de modelagem cometido e corrigido na mesma sessão (matéria
     havia sido duplicada em duas linhas por engano). Migration `018`
     limpa o dado de teste duplicado em cascata. Ver DEC-040.
  3. Gabarito ENEM reformulado pra 2 fases reais: lançar (grade visual tipo
     cartão-resposta, só a letra, sem matéria) e corrigir (linha a linha,
     matéria+conteúdo+dificuldade+motivo em toda questão, não só erradas).
     `acertou` sempre derivado (nunca campo manual); letra em branco
     detectada automaticamente, nunca escolhida manualmente. Prova ENEM
     também deixou de poder ser criada dentro da tela de Matéria (bug
     encontrado pelo usuário) — só existe em `/estudos/enem`. Ver DEC-041.
  4. `conteudos.progresso` (número solto, "+25%" sem critério) removido,
     substituído por `teoria_vista` (primeiro contato) + `dominado_manual`
     (override); "dominado" de fato é calculado
     (`dominado_manual OR revisao_espacada.repeticoes >= 5`), sem
     duplicar contagem que o SM-2 já faz. Ver DEC-042.
  5. Card "Revisões pendentes" adicionado ao Hub de Estudos — pedido de
     visibilidade rápida do usuário. Pedido de agendamento com
     horário/duração próprio dentro de Estudos foi recusado, por já ser
     escopo do módulo Agenda (reafirma DEC-035). Ver DEC-043.
  6. Redação ganhou upload de imagem (`imagem_path`, bucket novo `redacoes`)
     e `texto` virou opcional — permite registrar a redação com foto da
     folha manuscrita, sem digitar. Campo de observação/correção do
     professor (`comentario`) exposto só na edição, por decisão do
     usuário (normalmente não existe ainda na criação).

  **Migrations executadas:** `017_estudos_gabarito_enem_redacao.sql`,
  `018_materias_unicas_escola_enem.sql`,
  `019_gabarito_dominio_dificuldade.sql` — todas confirmadas pelo usuário no
  Supabase.

  **Arquivos alterados:** `lib/materias.ts`, `lib/conteudos.ts`,
  `lib/questoes-individuais.ts`, `lib/provas.ts`, `lib/revisao.ts`,
  `lib/redacoes.ts` (trocado de chamada direta `sb.storage` pros helpers
  `uploadFile`/`getSignedUrl`/`deleteFile` já existentes em
  `lib/supabase.ts`, por consistência — só percebido depois de ler o
  arquivo real via acesso ao repositório), `app/estudos/page.tsx`,
  `app/estudos/enem/page.tsx`, `app/estudos/enem/[area]/page.tsx` (nova
  rota), `app/estudos/enem/gabarito/[provaUuid]/page.tsx`,
  `app/estudos/escola/page.tsx`, `app/estudos/curso/page.tsx`,
  `app/estudos/curso/[materiaUuid]/page.tsx`,
  `app/estudos/materia/[materiaUuid]/page.tsx`. `npx tsc --noEmit` limpo
  ao final. Teste manual no navegador ainda em andamento pelo usuário no
  momento desta entrada.

  **Mudança de processo relevante:** usuário conectou o repositório
  (`github.com/GabrielGmp13/05-Sistema-Pessoal`) como público — a partir
  desta sessão, Claude pode ler arquivos reais do projeto diretamente via
  clone, em vez de depender exclusivamente de cópia manual colada pelo
  usuário. Reduz risco de assinatura assumida incorretamente.

- **2026-08 (cont.)** — **Auditoria de migração para o Codex e reconciliação
  completa da documentação.** Preparação para adotar Codex CLI como agente
  de execução de código (Claude segue como arquiteto/documentador via chat).
  Codex rodou uma auditoria completa do repositório (estrutura, stack,
  divergências entre documentação e código, estado do Git) sem alterar
  nenhum arquivo. Principais achados e resolução:
  1. **Migrations `004`, `005`, `007`, `010`, `014`, `019` nunca foram
     copiadas para o VS Code** (falha de cópia manual, confirmado pelo
     usuário — não foi perda de dado, todas estavam executadas no Supabase).
     Usuário extraiu um dump real do schema de produção via Supabase CLI
     (`supabase db dump`, exigiu instalar Docker) e forneceu o arquivo
     (`schema_real.sql`). As 6 migrations foram reconstruídas a partir do
     dump e adicionadas de volta a `backend/supabase/migrations/`.
  2. **`015_estudos_v2.sql` e `016_estudos_v2_fase1b.sql` locais estavam com
     conteúdo corrompido** (referências circulares entre tabelas — provável
     colagem incorreta em sessão de chat anterior). Confirmado, comparando
     contra o dump real, que **o banco de produção nunca teve esse
     problema** — só a cópia no repositório estava malformada. Ambos os
     arquivos foram reescritos para bater exatamente com o schema real,
     reordenando a criação de `modulos_curso` para antes do vínculo em
     `conteudos` (a versão corrompida referenciava a tabela antes dela
     existir).
  3. **`DATABASE.md` reconciliado linha a linha contra o dump real:**
     `conteudos` e `questoes_individuais` estavam documentadas de forma
     desatualizada (mostravam `progresso`/`materia_uuid NOT NULL`/`acertou
     NOT NULL` quando o schema real já refletia DEC-041/042 há semanas —
     `materia_uuid` nullable, `acertou` nullable, `letra_marcada`/
     `letra_correta`/`dificuldade` presentes). Dois gotchas novos
     descobertos no dump: `materias.user_id` é a única FK do projeto sem
     `ON DELETE CASCADE`; `materias.tipo` nunca teve `CHECK constraint`.
  4. **`DECISIONS.md` corrigido:** `014` e `015` estavam marcadas "execução
     pendente" havia semanas depois de já confirmadas; DEC-032 estava
     marcada "código pendente" apesar de implementada desde 2026-07-19.
  5. **`ARCHITECTURE.md` reescrito por completo** — descrevia partes da v1
     (HTML puro, `window.sb`, `sm2.js`) como arquitetura atual e afirmava
     "deploy do Vercel ainda não feito" (deploy real é de 2026-07-13).
     Também documentado, por inspeção real do código: nenhuma
     `app/api/**/route.ts` existe ainda; `confirm()` nativo confirmado em 9
     arquivos e 10 ocorrências (não só "algumas telas"); `window.prompt()` confirmado em
     Estudos; SM-2 vive em `lib/revisao.ts` (TypeScript), não `sm2.js`.
  6. **`BACKLOG.md` estava com todo o conteúdo duplicado** a partir da
     metade do arquivo (cópia mais antiga colada junto da versão atual) —
     deduplicado, preservando os 2 itens que só existiam na cópia antiga.
  7. **`ROADMAP.md` corrigido:** cabeçalho da Fase M se contradizia ("EM
     ANDAMENTO" no título, "CONCLUÍDA" no corpo); marcadores de diff (`+`)
     deixados por engano no meio do texto da Fase 7; status de Biblioteca/
     Estudos desatualizado (Fase 4 ainda marcada "EM ANDAMENTO" apesar de
     completa há muito tempo).
  8. **`VISION.md` corrigido:** Dashboard estava marcado "✅ Implementado
     (`index.html`)" — a rota `/` real da v2 é uma tela técnica de
     diagnóstico, não um dashboard funcional (confirmado por inspeção do
     código). Referências a `documentos_estudo` (tabela removida)
     trocadas por `materiais_estudo` (equivalente real em v2).
  9. **`TASKS_NOW.md`, `MODULE_TEMPLATE.md`, `PROJECT_PRINCIPLES.md`,
     `NAMING_CONVENTIONS.md`, `COMMIT_CONVENTIONS.md`, `AI_CONTEXT.md`**
     ajustados pontualmente: caminhos de arquivo corrigidos
     (`backend/supabase/migrations/`, não `supabase/migrations/`;
     documentação em `docs/`, não na raiz), papel de "codificador
     principal" deixou de ser amarrado a uma ferramenta específica
     (Claude + Codex convivendo), status "versão crua" de Estudos
     atualizado para refletir a restilização já concluída, exemplos de
     nome de coluna/tabela trocados para os nomes reais atuais (v1 tinha
     `assunto_uuid`/`documento_uuid`, não existem mais).
  10. **`package.json`** (achado, correção ainda pendente de aplicação):
      dependência `shadcn` não deveria estar listada (é CLI, não lib de
      runtime) e `name` ainda é `"frontend-v2"`. Registrado em
      `TASKS_NOW.md`/`BACKLOG.md` para correção na próxima sessão de código.

  Nenhuma alteração foi commitada diretamente — todos os arquivos corrigidos
  (documentação + 6 migrations reconstruídas + 2 migrations reescritas)
  foram entregues como arquivos completos para o usuário revisar e aplicar
  manualmente, seguindo a disciplina de sempre.

- **2026-08 (reconciliação final)** — Nova conferência independente do
  `schema_real.sql` confirmou 44 tabelas em `public`, todas com RLS, policy
  `user_own_data` e GRANT para `authenticated`; o número 46 era erro manual
  propagado entre documentos, não tabela ausente. Corrigida também a dívida
  de `confirm()` para 9 arquivos/10 ocorrências, os status atuais em
  `DECISIONS.md` e `TASKS_NOW.md`, e a contagem atual de 9 rotas de página em
  Estudos. O dump não inclui o inventário de Storage: a documentação agora
  distingue buckets provisionados em migration, criação manual instruída e
  nomes apenas planejados. Registrado também que as migrations reconstruídas
  refletem o estado final; naquele momento, a cadeia `001`–`019` ainda
  aguardava investigação. A conclusão posterior foi arquivá-la como acervo não
  reproduzível e criar as três baselines timestamped validadas.

- **2026-08-07 (preparação e conclusão local do STOP 3)** —
  Supabase CLI `2.112.0` fixada em um manifesto próprio de ferramentas em
  `backend/`; `backend/supabase/config.toml` criado por `supabase init`, sem
  link ou credenciais de produção. A primeira tentativa de `supabase start`
  foi interrompida por falta de espaço; após liberação de 9 GB e reinício
  limpo do Docker, o stack iniciou. Dois `db reset --local --no-seed`
  consecutivos aplicaram as três migrations sem erro. Testes transacionais
  confirmaram contagens, grants, RLS, guard, cinco buckets, 14 policies e
  isolamento entre usuários/primeira pasta. O dump `public` local ficou
  equivalente ao remoto, exceto por defaults/extensões da plataforma. Nenhuma
  migration foi alterada e nenhuma operação remota foi executada.

- **2026-08-07 (ensaio remoto descartável de adoção do histórico)** — A CLI
  estável `2.112.0` falhou em `supabase link` por incompatibilidade ao validar
  metadados de API keys. Sem fabricar estado de link, o ensaio foi retomado
  por conexão PostgreSQL direta e protegida. `migration list` mostrou três
  migrations locais e nenhuma remota; `migration repair --status applied`
  criou o histórico com exatamente as três versões sem executar baseline. O
  schema de aplicação e os buckets permaneceram ausentes, e `db push
  --dry-run` retornou banco atualizado, sem migrations pendentes. Nenhum dado
  de conexão ou identificador do ambiente descartável foi versionado.

- **2026-08-08 (adoção do histórico de migrations em produção)** — Produção
  foi recapturada por consultas somente leitura imediatamente antes da
  operação: PostgreSQL 17.6, 44 tabelas, 44 PKs, 92 FKs, 15 checks, 42 índices
  explícitos, 44 RLS/policies, cinco buckets, 14 policies Storage e guard de
  RLS equivalentes às baselines. Com histórico remoto inicialmente ausente,
  `migration repair --status applied --db-url` registrou somente
  `20260807000100`, `20260807000200` e `20260807000300`. Nenhum SQL de baseline
  foi executado e os objetos da aplicação permaneceram inalterados. A
  `migration list` final ficou alinhada e `db push --dry-run` retornou
  `upToDate=true`, `dryRun=true`, `migrations=[]`; nenhum push real ocorreu.
  Credenciais e metadata de vínculo não foram versionados. A partir deste
  marco, as três baselines são o início oficial e imutável da cadeia ativa;
  toda mudança futura será migration timestamped incremental (DEC-044).

- **2026-08-08 (handoff Claude → Codex e reprodutibilidade do repositório)** —
  O manifesto do frontend deixou o nome residual `frontend-v2`, a dependência
  de CLI `shadcn` sem lock foi removida e os lockfiles permaneceram sem upgrade
  oportunista. Node.js `24.15.0` e npm `12.0.1` foram fixados; `.env.example`,
  README raiz, README do frontend e CI mínima sem segredos foram adicionados.
  Uma instalação limpa adicionou 380 pacotes; typecheck e build passaram, com
  18 páginas de aplicação reconhecidas. Cinco warnings triviais de imports
  não usados foram corrigidos; o lint final mantém 43 achados em 33 arquivos
  (28 erros e 15 warnings) e permanece informativo na CI. Não há
  testes automatizados de frontend; a validação SQL local da baseline continua
  sendo a suíte existente. Foram removidos cinco SVGs padrão do Next e o CSS
  inicial órfão, todos sem referências. Nenhuma migration, snapshot, código de
  produto ou ambiente remoto foi alterado.
