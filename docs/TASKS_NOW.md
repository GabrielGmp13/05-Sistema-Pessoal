# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Biblioteca consolidada em página única + sidebar (DEC-032) e redesenhada visualmente (DEC-034), ambas concluídas pelo usuário.
**Bloqueio:** nenhum
**Próxima ação:** (1) confirmar teste de login end-to-end na URL de produção do Vercel — pendência mais antiga do projeto, nunca fechada; (2) fornecer as imagens estáticas de banner por categoria e/ou popular `avatar_url`/`background_url` do usuário no Supabase Auth (opcional, tem fallback); (3) planejar integração de APIs externas (TMDB/Google Books/Jikan/iTunes) como próxima tarefa de escopo, via `MODULE_TEMPLATE.md`; (4) executar `015_estudos_v2.sql` no Supabase e confirmar — depois disso, gerar MODULE_TEMPLATE.md completo + prompt de frontend para Estudos v2 (Fase 1)

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

 ## 🔴 Estudos v2 — Fase 1B: ENEM/Escola/Curso detalhados (DEC-036)

- [x] Estrutura de ENEM (dia de prova + gabarito + simulado de conteúdo) desenhada com o usuário
- [x] Estrutura de Escola (atividades, provas, conteúdo compartilhado) desenhada
- [x] Estrutura de Curso (Curso → Módulo → Aula) desenhada
- [x] Migration `016_estudos_v2_fase1b.sql` gerada
- [x] **Executar migration `016` no Supabase** — confirmado pelo usuário (2026-07-23), sucesso
- [x] Camada de dados (`lib/`) gerada diretamente por Claude (Cline desativado do projeto, ver PROJECT_PRINCIPLES.md): `lib/materias.ts` (estendido), `lib/conteudos.ts`, `lib/modulos-curso.ts`, `lib/atividades.ts`, `lib/provas.ts`, `lib/questoes-individuais.ts`, `lib/simulados.ts`, `lib/redacoes.ts` — arquivos aplicados pelo usuário no projeto
- [ ] ⚠️ **Pendência bloqueante não resolvida:** `lib/simulados.ts` importa `avaliarCard` de `lib/revisao.ts`, que **não existe na v2** ainda (Revisão Espaçada v2 é sub-fase 7.4, "a planejar" — ver ROADMAP.md). Build quebra até isso ser resolvido. Duas opções levantadas, nenhuma escolhida: (a) comentar a chamada com TODO por enquanto, (b) criar `lib/revisao.ts` mínimo já nesta sessão seguinte, só com `avaliarCard`
- [ ] Gerar páginas (dashboards ENEM/Escola/Curso, gabarito digital com timer, tela de matéria) — próximo passo, depende de resolver a pendência acima primeiro
- [ ] Gerar `MODULE_TEMPLATE.md` preenchido cobrindo `015` + `016` juntas (ainda não feito — pulamos direto pra código por indisponibilidade do usuário pra testar, ver nota de exceção em DECISIONS.md)
**Explicitamente fora de escopo (ver DEC-036), não registrado em BACKLOG.md por serem descartados, não adiados:** TRI estimado, peso por curso pretendido no ENEM, avaliação pessoal/expiração de acesso do curso, nível de confiança do conteúdo, boletim agregado, frequência/faltas.

 **Adiado pra polimento (Fase 2, `BACKLOG.md`):** horário semanal de aula, calendário de provas por semana.