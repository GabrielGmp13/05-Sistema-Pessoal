# TASKS_NOW.md

Tarefas ativas e próximas ações. Ideias não priorizadas vivem em `BACKLOG.md`, histórico de tarefas concluídas vive em `CHANGELOG.md` — não aqui.

---

## Status geral
**Fase atual:** Fase 7 (v2) — v1 aposentada (DEC-031), `frontend/` é o único frontend ativo. Hub inicial v2, navegação global e logout visível implementados; Biblioteca e Treino v2 funcionalmente prontos; Estudos v2 com 9 rotas de página implementadas e restilizadas, correções de modelagem de 2026-08 aplicadas.
**Bloqueio:** nenhum bloqueio de banco conhecido para publicar o lote Biblioteca Vídeos/Artigos + Vídeo → Curso.
**Banco:** produção está alinhada até `20260811000300_conteudos_video.sql`; aplicação e pós-check remoto concluídos em 2026-08-12.
**Reprodutibilidade:** consolidada em 2026-08-08 — toolchain fixado, `npm ci`, typecheck e build aprovados, CI mínima criada; lint mantém dívida conhecida.
**Próxima ação:** realizar os testes manuais detalhados e o polimento visual fino na etapa final.

---

## 🔴 Cutover v1 → v2 (DEC-031) — pendência antiga, ainda em aberto

- [x] Pasta renomeada `frontend-v2/` → `frontend/`
- [x] Projeto Vercel antigo deletado, projeto novo criado com Root Directory `frontend`
- [x] Environment variables configuradas
- [x] Deploy realizado (confirmado: 2026-07-13)
- [x] Supabase → Auth → URL Configuration atualizado para a nova URL
- [x] Hub inicial v2 com navegação para `/treino`, `/biblioteca`, `/estudos` e logout visível implementado localmente (2026-08-09)
- [x] **Teste de login end-to-end na URL de produção confirmado pelo usuário** (2026-08-09)
- [x] Hub `/` validado em produção pelo usuário (passou; polimento do hub fica para etapa futura)
- [x] Navegação funcionando em produção para `/treino`, `/biblioteca` e `/estudos` (2026-08-09)
- [x] Logout validado em produção pelo usuário (2026-08-09)
- [x] Problemas observados no smoke test online: nenhum relatado pelo usuário

## Hub operacional v2

- [x] Resumo de tempo estudado hoje, na semana atual e no mês atual usando `sessoes_estudo`
- [x] Compromissos e provas pendentes do dia exibidos sem duplicar dados da Agenda/Estudos
- [x] Revisões vencidas e para hoje exibidas com acesso direto a `/revisao`
- [x] Loading, falha parcial, estado vazio e atualização manual implementados
- [ ] Validar visualmente o Hub com dados reais em desktop e mobile na etapa final

## Integrações externas futuras

Precisa de `MODULE_TEMPLATE.md` completo antes de começar. Confirmado por
inspeção do código (2026-08): **nenhuma `app/api/**/route.ts` existe ainda**
no projeto — esta será a primeira.
- TMDB (filmes/séries) — única que precisa de API Route por causa da chave secreta (ver DEC-018)
- Google Books (livros), Jikan/MyAnimeList (mangás), iTunes Search (podcasts) — sem key, podem ser chamadas direto do client
- Animes: sem API própria definida ainda (Jikan cobre mangá, não anime — verificar se cobre também)

## Ordem dos próximos módulos (v2)

- [x] Revisão Espaçada dedicada vem antes de Agenda; página `/revisao` implementada sobre o SM-2 existente, sem migration (2026-08-11)
- [x] Agenda definida como dona do cronograma e planejamento temporal; Estudos continua dono das entidades acadêmicas (2026-08-11)
- [x] Agenda v2 implementada localmente em `/agenda`, integrada ao hub e à navegação global (2026-08-11)
- [x] Validar localmente `20260811000100_agenda_v2.sql` com reset, teste consolidado e teste específico (2026-08-11)
- [x] Migration da Agenda aplicada em produção via cadeia ativa e pós-check remoto concluído (2026-08-11)

## 🟢 Agenda v2 — pronta para publicação

- [x] Visão semanal de compromissos por data
- [x] CRUD de eventos manuais com soft delete e `ConfirmDialog`
- [x] Eventos gerais, de estudo (matéria + conteúdo opcional) e de treino
- [x] Provas de Estudos exibidas por leitura direta de `provas`, sem duplicação
- [x] Acesso por `/`, `GlobalNav` e rota `/agenda`
- [x] Reset local, `validate_baseline.sql` e `validate_agenda_v2.sql` aprovados
- [ ] Teste manual responsivo e dos fluxos CRUD na etapa final

---

