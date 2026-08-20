# AI_CONTEXT.md

> **Leia este arquivo primeiro.** Ele é o ponto de entrada do projeto — um bootstrap para qualquer agente de IA (ou o próprio Gabriel) retomar o trabalho sem precisar reler tudo. Detalhes técnicos vivem nos documentos linkados abaixo, não aqui.

---

## Projeto

**Sistema Pessoal** — gestão pessoal online, multi-dispositivo, para uso individual de longo prazo.
**Desenvolvedor:** Gabriel, estudante (Pernambuco, BR).
**Editor:** VS Code · Windows
**Comunicação:** Português · tom direto · sem rodeios

Qualquer agente de IA que trabalhar neste projeto (Claude via chat, Codex via
`AGENTS.md`, ou outro) segue a mesma disciplina: lê a documentação nesta
ordem antes de propor mudança estrutural, só commita/pusha com autorização
explícita do usuário e nunca assume nome de coluna/rota de memória. Ver `PROJECT_PRINCIPLES.md` → "Fluxo
de trabalho com IAs" para o histórico completo de ferramentas já usadas.

---

## Estrutura real do repositório

```
05-Sistema-Pessoal/
├── AGENTS.md              ← instruções para agentes de IA (Codex e outros)
├── README.md              ← entrada operacional: instalação e validação
├── .nvmrc                 ← Node.js 24.15.0
├── .github/workflows/     ← CI mínima do frontend
├── docs/                  ← toda a documentação do projeto (este arquivo incluído)
├── backend/
│   ├── package.json       ← ferramentas locais do banco; não é aplicação
│   └── supabase/
│       ├── config.toml    ← configuração local, sem link de produção
│       ├── history/       ← acervo histórico 001–019
│       ├── migrations/    ← cadeia operacional ativa (baselines + incrementais futuras)
│       └── snapshots/     ← evidência forense do remoto
└── frontend/               ← único frontend ativo, Next.js App Router
```

**Não existe** pasta `backend/` com código de aplicação/servidor — o nome é
enganoso, mas ela guarda infraestrutura SQL, snapshots e a Supabase CLI local
fixada. O manifesto de `backend/` é apenas de ferramentas; não existe monorepo
com múltiplas aplicações. Documentação aprofundada fica em `docs/`;
`README.md`, `AGENTS.md` e o stub `CLAUDE.md` ficam na raiz por função
operacional.

---

## Estado atual (2026-08)

**Fase:** v2.1 — melhorias documentadas de baixo risco implementadas sobre a release candidate da v2 expandida. Permanecem para homologação manual os fluxos novos e a release como um todo; integrações pesadas e decisões de produto continuam no backlog. A v2 é o único frontend ativo (v1 removida em 2026-07-19, DEC-031).
**Decisão-chave:** DEC-018 (reabre DEC-006) — frontend migrou de HTML puro para Next.js/React
**Deploy:** ✅ em produção no Vercel desde 2026-07-13 (não "pendente" — ver `ARCHITECTURE.md`)
**Schema:** baseline confirmada via dump real em 2026-08 com 44 tabelas; produção e ambiente local estão em 63 tabelas após as migrations incrementais aplicadas até `20260820000100_redacoes_nota_mil.sql` (ver `DATABASE.md`).
**Histórico CLI:** adotado em produção em 2026-08-08 — as três baselines e as migrations incrementais até `20260820000100_redacoes_nota_mil.sql` estão registradas como `applied`. A migration mais recente passou reset e 12 testes SQL, foi aplicada após dry-run exclusivo e teve `NUMERIC(5,1)`, constraint 0–1000, histórico e dry-run vazio confirmados em 2026-08-20.
**Reprodutibilidade:** Node.js `24.15.0`, npm `12.0.1`, `npm ci`, typecheck e build validados; CI mínima ativa. Lint mantém 51 achados conhecidos e informativos (27 erros e 24 warnings) na medição de 2026-08-15.
**Próxima tarefa imediata:** executar a homologação manual autenticada completa de `HOMOLOGATION_V2.md`, cobrindo módulos, temas, responsividade e segurança básica; o handoff operacional está em `V2_RELEASE_CANDIDATE.md` e as únicas tarefas ativas estão em `TASKS_NOW.md`.

