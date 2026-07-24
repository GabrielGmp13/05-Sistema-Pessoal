# MODULE_TEMPLATE.md

Modelo padrão para documentar qualquer novo módulo do Sistema Pessoal. Ao planejar um módulo novo (ou formalizar um já existente), copiar esta estrutura para uma seção própria em `ROADMAP.md` ou para um arquivo dedicado, se o módulo for grande o suficiente para justificar.

---

## Template

```markdown
### Módulo: [Nome]

**Objetivo**
O que este módulo resolve, em uma frase. Qual problema real do dia a dia ele atende.

**Escopo**
O que está dentro e o que está deliberadamente fora. Se houver ambiguidade de escopo
(ex: "isso vira upload de arquivo ou só um link?"), resolver aqui antes de codificar.

**Páginas**
| Rota | Descrição | Status |
|---|---|---|
| `app/modulo/page.tsx` | ... | ⏳ / 🔄 / ✅ |

**Componentes**
Lista dos componentes React novos que este módulo introduz, e se algum é
reaproveitado de outro módulo (ex: `RatingEstrela` nascendo na Biblioteca,
reaproveitável em outros catálogos futuros).

**Precisa de API Route (segredo/servidor)?**
Sim/Não. Se sim, listar qual API externa, qual variável de ambiente guarda o
segredo, e o path da rota (`app/api/.../route.ts`).

**Banco de dados**
Tabelas novas (link para a seção correspondente em DATABASE.md) e se usa alguma
tabela já existente de outro módulo.

**Dependências**
- Bibliotecas externas (CDN) necessárias
- Buckets de Storage usados
- Outros módulos dos quais este depende (ex: Estudos depende de Auth)

**Fluxo de funcionamento**
Passo a passo do que acontece quando o usuário usa a funcionalidade principal.
Pode ser uma lista numerada ou um diagrama simples em texto.

**APIs utilizadas**
APIs externas (ex: Google Books, TMDB) com o que é consumido de cada uma e
onde a chamada acontece (frontend direto vs. Edge Function).

**Pendências**
O que falta para o módulo ser considerado completo.

**Melhorias futuras**
Ideias que não bloqueiam o lançamento do módulo, mas que valem registrar.
Também vale linkar para BACKLOG.md se a ideia for grande o suficiente.
```

---

## Exemplo preenchido (Treino, resumido)(v1, legado)

```markdown
### Módulo: Treino

**Objetivo**
Planejar divisões de treino, executá-las na academia com timer e detecção de PR,
acompanhar evolução física via fotos e peso, e visualizar tudo em um calendário mensal.

**Escopo**
Dentro: CRUD de divisões/exercícios, sessão de treino com séries em tempo real,
fotos de shape, gráfico de peso, agenda manual, radar de métricas.
Fora: integração com wearables, cálculo automático de calorias, planos de treino
gerados por IA.

**Páginas**
| Arquivo | Descrição | Status |
|---|---|---|
| `treino-plano.html` | CRUD de divisões e exercícios | ✅ |
| `treino-academia.html` | Execução do treino, timer, PR | ✅ |
| `treino.html` | Hub: calendário + agenda + radar | ✅ |
| `treino-shape.html` | Fotos + gráfico de peso | ✅ |

**Banco de dados**
`treinos`, `exercicios`, `sessoes_treino`, `series_executadas`, `shape`, `agenda`
— ver DATABASE.md.

**Dependências**
Chart.js (radar e gráfico de peso), bucket `shape` do Storage.

**Fluxo de funcionamento**
1. Usuário cria divisões e exercícios em `treino-plano.html`.
2. Na academia, abre `treino-academia.html`, seleciona a divisão, registra séries
   (peso/reps) — cada série salva imediatamente no Supabase.
3. PRs são detectados comparando a carga da série contra o máximo histórico do
   exercício.
4. `treino.html` mostra o calendário do mês com cores por tipo de evento e as
   métricas agregadas (disciplina, força, resistência).

**APIs utilizadas**
Nenhuma externa além do Supabase.

**Pendências**
Offline real (Fase M2, Service Worker); Realtime entre dispositivos (Fase M3).

**Melhorias futuras**
Gráfico de evolução de carga por exercício; volume semanal por grupo muscular
— ver BACKLOG.md.
```

### Módulo: Estudos v2 (Fase 1 + Fase 1B)

**Objetivo**
Organizar o estudo para ENEM, Escola e Cursos livres num único módulo: conteúdo
com progresso, materiais de apoio, tempo de estudo, provas oficiais com
gabarito questão-a-questão, simulados informais que alimentam revisão
espaçada, e redação por competência.

**Escopo**
Dentro: matérias/conteúdos (compartilháveis entre módulos via
`conteudos_materias`), anotações, materiais de apoio, sessões de estudo
(tempo), questões avulsas, gabarito digital de prova oficial, simulados
(dispara SM-2 quando vinculados a conteúdo), atividades (Escola/Curso),
hierarquia Curso → Módulo → Aula, redação leve com 5 competências.
Fora (Fase 2, ver `BACKLOG.md`): Cursos com estrutura de certificação mais
rica, Flashcards/Anki, redação versionada, calendário acadêmico próprio
(absorvido pela Agenda quando existir), metas/streak, estatísticas
avançadas, upload de gabarito/prova em arquivo.

