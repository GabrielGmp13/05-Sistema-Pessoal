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
├── docs/                  ← toda a documentação do projeto (este arquivo incluído)
├── backend/
│   └── supabase/
│       └── migrations/    ← só arquivos .sql, sem código de servidor
└── frontend/               ← único frontend ativo, Next.js App Router
```

**Não existe** pasta `backend/` com código de aplicação/servidor — o nome é
enganoso, mas ela guarda só as migrations SQL. Não existe monorepo com
múltiplos pacotes. Documentação fica em `docs/`, não na raiz (só `AGENTS.md`
fica na raiz, por convenção da ferramenta).

---

## Estado atual (2026-08)

**Fase:** Fase 7 — v2 é o único frontend ativo (v1 removida do projeto em 2026-07-19, DEC-031)
**Decisão-chave:** DEC-018 (reabre DEC-006) — frontend migrou de HTML puro para Next.js/React
**Deploy:** ✅ em produção no Vercel desde 2026-07-13 (não "pendente" — ver `ARCHITECTURE.md`)
**Schema:** confirmado via dump real do Supabase em 2026-08 — 46 tabelas, RLS e GRANT corretos em todas (ver `DATABASE.md`)
**Próxima tarefa imediata:** ver `TASKS_NOW.md`

---

## Stack (resumo — detalhes em ARCHITECTURE.md)

| Camada | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL via Supabase (46 tabelas, confirmado via dump real 2026-08) |
| Auth | Supabase Auth (email+senha) |
| Storage | Supabase Storage — 5 buckets privados (`shape`, `documentos`, `capas`, `exercicios`, `redacoes`) |
| Frontend | Next.js 16 (React 19) + TypeScript — pasta `frontend/`, único frontend do projeto |
| Estilização | CSS Modules (Treino/Biblioteca/Dashboard) + Tailwind v4/shadcn (Estudos) — stack mista intencional, DEC-038 |
| Backend leve | API Routes (Next.js, serverless no Vercel) — **planejado, nenhuma rota `app/api/**` existe ainda** |
| Offline | Service Worker — fora de escopo por ora (Fase M2, ver `ROADMAP.md`) |
| Hosting | Vercel — **em produção desde 2026-07-13** |

---

## Regras gerais

1. Schema-first: nunca gerar frontend para tabela/coluna sem confirmar em `DATABASE.md` que a migration já foi executada.
2. Diffs para alteração de arquivo existente; arquivo completo só para criação nova ou reescrita extensa e justificada.
3. Não alterar stack sem justificativa forte (ver `PROJECT_PRINCIPLES.md`).
4. Toda nova página segue o padrão descrito em `ARCHITECTURE.md` → Frontend.
5. Todo nome de coluna/tabela deve ser conferido em `DATABASE.md` antes de escrever queries — a causa mais comum de bugs neste projeto até agora foi nome de coluna inventado sem checar o schema real. Em segundo lugar: arquivo de migration local divergindo do banco real (ver `DATABASE.md`, nota de 2026-08) — quando em dúvida, o banco de produção é a fonte da verdade, não o `.sql` local.
6. Nenhuma alteração é commitada diretamente por um agente de IA — sempre entregue pro usuário aplicar manualmente.

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