---

## Stack (resumo — detalhes em ARCHITECTURE.md)

| Camada | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL via Supabase (63 tabelas em `public`, alinhadas entre produção e cadeia local) |
| Auth | Supabase Auth (email+senha) |
| Storage | Supabase Storage — 5 buckets privados e 14 policies confirmados por captura remota versionada em `backend/supabase/snapshots/` |
| Frontend | Next.js 16 (React 19) + TypeScript — pasta `frontend/`, único frontend do projeto |
| Estilização | CSS Modules (Treino/Biblioteca/Dashboard) + Tailwind v4/shadcn (Estudos) — stack mista intencional, DEC-038 |
| Backend leve | 2 API Routes (Next.js, serverless no Vercel): metadados da Biblioteca e cotação opcional de Finanças, ambas protegendo chaves server-only |
| Offline | Service Worker — fora de escopo por ora (Fase M2, ver `ROADMAP.md`) |
| Hosting | Vercel — **em produção desde 2026-07-13** |
| Toolchain | Node.js 24.15.0 + npm 12.0.1; versões fixadas no repositório |
| CI/testes | GitHub Actions: `npm ci`, typecheck e build bloqueantes; lint informativo. Testes automatizados existentes: baseline SQL local; frontend sem suíte |

---

## Regras gerais

1. Schema-first: nunca gerar frontend para tabela/coluna sem confirmar em `DATABASE.md` que a migration já foi executada.
2. Diffs para alteração de arquivo existente; arquivo completo só para criação nova ou reescrita extensa e justificada.
3. Não alterar stack sem justificativa forte (ver `PROJECT_PRINCIPLES.md`).
4. Toda nova página segue o padrão descrito em `ARCHITECTURE.md` → Frontend.
5. Todo nome de coluna/tabela deve ser conferido em `DATABASE.md` antes de escrever queries — a causa mais comum de bugs neste projeto até agora foi nome de coluna inventado sem checar o schema real. Em segundo lugar: arquivo de migration local divergindo do banco real (ver `DATABASE.md`, nota de 2026-08) — quando em dúvida, o banco de produção é a fonte da verdade, não o `.sql` local.
6. Agentes não commitam nem fazem push por padrão; podem fazê-lo somente quando o usuário autorizar explicitamente no prompt, após revisar validações, stage e segredos.
7. Banco: `history/legacy-migrations/` é somente acervo; `snapshots/` é somente evidência; a cadeia ativa fica em `backend/supabase/migrations/`. Baseline aplicada nunca é editada — toda mudança futura nasce em migration timestamped incremental.

---

## Mapa da documentação

| Documento | Conteúdo |
|---|---|
| `ARCHITECTURE.md` | Diagrama do sistema, componentes Supabase, camadas do frontend, Service Worker, Realtime |
| `DATABASE.md` | Todas as tabelas, colunas, relacionamentos, RLS, convenções de migração, gotchas de nomes |
| `DESIGN.md` | Paleta, tipografia, componentes de UI, responsividade |
| `PROJECT_PRINCIPLES.md` | Princípios permanentes do projeto |
| `MODULE_TEMPLATE.md` | Modelo para documentar novos módulos |
| `DECISIONS.md` | Decisões arquiteturais com alternativas consideradas |
| `ROADMAP.md` | Fases do projeto e o que falta em cada uma |
| `VISION.md` | Visão macro de módulos futuros |
| `TASKS_NOW.md` | Tarefas ativas e próximas ações |
| `BACKLOG.md` | Ideias futuras, não priorizadas |
| `CHANGELOG.md` | Histórico de mudanças por marco |
| `HOMOLOGATION_V2.md` | Checklist manual completo da release candidate |
| `V2_RELEASE_CANDIDATE.md` | Handoff, requisitos de ambiente, estado de migrations e critério de saída da v2 |
| `NAMING_CONVENTIONS.md` | Padrões de nomenclatura (arquivos, SQL, JS, CSS) |
| `COMMIT_CONVENTIONS.md` | Padrão de mensagens de commit |
