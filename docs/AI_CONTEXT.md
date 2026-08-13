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
ordem antes de propor mudança estrutural, nunca commita diretamente, nunca
assume nome de coluna/rota de memória. Ver `PROJECT_PRINCIPLES.md` → "Fluxo
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

**Fase:** Fase 7 — v2 é o único frontend ativo (v1 removida do projeto em 2026-07-19, DEC-031)
**Decisão-chave:** DEC-018 (reabre DEC-006) — frontend migrou de HTML puro para Next.js/React
**Deploy:** ✅ em produção no Vercel desde 2026-07-13 (não "pendente" — ver `ARCHITECTURE.md`)
**Schema:** baseline confirmada via dump real em 2026-08 com 44 tabelas; a migration de Vídeos/Artigos, aplicada em produção em 2026-08-11, elevou o total para 46 (ver `DATABASE.md`)
**Histórico CLI:** adotado em produção em 2026-08-08 — as três baselines e as migrations incrementais de Agenda, Vídeos/Artigos, vínculo Vídeo → Curso e Arquivados da Revisão estão registradas como `applied`; pós-check remoto sem pendências em 2026-08-12
**Reprodutibilidade:** Node.js `24.15.0`, npm `12.0.1`, `npm ci`, typecheck e build validados; CI mínima ativa. Lint mantém 40 achados conhecidos e informativos na medição de 2026-08-12.
**Próxima tarefa imediata:** ver `TASKS_NOW.md`

---

## Stack (resumo — detalhes em ARCHITECTURE.md)

| Camada | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL via Supabase (46 tabelas em `public`: baseline de 44 confirmada por dump + 2 tabelas da migration de Vídeos/Artigos) |
| Auth | Supabase Auth (email+senha) |
| Storage | Supabase Storage — 5 buckets privados e 14 policies confirmados por captura remota versionada em `backend/supabase/snapshots/` |
| Frontend | Next.js 16 (React 19) + TypeScript — pasta `frontend/`, único frontend do projeto |
| Estilização | CSS Modules (Treino/Biblioteca/Dashboard) + Tailwind v4/shadcn (Estudos) — stack mista intencional, DEC-038 |
| Backend leve | API Routes (Next.js, serverless no Vercel) — primeira rota em `app/api/biblioteca/metadados`, para proteger chaves e padronizar importações |
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
6. Nenhuma alteração é commitada diretamente por um agente de IA — sempre entregue pro usuário aplicar manualmente.
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
| `NAMING_CONVENTIONS.md` | Padrões de nomenclatura (arquivos, SQL, JS, CSS) |
| `COMMIT_CONVENTIONS.md` | Padrão de mensagens de commit |