**Páginas**
| Rota | Descrição | Status |
|---|---|---|
| `app/estudos/page.tsx` | Hub — 3 entradas (ENEM/Escola/Curso) + próximas provas/atividades/simulados | ✅ (versão crua) |
| `app/estudos/enem/page.tsx` | Matérias ENEM, agendar prova ENEM, listar próximas | ✅ (versão crua) |
| `app/estudos/escola/page.tsx` | Matérias Escola, próximas provas, atividades pendentes | ✅ (versão crua) |
| `app/estudos/curso/page.tsx` | Lista de cursos, criar curso novo | ✅ (versão crua) |
| `app/estudos/curso/[materiaUuid]/page.tsx` | Curso → Módulo → Aula, progresso, concluir curso | ✅ (versão crua) |
| `app/estudos/materia/[materiaUuid]/page.tsx` | Detalhe de matéria ENEM/Escola: conteúdos, provas, atividades, questões avulsas, simulados | ✅ (versão crua) |
| `app/estudos/enem/gabarito/[provaUuid]/page.tsx` | Gabarito digital em lote por área | ✅ (versão crua) |
| `app/estudos/redacoes/page.tsx` | Lista/cria redações com 5 competências | ✅ (versão crua) |

**Componentes**
Nenhum componente reutilizável extraído ainda — toda a leva atual é
implementada inline em cada página (decisão deliberada: "cru" primeiro,
componentização/design vem depois via Figma, ver TASKS_NOW.md). Candidatos
óbvios pra extração futura: card de conteúdo com progresso, formulário de
prova, tabela de gabarito.

**Precisa de API Route (segredo/servidor)?**
Não. Todo CRUD é direto via `lib/*.ts` → Supabase client, sob RLS — nenhuma
API externa envolvida neste módulo (diferente de Biblioteca/TMDB).

**Banco de dados**
Ver `DATABASE.md` → Schema `015_estudos_v2.sql` e `016_estudos_v2_fase1b.sql`.
Tabelas: `materias` (reaproveitada), `conteudos`, `conteudos_materias`,
`anotacoes_estudo`, `materiais_estudo`, `sessoes_estudo`,
`questoes_individuais`, `provas`, `simulados`, `redacoes`, `modulos_curso`,
`atividades`. Reaproveita `revisao_espacada` (SM-2) via `lib/revisao.ts`
como lembrete, não flashcard — ver DEC-035.

**Dependências**
- Nenhuma biblioteca externa nova.
- Nenhum bucket de Storage usado ainda (materiais de estudo com
  `arquivo_path` existem no schema, mas a UI de upload não foi gerada nesta
  leva — `materiais_estudo` inteiro ficou de fora das páginas até agora).
- Depende de `lib/revisao.ts` (criado nesta sessão para desbloquear
  `lib/simulados.ts`).

**Fluxo de funcionamento**
1. Usuário entra em `/estudos`, escolhe ENEM, Escola ou Curso.
2. Em ENEM/Escola: cadastra matéria → entra no detalhe da matéria → cadastra
   conteúdos, provas, atividades, registra questões avulsas e simulados.
3. Simulado com `conteudo_uuid` preenchido dispara `avaliarCardPorConteudo`
   (cria o card em `revisao_espacada` na primeira vez, senão só avalia).
4. Prova ENEM: agendada em `/estudos/enem`, gabarito lançado em lote por
   área em `/estudos/enem/gabarito/[provaUuid]`.
5. Em Curso: cadastra curso → módulos → aulas (conteúdos com
   `modulo_curso_uuid`), marca aula concluída, marca curso concluído.

**APIs utilizadas**
Nenhuma.

**Pendências**
- `lib/simulados.ts` estava bloqueado por dependência de `lib/revisao.ts`
  inexistente — resolvido nesta sessão.
- Teste end-to-end ainda não realizado pelo usuário (arquivos gerados,
  aplicação/teste adiados pra outra sessão — ver nota de exceção em
  `DECISIONS.md`, mesmo padrão já usado uma vez em DEC-036).
- `materiais_estudo` (materiais de apoio) sem página — schema existe, UI não.
- `anotacoes_estudo` sem página — schema existe, UI não.
- `sessoes_estudo` (tempo de estudo) sem página — schema existe, UI não.
- Vínculo de conteúdo compartilhado (`vincularConteudoAMateria`) exposto de
  forma crua (prompt pedindo UUID manual) — inutilizável na prática sem uma
  UI de seleção de matéria.
- Edição de prova/atividade/conteúdo — só criação, toggle e exclusão; sem
  formulário de edição completo (ex: mudar data de uma prova já criada).

**Melhorias futuras**
Ver `BACKLOG.md` (Fase 2 de Estudos) e o design definitivo via Figma —
Sidebar/Banner/Card documentados em `DESIGN.md` ainda não aplicados neste
módulo.
