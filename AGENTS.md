# AGENTS.md

Instruções para qualquer agente de IA que trabalhe neste repositório (Codex,
Claude Code, ou outro). Este projeto era desenvolvido via chat com o Claude
(sem execução de agente no repositório); a partir de 2026-08 passou a
incorporar também o Codex CLI como agente de execução. Toda a comunicação do
projeto é em português — responda em português.

## Leitura obrigatória antes de qualquer tarefa

Nesta ordem, sempre que iniciar uma sessão nova ou antes de propor mudanças estruturais:

1. `docs/AI_CONTEXT.md` — ponto de entrada, estado atual do projeto
2. `docs/PROJECT_PRINCIPLES.md` — princípios permanentes, não reabrir sem justificativa forte
3. `docs/TASKS_NOW.md` — o que está em aberto agora
4. `docs/DECISIONS.md` — decisões arquiteturais já tomadas (não reabrir sem informação nova)
5. `docs/DATABASE.md` — schema real, nomes de coluna/tabela
6. `docs/DESIGN.md` — paleta, escala de espaçamento, componentes já padronizados (ver seção "Interpretando pedidos visuais" abaixo)

Nunca assumir nome de coluna, tabela, rota ou assinatura de função de memória — sempre conferir em `docs/DATABASE.md` ou lendo o arquivo real do projeto primeiro. O repositório é público (`github.com/GabrielGmp13/05-Sistema-Pessoal`), então ler o código real em vez de assumir é sempre possível.

## O que é este projeto

Sistema Pessoal — gestão pessoal de longo prazo, uso individual (não é produto multiusuário). Desenvolvedor: Gabriel, Pernambuco/BR, sem background técnico em programação — as tarefas costumam ser descritas de forma visual/informal, não em termos de código (ver seção "Interpretando pedidos visuais do dono do projeto").

Stack real (não inventar/assumir outra):
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Vercel (hosting — **já em produção desde 2026-07-13**, não é deploy pendente)
- CSS Modules em Treino/Biblioteca/Dashboard
- Tailwind v4 + shadcn/ui em Estudos (stack mista intencional, ver `docs/DECISIONS.md` DEC-038)
- Pasta única do frontend: `frontend/`

## Estrutura de pastas real

```
05-Sistema-Pessoal/
├── AGENTS.md
├── README.md                     ← ponto de entrada operacional
├── .nvmrc                       ← Node.js fixado para todo o repositório
├── .github/workflows/validate.yml ← CI de frontend sem credenciais reais
├── docs/                          ← TODA a documentação vive aqui, não na raiz
├── backend/
│   ├── package.json               ← ferramentas locais do banco (Supabase CLI fixada)
│   └── supabase/
│       ├── config.toml            ← configuração exclusivamente local do CLI
│       ├── history/               ← migrations 001–019 arquivadas; não reproduzíveis
│       ├── migrations/*.sql       ← cadeia operacional ativa do Supabase CLI
│       └── snapshots/             ← evidência forense; não executar como migration
└── frontend/                       ← único frontend ativo
```

**Existe sim uma pasta `backend/`** — versões anteriores desta instrução
afirmavam o contrário, o que estava errado. Ela contém exclusivamente
infraestrutura SQL, snapshots e ferramentas locais do Supabase, sem código de
aplicação — não é um servidor. O `package.json` de `backend/` existe apenas
para fixar a versão da CLI e não transforma o projeto em monorepo de aplicações.

Existe Supabase CLI `2.112.0` configurado em `backend/`. As três migrations
timestamped de `backend/supabase/migrations/` formam o início oficial da cadeia
ativa; foram validadas por dois resets locais completos e registradas como
`applied` em produção em 2026-08-08, sem executar novamente seus SQLs. A
produção não está vinculada ao CLI. Enquanto `supabase link` permanecer
incompatível com a Management API, operações remotas excepcionalmente
autorizadas usam `--db-url` com variável de ambiente — nunca credencial em
arquivo, argumento documentado ou Git. Não usar `--linked`, `db push`,
`migration repair` ou outro comando remoto sem precheck, dry-run quando
aplicável e autorização explícita. Ver `backend/supabase/README.md`.

