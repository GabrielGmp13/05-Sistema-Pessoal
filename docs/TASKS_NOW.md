# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Biblioteca consolidada em página única + sidebar (DEC-032) e redesenhada visualmente (DEC-034), ambas concluídas pelo usuário.
**Bloqueio:** nenhum
**Próxima ação:** finalizar teste manual no navegador das correções de
2026-08 (matéria única, gabarito em 2 fases, domínio de conteúdo) — ver
CHANGELOG.md pra lista completa. Repositório conectado publicamente no
GitHub (`GabrielGmp13/05-Sistema-Pessoal`) — Claude já pode ler arquivos
reais em vez de depender de cópia colada.

---

## 🔴 Cutover v1 → v2 (DEC-031) — pendência antiga, ainda em aberto

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [ ] **Confirmar teste de login end-to-end na URL de produção** (pendente desde 2026-07-19, nunca formalmente confirmado pelo usuário)
- [ ] Confirmar navegação funcionando em `/treino` e em `/biblioteca` (rota consolidada, não mais `/biblioteca/filmes`) na URL de produção

## ✅ Biblioteca v2: consolidação em página única + sidebar (DEC-032) — concluída

Código gerado via Cline+DeepSeek em 2026-07-19, testado e ajustado pelo
usuário diretamente ao longo de várias sessões (correções de import quebrado,
key prop, estrutura de container). Usuário considera funcionalmente pronta.

- [x] `components/Sidebar.tsx` + `.module.css`
- [x] `app/biblioteca/layout.tsx` + `.module.css` (2/9 + 7/9)
- [x] `app/biblioteca/page.tsx` consolidado, sem navegação de rota
- [x] 6 `*Section.tsx` em `_components/`, cada uma com CSS Module próprio (`BibliotecaSection.module.css`, resolvendo a dependência frágil de `../filmes/page.module.css` que existia antes)
- [x] 6 rotas antigas removidas
- [x] `lib/*.ts` e componentes de painel/editores 100% reaproveitados
- [x] `/biblioteca/generos` confirmada intacta

## ✅ Nova identidade visual (DEC-034) — concluída

Paleta trocada de verde-limão pra dourado/âmbar em todo o sistema (não só
Biblioteca), baseada em referência real do Figma (export completo recebido
e usado como fonte da verdade de cores/estrutura). Ver `DESIGN.md` para os
valores finais e os 3 novos padrões de componente documentados (Sidebar com
perfil, Banner de categoria, Card de item).

- [x] `globals.css` com os novos tokens (`--bg`, `--surface`, `--accent`, etc.)
- [x] `Sidebar.tsx`/`.module.css` — faixa de perfil (78px), avatar com anel dourado, badge de contagem só no item ativo, fonte de item maior
- [x] `BibliotecaBanner.tsx`/`.module.css` — hero 168px com prioridade imagem estática → mosaico de capas reais → gradiente; título itálico; sub-header (contagem + botão) fora do hero, em fluxo normal
- [x] `BibliotecaCard.tsx`/`.module.css` — título 1 linha, ano+nota★ na mesma linha, 1 gênero principal, menu "⋯" só visível no hover
- [x] Nota migrada de escala 1-5 para 0-10 nos 6 formulários (DEC-033, migration `014` confirmada executada) — inputs e exibição no painel de detalhe atualizados
- [x] Contagem por categoria conectada (`onTotalCarregado` — cada Section avisa o total real pro `page.tsx`, que repassa pro badge da Sidebar)
- [x] Gap entre banner e sidebar corrigido (Banner movido pra fora do `.container` com padding)
- [ ] Imagens estáticas de `public/biblioteca/banners/*.jpg` — suporte pronto no código, imagens em si ainda não fornecidas pelo usuário (fallback de mosaico funcionando enquanto isso)
- [ ] Teste visual final de ponta a ponta nas 6 categorias, comparando com a referência do Figma — usuário sinalizou "creio que está tudo ok", sem checklist formal de confirmação ainda

## Próxima tarefa de escopo — Integração de APIs externas

Adiada explicitamente durante o redesign por ser feature grande, não ajuste
visual. Precisa de `MODULE_TEMPLATE.md` completo antes de começar:
- TMDB (filmes/séries) — única que precisa de API Route por causa da chave secreta (ver DEC-018)
- Google Books (livros), Jikan/MyAnimeList (mangás), iTunes Search (podcasts) — sem key, podem ser chamadas direto do client
- Animes: sem API própria definida ainda (Jikan cobre mangá, não anime — verificar se cobre também)

## Próximo módulo a planejar (v2)

