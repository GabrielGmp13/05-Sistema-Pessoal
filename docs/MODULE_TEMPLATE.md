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
| Arquivo | Descrição | Status |
|---|---|---|
| `modulo.html` | ... | ⏳ / 🔄 / ✅ |

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

## Exemplo preenchido (Treino, resumido)

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