O toolchain do repositório é Node.js `24.15.0` e npm `12.0.1`. No frontend,
usar `npm ci`, `npm run typecheck`, `npm run build` e `npm run lint`, sempre a
partir de `frontend/`. Typecheck e build são bloqueantes na CI; lint é
temporariamente informativo por causa da dívida factual registrada em
`docs/BACKLOG.md`. Não há suíte automatizada de frontend; os testes existentes
são os testes SQL locais em `backend/supabase/tests/`.

## Regras inegociáveis

1. **Schema-first.** Nunca gerar código de frontend para uma tabela/coluna antes de confirmar em `docs/DATABASE.md` que a migration relacionada já foi executada no Supabase.
2. **Nunca reabrir decisões de `docs/DECISIONS.md`** sem uma informação nova e concreta.
3. **Diffs, não reescritas.** Para alterações em arquivo existente, mostrar só o trecho antigo → novo. Reescrever o arquivo inteiro só quando for criação nova ou mudança extensa justificada.
4. **GRANT obrigatório em toda migration nova**: `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;` — Supabase não concede isso automaticamente (ver `docs/DATABASE.md` → Gotchas).
5. **Convenção de FK**: sempre `<tabela_singular>_uuid`, nunca `_id`.
6. **Nunca usar `confirm()` nativo do navegador** para ações destrutivas — sempre modal (ver `docs/DESIGN.md`). A dívida de 9 arquivos/10 ocorrências foi zerada em 2026-08-11 com o `ConfirmDialog` reutilizável; não reintroduzir.
7. **Não alterar a stack** sem justificativa técnica forte e documentada (ver `docs/PROJECT_PRINCIPLES.md` #9).
8. **`npx tsc --noEmit` deve rodar de dentro de `frontend/`**, não da raiz do projeto (a raiz invoca um `tsc` standalone depreciado).
9. **Agentes não commitam nem fazem push por padrão.** Commit e push só podem ser executados quando o usuário autorizar explicitamente no prompt; nesse caso, revisar stage, segredos e validações antes da operação. Sem autorização explícita, a alteração permanece local para revisão do usuário.
10. **O banco de produção é a fonte da verdade, não o `.sql` local**, sempre que houver dúvida. Já aconteceu de arquivos de migration locais divergirem do que realmente rodou no Supabase (ver `docs/DATABASE.md`, seção "Migrações", nota de 2026-08) — em caso de dúvida real sobre schema, o caminho seguro é pedir um novo `supabase db dump` em vez de confiar cegamente no `.sql` do repositório.
11. **Nunca editar uma baseline já aplicada.** Toda alteração futura de banco deve ser uma nova migration timestamped incremental, testada com `db reset --local --no-seed`, testes relevantes, revisão do SQL e `db push --dry-run` antes de qualquer autorização remota.
12. **Acervo e snapshots não são migrations.** Nunca executar arquivos de `history/legacy-migrations/` ou `snapshots/`; somente `backend/supabase/migrations/` é cadeia operacional.
13. **Pedido visual/de design ambíguo nunca é implementado direto.** Se o pedido admite mais de uma interpretação (ver seção "Interpretando pedidos visuais do dono do projeto"), o agente para e pergunta antes de tocar em código — mesmo que isso signifique não terminar a tarefa na mesma mensagem.

## Interpretando pedidos visuais do dono do projeto

O Gabriel não programa e descreve UI de forma leiga/visual. Isso já causou dois problemas recorrentes: (a) pedidos como "background do site" sem indicar *qual* elemento, e (b) telas que saem com excesso de separação visual entre elementos que deveriam estar agrupados. As regras abaixo existem pra resolver isso na raiz, não no retrabalho.

**Regra geral:** `docs/DESIGN.md` é a fonte da verdade para paleta, escala de espaçamento e componentes padronizados — checar lá primeiro. Só perguntar ao Gabriel quando o pedido não estiver coberto por um padrão já documentado.

### Quando parar e perguntar (antes de codar)

- **"background"** sem indicar o elemento (página inteira? uma seção? um card específico?) e sem estar coberto por um padrão já existente em `docs/DESIGN.md`
- Posição vaga: "mais pra cá", "mais próximo", "no topo", "do lado"
- Estilo vago: "mais bonito", "mais moderno", "mais clean", "parece errado"
- Cor sem referência (hex, nome, ou componente existente): "um azul", "algo escuro"
- Espaçamento vago: "mais junto", "mais separado", "tá muito grande"
- Pedido que depende de um elemento específico da tela sem apontar qual (nome de componente, seção ou arquivo)

Formato da pergunta: objetiva, com 2-3 opções concretas para escolher — nunca "o que você quer dizer com background?" solto. Exemplo:
```
Antes de mexer: o background que você quer é do card de baixo, da seção
inteira, ou da página toda? E a cor — mais parecida com [X] ou [Y]?
```

### Quando NÃO precisa perguntar

- O pedido já é coberto por um padrão existente em `docs/DESIGN.md` (aplicar o padrão, não perguntar de novo)
- O pedido é puramente técnico e sem ambiguidade ("corrige esse bug no revisao.html")
- A mudança é pequena e reversível o suficiente pra implementar e perguntar depois "ficou assim, tá bom ou ajusto?"

### Diretrizes para não gerar "camadas de separação" indevidas

Esse problema normalmente vem de espaçamento uniforme demais (tudo com o mesmo espaço = o olho não agrupa nada). Aplicar por padrão, mesmo sem pedido explícito:

- Usar a escala de espaçamento já definida em `docs/DESIGN.md`; se não houver, propor uma escala fixa em múltiplos de 8px (8/16/24/32/48/64) antes de estilizar componentes novos, em vez de inventar valores soltos.
- Elementos relacionados (título + texto, ícone + label) ficam com espaço nitidamente menor entre si do que o espaço até o próximo grupo não relacionado.
- Evitar bordas, sombras e containers extras sem razão clara — questionar cada camada visual nova antes de adicionar.
- Antes de estilizar um componente novo, checar como componentes parecidos já existem no projeto (altura de botão, raio de borda, fonte) e manter consistência em vez de criar estilo próprio.

### Glossário (expandir conforme surgirem novos termos recorrentes)

| O Gabriel diz | Provavelmente quer dizer |
|---|---|
| "background do site" | cor/imagem de fundo — mas *perguntar* de qual seção |
| "mais junto" / "mais próximo" | reduzir margin/padding entre elementos |
| "solto" / "separado demais" | falta de agrupamento visual — revisar escala de espaçamento |
| "parece errado" | inconsistência com o resto do site — comparar com componentes existentes em `docs/DESIGN.md` |
| "mais limpo" | reduzir bordas/sombras/elementos visuais desnecessários |

## Ao terminar qualquer tarefa

Atualizar antes de encerrar a sessão:
- `docs/TASKS_NOW.md` — marcar concluído, definir próxima ação
- `docs/CHANGELOG.md` — se foi um marco relevante
- `docs/DECISIONS.md` — se uma decisão arquitetural nova foi tomada
- `docs/DESIGN.md` — se um novo padrão visual foi definido durante a tarefa (evita repetir a mesma pergunta de esclarecimento no futuro)

Nunca deixar a documentação desalinhada do código real.

## Comportamento esperado

- Se uma tarefa pedida contradiz algo em `docs/DECISIONS.md` ou `docs/PROJECT_PRINCIPLES.md`, apontar isso explicitamente antes de implementar — não seguir o pedido silenciosamente se ele reabre algo já decidido.
- Se não tiver certeza sobre um nome de coluna, rota ou assinatura de função, ler o arquivo real primeiro (o repositório está acessível via git) em vez de assumir.
- Se não tiver certeza sobre a intenção visual de um pedido, seguir a seção "Interpretando pedidos visuais do dono do projeto" em vez de assumir uma interpretação.
- Preferir respostas objetivas; quando houver mais de uma alternativa técnica, listar vantagens/desvantagens de cada uma.
- Antes de gerar qualquer arquivo, rodar uma auditoria rápida mental: "isso está de acordo com o que `docs/DATABASE.md`, `docs/DECISIONS.md` e `docs/DESIGN.md` dizem hoje?" — a documentação já passou por uma reconciliação completa contra o schema real em 2026-08 (ver `docs/CHANGELOG.md`), então ela é confiável como ponto de partida, mas não substitui checar o código quando a tarefa for tocar algo específico.