- [ ] Definir se Estudos ou Revisão Espaçada entra primeiro
- [ ] Rodar `MODULE_TEMPLATE.md` completo antes de qualquer schema ou código
- [ ] Agenda (módulo dedicado) fica para depois — abordagem "camada por camada", DEC-031


## 🟢 Estudos v2 — Correção de modelagem pós-design (2026-08) — concluída, teste manual em andamento

- [x] Migration 017 (área ENEM, letra do gabarito, redação com imagem) executada
- [x] Migration 018 (matéria única, mostra_escola/mostra_enem, limpeza de dado duplicado) executada
- [x] Migration 019 (gabarito 2 fases, domínio de conteúdo, dificuldade) executada
- [x] `lib/materias.ts`, `lib/conteudos.ts`, `lib/questoes-individuais.ts`,
      `lib/provas.ts`, `lib/revisao.ts`, `lib/redacoes.ts` atualizados
- [x] Páginas de Estudos atualizadas (Hub, ENEM, área ENEM nova, Escola,
      Curso×2, Matéria, Gabarito) — `npx tsc --noEmit` limpo
- [ ] **Teste manual completo no navegador** — em andamento pelo usuário
- [ ] `SubjectManager`: `topics`/`accuracy` ainda fixos em 0 (pendência antiga, não tocada)
- [ ] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` — schema existe, sem página ainda (pendência antiga)
- [ ] Vínculo de conteúdo compartilhado ainda via `window.prompt` (pendência antiga)
## Pendências de polimento

Ver `BACKLOG.md` — `confirm()` nativo (Treino e Biblioteca), menu "⋯" não
fecha ao clicar fora, upload de capa/banner manual, edição de itens em


## 🔴 Estudos v2 — Fase 1 (núcleo) planejada, schema pendente de execução (DEC-035)

- [x] Escopo da Fase 1 fechado com o usuário (matérias/conteúdos/anotações/materiais/sessões de estudo/questões individuais/simulados/redação leve)
- [x] Reaproveitamento de `revisao_espacada` (SM-2) confirmado, sem checklist fixo paralelo
- [x] Migration `015_estudos_v2.sql` gerada
- [ ] **Executar migration no Supabase** — bloqueia geração de frontend (disciplina schema-first)
- [ ] Confirmar execução aqui
- [ ] Depois da confirmação: gerar `MODULE_TEMPLATE.md` preenchido + prompt de frontend (Cline)

 ## 🟢 Estudos v2 — Fase 1B: pendência bloqueante RESOLVIDA (2026-07-25)

- [x] `lib/revisao.ts` criado (não existia na v2) — `calcularSM2`,
      `avaliarCard`, `avaliarCardPorConteudo` — assinatura conferida contra
      `lib/simulados.ts` real, não assumida
- [x] `lib/simulados.ts` volta a compilar — build desbloqueado
- [x] Primeira leva de frontend gerada (versão crua, sem estilização):
      hub, ENEM, Escola, Curso (lista + detalhe), Matéria (ENEM/Escola),
      Redações, Gabarito digital ENEM, + ações de apagar
- [x] Todos os 11 arquivos aplicados pelo usuário — **sem erros encontrados**
- [ ] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` — schema
      existe, sem página ainda (próxima leva de funcionalidade, se for o caso)
- [ ] Vínculo de conteúdo compartilhado (`vincularConteudoAMateria`) só
      funciona via prompt pedindo UUID manual — precisa de seletor de
      verdade quando for pro design final
- [ ] `MODULE_TEMPLATE.md` preenchido pra Estudos v2 existe como arquivo
      solto (`MODULE_ESTUDOS_V2.md`, gerado 2026-07-25) — falta decidir onde
      ele mora de fato (seção em `ROADMAP.md` ou arquivo próprio permanente)

## 🟢 Estudos v2 — Design (Tailwind + shadcn, DEC-037/038/039) — Hub/ENEM/Gabarito restilizados e testados

