# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Biblioteca consolidada em página única + sidebar (DEC-032) e redesenhada visualmente (DEC-034), ambas concluídas pelo usuário.
**Bloqueio:** nenhum
**Próxima ação:** gerar as 4 páginas de Estudos v2 (Hub, ENEM, Gabarito, Escola) com mock data do zip do v0.dev, pra validação visual do Tailwind/toggle dentro do projeto real — ver seção "Estudos v2 — Design (Tailwind)" abaixo. Pendências antigas (login e2e Vercel, imagens de banner, integração de APIs externas) continuam em aberto, sem prioridade nesta sessão.

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

## 🟡 Estudos v2 — Design (Tailwind + shadcn, DEC-037/038/039) — infra concluída

- [x] Paleta nova (v0.dev) adotada como padrão do sistema, exceto Biblioteca (DEC-037)
- [x] Tailwind v4 + shadcn/ui adotado, escopo inicial: só Estudos (DEC-038)
- [x] Toggle claro/escuro real, sistema inteiro exceto Biblioteca (DEC-039)
- [x] `package.json`, `postcss.config.mjs`, `components.json`, `lib/utils.ts` — aplicados e testados (`npm install` + `npm run dev` sem erro)
- [x] `app/globals.css` mesclado (dois vocabulários de variável + tema fixo da Biblioteca) — aplicado
- [x] `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx` — aplicados
- [x] `app/layout.tsx` com script anti-flash + provider — aplicado
- [x] `app/biblioteca/layout.tsx` com classe `.bibliotecaTheme` — aplicado
- [ ] **Próximo:** gerar as 4 páginas do zip do v0 (Hub, ENEM, Gabarito, Escola) + `components/study/*`/`components/ui/*`, com o mock data que já vem nelas — validação visual antes de conectar dado real
- [ ] Depois da validação visual: trocar mock data pelos `lib/*.ts` reais (`materias.ts`, `conteudos.ts`, `provas.ts`, `atividades.ts`, `simulados.ts`, `redacoes.ts`, `questoes-individuais.ts`) — preciso do conteúdo real desses arquivos antes, sem assumir assinatura
- [ ] v0.dev ainda tem 4 de 8 telas pendentes de geração (limite de uso do usuário) — integrar conforme forem saindo

---