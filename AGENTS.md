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

Nunca assumir nome de coluna, tabela, rota ou assinatura de função de memória — sempre conferir em `docs/DATABASE.md` ou lendo o arquivo real do projeto primeiro. O repositório é público (`github.com/GabrielGmp13/05-Sistema-Pessoal`), então ler o código real em vez de assumir é sempre possível.

## O que é este projeto

Sistema Pessoal — gestão pessoal de longo prazo, uso individual (não é produto multiusuário). Desenvolvedor: Gabriel, Pernambuco/BR.

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
6. **Nunca usar `confirm()` nativo do navegador** para ações destrutivas — sempre modal (ver `docs/DESIGN.md`). Dívida técnica já presente em 9 arquivos, com 10 ocorrências, hoje (ver `docs/BACKLOG.md`) — não introduzir mais, mas também não é bloqueio para outras tarefas.
7. **Não alterar a stack** sem justificativa técnica forte e documentada (ver `docs/PROJECT_PRINCIPLES.md` #9).
8. **`npx tsc --noEmit` deve rodar de dentro de `frontend/`**, não da raiz do projeto (a raiz invoca um `tsc` standalone depreciado).
9. **Nenhuma alteração é commitada diretamente por um agente.** Geração de código é entregue como arquivo completo (criação nova) ou diff old→new (alteração), para o usuário aplicar manualmente.
10. **O banco de produção é a fonte da verdade, não o `.sql` local**, sempre que houver dúvida. Já aconteceu de arquivos de migration locais divergirem do que realmente rodou no Supabase (ver `docs/DATABASE.md`, seção "Migrações", nota de 2026-08) — em caso de dúvida real sobre schema, o caminho seguro é pedir um novo `supabase db dump` em vez de confiar cegamente no `.sql` do repositório.
11. **Nunca editar uma baseline já aplicada.** Toda alteração futura de banco deve ser uma nova migration timestamped incremental, testada com `db reset --local --no-seed`, testes relevantes, revisão do SQL e `db push --dry-run` antes de qualquer autorização remota.
12. **Acervo e snapshots não são migrations.** Nunca executar arquivos de `history/legacy-migrations/` ou `snapshots/`; somente `backend/supabase/migrations/` é cadeia operacional.

## Ao terminar qualquer tarefa

Atualizar antes de encerrar a sessão:
- `docs/TASKS_NOW.md` — marcar concluído, definir próxima ação
- `docs/CHANGELOG.md` — se foi um marco relevante
- `docs/DECISIONS.md` — se uma decisão arquitetural nova foi tomada

Nunca deixar a documentação desalinhada do código real.

## Comportamento esperado

- Se uma tarefa pedida contradiz algo em `docs/DECISIONS.md` ou `docs/PROJECT_PRINCIPLES.md`, apontar isso explicitamente antes de implementar — não seguir o pedido silenciosamente se ele reabre algo já decidido.
- Se não tiver certeza sobre um nome de coluna, rota ou assinatura de função, ler o arquivo real primeiro (o repositório está acessível via git) em vez de assumir.
- Preferir respostas objetivas; quando houver mais de uma alternativa técnica, listar vantagens/desvantagens de cada uma.
- Antes de gerar qualquer arquivo, rodar uma auditoria rápida mental: "isso está de acordo com o que `docs/DATABASE.md` e `docs/DECISIONS.md` dizem hoje?" — a documentação já passou por uma reconciliação completa contra o schema real em 2026-08 (ver `docs/CHANGELOG.md`), então ela é confiável como ponto de partida, mas não substitui checar o código quando a tarefa for tocar algo específico.
