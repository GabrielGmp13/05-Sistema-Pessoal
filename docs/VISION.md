# VISION.md

Visão macro de onde o Sistema Pessoal pretende chegar. Não é um roadmap detalhado — isso vive em `ROADMAP.md`. Aqui é só o mapa de módulos possíveis, para orientar decisões arquiteturais que precisam pensar além do módulo em construção no momento.

---

## Módulos

| Módulo | Status | Observação |
|---|---|---|
| Dashboard | ✅ Hub operacional | `app/page.tsx` resume tempo, Agenda e revisões e alterna insights pessoais de Biblioteca, Estudos, Projetos e Receitas usando dados reais, incluindo próximos compromissos e tempo hoje/semana/mês. `GlobalNav` mantém navegação global e logout visíveis e agrupa áreas cotidianas em Diário. |
| Treino | ✅ Dashboard de domínio (v2) | `/treino` resume sessões, planos, exercícios e Shape; as rotas internas preservam CRUD, modo Academia e histórico corporal. Pendências de polimento vivem em `BACKLOG.md`. |
| Revisão Espaçada | ✅ Implementada (v2) | `/revisao` lista cards pendentes e futuros, registra resultados pelo SM-2, aceita card manual e preserva os lembretes de conteúdo criados por Estudos (DEC-035). |
| Biblioteca | ✅ Implementada (v2) | Catálogo consolidado em página única com sidebar (DEC-032), incluindo Vídeos e Artigos. Os formulários importam metadados por YouTube, TMDB, Google Books, Jikan e iTunes com fallback manual; YouTube/TMDB dependem de chaves server-only. Continua sendo catálogo, nunca hospedagem de mídia (DEC-011). |
| Agenda | ✅ v2 pronta para publicação | `/agenda` organiza compromissos gerais, cronograma de estudo, provas e treinos em visão semanal. Agenda é dona do planejamento temporal; Estudos continua fonte de verdade acadêmica. A migration incremental está aplicada em produção. |
| Estudos | 🔄 v2 em construção avançada | ENEM, Escola, Curso, Redações, Matéria e Gabarito implementados e restilizados; matéria única compartilhada entre Escola/ENEM (DEC-040); gabarito em 2 fases (DEC-041); domínio de conteúdo calculado via SM-2 (DEC-042). Fase 2 (Cursos com certificação rica, Flashcards/Anki, Redação versionada, Calendário próprio, modo "fazer prova" com cronômetro) registrada em `BACKLOG.md`, não descartada. **Gap conhecido:** o escopo original do módulo também previa Olimpíadas Científicas, Idiomas e Vestibulares específicos como áreas próprias — nenhuma decisão de escopo foi tomada pra elas ainda, ver `BACKLOG.md`. |
| Hábitos | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Metas | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Projetos | ✅ Implementado (v2) | `/projetos` oferece CRUD e tarefas em três etapas; migration aplicada em produção, restando teste manual. |
| Receitas | ✅ Implementado (v2) | `/receitas` mantém acervo, preparo, favorito, status de execução e nota; migration aplicada em produção, restando teste manual. |
| Diário | ✅ Portal pessoal implementado | `/diario` não cria fonte de verdade própria: agrega Saúde, Finanças, Lugares e Receitas em um dashboard e concentra o acesso a essas quatro rotas. Não é um editor de texto ou diário cronológico nesta fase. |
| Arquivos | ⏳ Não iniciado | Possível sobreposição com `materiais_estudo` (Estudos v2 — substituiu `documentos_estudo` da v1) — avaliar se vale generalizar quando chegar a hora |
| Saúde | ✅ Implementada (v2) | `/saude` registra sono, hidratação, humor e medicamentos; peso continua em `shape` como fonte única. Migration aplicada, restando teste manual. |
| Finanças | ✅ Implementada (v2) | `/financas` organiza categorias, lançamentos, orçamento mensal e metas. Migration aplicada, restando teste manual. |
| Lugares | ✅ Implementado (v2) | `/lugares` mantém destinos e memórias com link externo para Maps, sem API. Migration aplicada, restando teste manual. |
| Configurações | ✅ Perfil básico implementado | `/configuracoes` edita nome, descrição curta, avatar e background em `user_metadata`; preferências adicionais continuam futuras. |

---

## Como usar este documento

Quando um módulo novo entrar em planejamento, checar aqui primeiro se ele se sobrepõe a algo já existente (ex: um módulo de "Arquivos" futuro provavelmente deveria generalizar `materiais_estudo` em vez de criar uma tabela paralela). Ao começar a trabalhar um módulo listado como "não iniciado", usar `MODULE_TEMPLATE.md` para formalizar o escopo antes de escrever schema ou código.

Este documento é atualizado quando um módulo muda de status ou quando surge um módulo novo na lista — não a cada tarefa concluída dentro de um módulo já em andamento (isso é `TASKS_NOW.md` e `CHANGELOG.md`).