## 🟢 Estudos v2 — Correção de modelagem pós-design (2026-08) — concluída, smoke principal aprovado

- [x] Migration 017 (área ENEM, letra do gabarito, redação com imagem) executada
- [x] Migration 018 (matéria única, mostra_escola/mostra_enem, limpeza de dado duplicado) executada
- [x] Migration 019 (gabarito 2 fases, domínio de conteúdo, dificuldade) executada — **reconfirmado no dump real do schema em 2026-08**
- [x] `lib/materias.ts`, `lib/conteudos.ts`, `lib/questoes-individuais.ts`, `lib/provas.ts`, `lib/revisao.ts`, `lib/redacoes.ts` atualizados
- [x] Páginas de Estudos atualizadas (Hub, ENEM, área ENEM nova, Escola, Curso×2, Matéria, Gabarito e Redações: 9 rotas de página) — `npx tsc --noEmit` limpo
- [x] **Teste manual completo no navegador** — smoke test online das rotas principais concluído pelo usuário em produção (2026-08-09)
- [x] **Teste em produção (Vercel)** — acesso a `/estudos` confirmado no smoke test online (2026-08-09); teste profundo das 9 rotas internas ainda pode ser feito em etapa própria
- [x] `SubjectManager` órfão removido; nenhuma tela ativa exibe contagem ou taxa de acerto artificial (2026-08-11)
- [x] `materiais_estudo`, `anotacoes_estudo`, `sessoes_estudo` ganharam camada `lib/` e UI funcional nos detalhes de Matéria e Curso, sem mudança de schema (2026-08-11)
- [x] Vínculo de conteúdo compartilhado deixou de usar `window.prompt` e passou a usar seleção visível de matéria (2026-08-09)
- [x] Ações destrutivas de Estudos agora passam por modal de confirmação (conteúdo, prova, atividade, módulo de curso e foto de redação)
- [x] As 10 ocorrências restantes de `confirm()` nativo em Treino/Biblioteca foram substituídas pelo `ConfirmDialog` reutilizável (2026-08-11)
- [ ] Validar manualmente os novos modais de Treino/Biblioteca: confirmar, cancelar, fechar por Escape e clicar no backdrop
- [ ] Validar manualmente em Estudos: criar/listar/apagar material, anotação e sessão em Matéria e Curso

## 🟢 Revisão Espaçada v2 — página dedicada implementada

- [x] Rota `/revisao` com revisões vencidas/para hoje e futuras
- [x] Avaliação usa o `calcularSM2`/`avaliarCard` existente
- [x] Cards manuais simples usam o schema atual (`modulo = 'manual'`)
- [x] Cards de Estudos permanecem lembretes de conteúdo (`modulo = 'estudos'`)
- [x] Exclusão usa `ConfirmDialog`, soft delete e desvincula `conteudos.revisao_uuid`
- [x] Acesso pelo hub `/`, navegação global e Hub de Estudos
- [ ] Validar manualmente criação, revelação de resposta, avaliação, reagendamento e exclusão

## Pendências de polimento

Ver `BACKLOG.md` — upload de capa/banner, edição de itens em listas aninhadas e integrações externas continuam futuras. O menu de ações da Biblioteca agora fecha por clique externo e Escape.

## 🟡 Biblioteca v2 — Vídeos, Artigos e vínculo com Cursos

- [x] Migration incremental com `videos` e `artigos`, RLS, GRANT, checks e índices parciais
- [x] Reset local, teste consolidado, teste da Agenda e teste específico aprovados
- [x] Categorias integradas à página única e à sidebar da Biblioteca
- [x] CRUD manual, detalhe, busca e soft delete com `ConfirmDialog`
- [x] Extração local de `youtube_id` e thumbnail para URLs reconhecidas
- [x] Migration de Vídeos/Artigos aplicada em produção via cadeia ativa (2026-08-11)
- [x] Fluxo manual “Usar em Curso” com escolha de curso e módulo existente ou novo
- [x] Aula mantém FK para o vídeo, sem sincronizar progresso entre módulos
- [x] Tela de Curso identifica aulas da Biblioteca, abre o vídeo e controla teoria/domínio separadamente
- [x] Duplicação do mesmo vídeo no mesmo curso bloqueada pela camada de dados/UI
- [x] `20260811000300_conteudos_video.sql` aplicada em produção e pós-check remoto concluído (2026-08-12)
- [x] Gêneros carregados em lote e persistidos ao criar/editar filmes, séries, animes, mangás, livros e podcasts
- [x] Gêneros padrão inicializados quando necessário e gerenciamento acessível pela sidebar
- [x] Menu de ações dos cards fecha por clique externo e Escape
- [ ] Validar manualmente os dois fluxos na etapa final
