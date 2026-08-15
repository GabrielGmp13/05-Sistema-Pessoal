# VISION.md

Visão macro de onde o Sistema Pessoal pretende chegar. Não é um roadmap detalhado — isso vive em `ROADMAP.md`. Aqui é só o mapa de módulos possíveis, para orientar decisões arquiteturais que precisam pensar além do módulo em construção no momento.

---

## Módulos

| Módulo | Status | Observação |
|---|---|---|
| Dashboard | ✅ Hub operacional | `app/page.tsx` resume tempo, Agenda e revisões e alterna insights pessoais dos módulos reais, incluindo Idiomas, Programação, Investimentos e o dia mais ativo do Histórico. `GlobalNav` mantém navegação global e logout visíveis e agrupa áreas cotidianas em Diário. |
| Treino | ✅ Dashboard de domínio (v2) | `/treino` resume sessões, planos, exercícios e Shape; as rotas internas preservam CRUD, modo Academia e histórico corporal. Pendências de polimento vivem em `BACKLOG.md`. |
| Revisão Espaçada | ✅ Implementada (v2) | `/revisao` lista cards pendentes e futuros, registra resultados pelo SM-2, aceita card manual e importação CSV/TSV deduplicada e preserva os lembretes de conteúdo criados por Estudos (DEC-035/056). `.apkg` continua futuro. |
| Biblioteca | ✅ Implementada (v2) | Catálogo consolidado em página única com oito categorias: Filmes, Séries, Animes, Mangás, Livros, Podcasts, Vídeos e Artigos. Os formulários importam metadados por YouTube, TMDB, Google Books, Jikan e iTunes com fallback manual; YouTube/TMDB dependem de chaves server-only. Continua sendo catálogo, nunca hospedagem de mídia (DEC-011). |
| Agenda | ✅ Implementada (v2) | `/agenda` organiza compromissos gerais, cronograma de estudo, provas e treinos em visão semanal. Agenda é dona do planejamento temporal; Estudos continua fonte de verdade acadêmica. A migration incremental está aplicada em produção; resta homologação manual final. |
| Estudos | ✅ Implementado e ampliado (v2) | ENEM, Escola, Curso, Redações, Olimpíadas, Vestibulares e Outros estudos reutilizam matérias/conteúdos compartilhados. Idiomas permanece próximo na navegação, mas usa domínio próprio conforme DEC-055. Anki `.apkg`, Redação versionada e modo prova continuam futuros. |
| Idiomas | ✅ Implementado | `/idiomas` acompanha idiomas, nível, objetivo, vocabulário, domínio e práticas com tempo semanal/mensal; sem Anki, IA ou APIs externas. |
| Histórico | ✅ Heatmap retrospectivo | `/historico` agrega atividade diária de Treino, Estudos, Agenda, Revisão, Saúde, Finanças e Idiomas, com filtros e detalhe por dia, sem Google Calendar ou tabela agregada. |
| Hábitos | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Metas | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Projetos | ✅ Implementado (v2) | `/projetos` oferece CRUD e tarefas em três etapas; migration aplicada em produção, restando teste manual. |
| Programação | ✅ Visão especializada | `/programacao` reutiliza Projetos e mostra repositório, linguagem, status e destaque, sem GitHub API nem domínio duplicado (DEC-056). |
| Receitas | ✅ Implementado (v2) | `/receitas` mantém acervo, preparo, favorito, status de execução e nota; migration aplicada em produção, restando teste manual. |
| Diário | ✅ Portal pessoal implementado | `/diario` não cria fonte de verdade própria: agrega Saúde, Finanças, Lugares e Receitas em um dashboard e concentra o acesso a essas quatro rotas. Não é um editor de texto ou diário cronológico nesta fase. |
| Arquivos | ⏳ Não iniciado | Possível sobreposição com `materiais_estudo` (Estudos v2 — substituiu `documentos_estudo` da v1) — avaliar se vale generalizar quando chegar a hora |
| Saúde | ✅ Implementada (v2) | `/saude` registra sono, hidratação, humor e medicamentos; peso continua em `shape` como fonte única. Migration aplicada, restando teste manual. |
| Finanças | ✅ Implementada (v2) | `/financas` organiza categorias, lançamentos, orçamento mensal, metas e posições de investimento. Cotação BRAPI é opcional, server-side, consultada sob demanda e não persistida (DEC-056). |
| Lugares | ✅ Implementado (v2) | `/lugares` mantém destinos e memórias com link externo para Maps, sem API. Migration aplicada, restando teste manual. |
| Configurações | ✅ Perfil básico implementado | `/configuracoes` edita nome, descrição curta, avatar e background em `user_metadata`; preferências adicionais continuam futuras. |

---

## Como usar este documento

Quando um módulo novo entrar em planejamento, checar aqui primeiro se ele se sobrepõe a algo já existente (ex: um módulo de "Arquivos" futuro provavelmente deveria generalizar `materiais_estudo` em vez de criar uma tabela paralela). Ao começar a trabalhar um módulo listado como "não iniciado", usar `MODULE_TEMPLATE.md` para formalizar o escopo antes de escrever schema ou código.

Este documento é atualizado quando um módulo muda de status ou quando surge um módulo novo na lista — não a cada tarefa concluída dentro de um módulo já em andamento (isso é `TASKS_NOW.md` e `CHANGELOG.md`).