- [x] Paleta nova (v0.dev) adotada como padrão do sistema, exceto Biblioteca (DEC-037)
- [x] Tailwind v4 + shadcn/ui adotado, escopo inicial: só Estudos (DEC-038)
- [x] Toggle claro/escuro real, sistema inteiro exceto Biblioteca (DEC-039)
- [x] `package.json`, `postcss.config.mjs`, `components.json`, `lib/utils.ts` — aplicados e testados
- [x] `app/globals.css` mesclado (dois vocabulários de variável + tema fixo da Biblioteca) — aplicado
- [x] `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx` — aplicados
- [x] `app/layout.tsx` com script anti-flash + provider — aplicado
- [x] `app/biblioteca/layout.tsx` com classe `.bibliotecaTheme` — aplicado
- [x] `components/ui/*` (10 arquivos) e `components/study/*` (7 arquivos) copiados pro projeto real via Cline+DeepSeek, a partir do zip gerado pelo v0.dev (Hub, ENEM, Gabarito — Escola só foi iniciado pelo v0, não usado)
- [x] `app/estudos/page.tsx` (Hub), `app/estudos/enem/page.tsx`, `app/estudos/enem/gabarito/[provaUuid]/page.tsx` restilizados via diff, preservando 100% da lógica de dados real (`lib/materias.ts`, `lib/provas.ts`, `lib/atividades.ts`, `lib/simulados.ts`, `lib/questoes-individuais.ts`)
- [x] `SubjectManager` integrado na página ENEM (Bloco 1), substituindo grid inline — corrigido para ser componente controlado (sem `useState` interno duplicando a prop `subjects`)
- [x] Teste end-to-end confirmado: adicionar matéria reflete na lista sem F5, clicar nela abre `/estudos/materia/[materiaUuid]` corretamente
- [x] **Pendência aberta, ainda não resolvida:** `SubjectManager` exibe `topics: 0` e `accuracy: 0` fixos (placeholder falso) em ENEM e agora também em Escola. Resolver quando fizer sentido buscar contagem de conteúdos/taxa de acerto por matéria.
- [x] Escola restilizada manualmente (2026-07-31) — sem esperar v0.dev, usando `components/study/*`/`ui/*` já existentes.
- [x] v0.dev resetou limite de geração numa sessão que Gabriel não acompanhou (~1 semana sem mexer no projeto) e entregou, sem supervisão prévia, 5 telas extras: Matéria (detalhe), Curso (lista), Curso (detalhe), Escola, Redações — com data mockada própria (`lib/study-data.ts`) e rotas fora do padrão do projeto (`/materia/[id]` em vez de `/estudos/materia/[materiaUuid]`, etc). Tratado com a mesma disciplina de sempre: só visual/estrutura aproveitado, mock data e rotas descartados, cada tela reescrita em cima dos `lib/*.ts` reais.
- [x] Curso (lista + detalhe) restilizado (2026-07-31) — `lib/modulos-curso.ts` + `lib/conteudos.ts` reais. Diferente do mock do v0, toggle de aula concluída agora funciona nos dois sentidos (marcar/desmarcar), não só marcar — melhoria trivial sem mudança de schema.
- [x] Redações restilizada (2026-07-31) — `lib/redacoes.ts` real, `somaCompetencias()` original preservada.
- [x] Matéria (detalhe) restilizada (2026-07-31) — decisão tomada: `GradeManager` do v0 (nota ponderada por avaliação, com peso e nota máxima customizável) **descartado por completo**, não existe no schema real. Tela mostra conteúdos (com progresso, vínculo N:N, +25%), provas por tipo, atividades (feita/entregue), questão avulsa e simulados (com disparo de SM-2) — tudo já existente em `lib/*.ts`. Seção de "materiais de apoio" do mock também descartada — não existe `lib/materiais-estudo.ts`, `materiais_estudo` segue sem página (mesma pendência já registrada abaixo).
- [x] Todas as 8 telas de Estudos v2 (Hub, ENEM, Gabarito, Escola, Curso×2, Matéria, Redações) restilizadas e testadas localmente (`tsc --noEmit` limpo + teste funcional manual). **Ainda não testado em produção.**


## ✅ Correção de tipos em `lib/supabase.ts` (sessão 2026-07-27)

- [x] `sbErr()` corrigida de `boolean` fixo para genérica (`<T = null>`), resolvendo 37 erros de TypeScript espalhados por `lib/atividades.ts`, `lib/conteudos.ts`, `lib/materias.ts`, `lib/modulos-curso.ts`, `lib/provas.ts`, `lib/questoes-individuais.ts`, `lib/redacoes.ts`, `lib/revisao.ts`, `lib/simulados.ts`
- [x] `softDelete()` corrigida de `Promise<{ error: unknown }>` para `Promise<boolean>` — 15 callers ajustados em cascata (Biblioteca: `animes*.ts`, `elenco.ts`, `filmes.ts`, `livros*.ts`, `mangas*.ts`, `openings-endings.ts`, `podcasts.ts`, `series*.ts`, `trilha-sonora.ts`)
- [x] `npx tsc --noEmit` confirmado limpo: 0 erros
- [x] Bug de rota corrigido: pasta `app/estudos/materia/[materialUuid]/` renomeada para `[materiaUuid]/` (erro de digitação desde a geração original), alinhando com o padrão usado no resto do projeto e resolvendo página travada em "Carregando..." indefinidamente