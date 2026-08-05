# VISION.md

Visão macro de onde o Sistema Pessoal pretende chegar. Não é um roadmap detalhado — isso vive em `ROADMAP.md`. Aqui é só o mapa de módulos possíveis, para orientar decisões arquiteturais que precisam pensar além do módulo em construção no momento.

---

## Módulos

| Módulo | Status | Observação |
|---|---|---|
| Dashboard | ✅ Implementado | `index.html` |
| Treino | ✅ Implementado | Plano, academia, hub, shape — completo |
| Revisão Espaçada | ✅ Implementado | Bug de schema corrigido em 2026-07-11, ver DATABASE.md → Gotchas |
| Biblioteca | ✅ v1 completa | Catálogo de mídia, ver DEC-011. Escopo de v2 não definido. |
| Agenda | 🔄 Parcial | Hoje existe só dentro de `treino.html`; não é módulo dedicado. Escopo de v2 não definido. |
| Estudos | 🔄 v2 em construção avançada | ENEM, Escola, Curso, Redações, Matéria e Gabarito implementados e restilizados; matéria única compartilhada entre Escola/ENEM (DEC-040); gabarito em 2 fases (DEC-041); domínio de conteúdo calculado via SM-2 (DEC-042). Fase 2 (Cursos com certificação rica, Flashcards/Anki, Redação versionada, Calendário próprio, modo "fazer prova" com cronômetro) registrada em BACKLOG.md, não descartada. |
| Hábitos | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Metas | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Projetos | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Diário | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Arquivos | ⏳ Não iniciado | Possível sobreposição com `documentos_estudo` — avaliar se vale generalizar quando chegar a hora |
| Saúde | ⏳ Parcial | Hoje coberta em pedaços por Treino (shape, cardio) — não há módulo de saúde geral (sono, hidratação, etc.) |
| Finanças | ⏳ Não iniciado | Sem tabela, sem decisão de escopo ainda |
| Configurações | ⏳ Não iniciado | Preferências do usuário, tema, etc. |

---

## Como usar este documento

Quando um módulo novo entrar em planejamento, checar aqui primeiro se ele se sobrepõe a algo já existente (ex: um módulo de "Arquivos" futuro provavelmente deveria generalizar `documentos_estudo` em vez de criar uma tabela paralela). Ao começar a trabalhar um módulo listado como "não iniciado", usar `MODULE_TEMPLATE.md` para formalizar o escopo antes de escrever schema ou código.

Este documento é atualizado quando um módulo muda de status ou quando surge um módulo novo na lista — não a cada tarefa concluída dentro de um módulo já em andamento (isso é `TASKS_NOW.md` e `CHANGELOG.md`).

