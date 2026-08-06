# CLAUDE.md

Instruções para qualquer sessão do Claude Code neste repositório.

## Leitura obrigatória antes de qualquer tarefa

Nesta ordem, sempre que iniciar uma sessão nova ou antes de propor mudanças estruturais:

1. `AI_CONTEXT.md` — ponto de entrada, estado atual do projeto
2. `PROJECT_PRINCIPLES.md` — princípios permanentes, não reabrir sem justificativa forte
3. `TASKS_NOW.md` — o que está em aberto agora
4. `DECISIONS.md` — decisões arquiteturais já tomadas (não reabrir sem informação nova)
5. `DATABASE.md` — schema real, nomes de coluna/tabela

Nunca assumir nome de coluna, tabela, rota ou assinatura de função de memória — sempre conferir em `DATABASE.md` ou lendo o arquivo real do projeto primeiro.

## O que é este projeto

Sistema Pessoal — gestão pessoal de longo prazo, uso individual (não é produto multiusuário). Desenvolvedor: Gabriel, Pernambuco/BR.

Stack real (não inventar/assumir outra):
- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Vercel (hosting)
- CSS Modules em Treino/Biblioteca/Dashboard
- Tailwind v4 + shadcn/ui em Estudos (stack mista intencional, ver DECISIONS.md DEC-038)
- Pasta única do frontend: `frontend/` (não existe `backend/`, não existe monorepo com pastas separadas)

Não existe CLI própria do Supabase configurada neste projeto além do SQL Editor manual do dashboard — migrations em `supabase/migrations/*.sql` são coladas manualmente no SQL Editor do Supabase pelo usuário, não aplicadas via comando.

## Regras inegociáveis

1. **Schema-first.** Nunca gerar código de frontend para uma tabela/coluna antes de confirmar em `DATABASE.md` que a migration relacionada já foi executada no Supabase.
2. **Nunca reabrir decisões de `DECISIONS.md`** sem uma informação nova e concreta.
3. **Diffs, não reescritas.** Para alterações em arquivo existente, mostrar só o trecho antigo → novo. Reescrever o arquivo inteiro só quando for criação nova ou mudança extensa justificada.
4. **GRANT obrigatório em toda migration nova**: `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;` — Supabase não concede isso automaticamente (ver DATABASE.md → Gotchas).
5. **Convenção de FK**: sempre `<tabela_singular>_uuid`, nunca `_id`.
6. **Nunca usar `confirm()` nativo do navegador** para ações destrutivas — sempre modal (ver DESIGN.md), mesmo sendo dívida técnica já presente em partes do código.
7. **Não alterar a stack** sem justificativa técnica forte e documentada (ver PROJECT_PRINCIPLES.md #9).
8. **`npx tsc --noEmit` deve rodar de dentro de `frontend/`**, não da raiz do projeto (a raiz invoca um `tsc` standalone depreciado).

## Ao terminar qualquer tarefa

Atualizar antes de encerrar a sessão:
- `TASKS_NOW.md` — marcar concluído, definir próxima ação
- `CHANGELOG.md` — se foi um marco relevante
- `DECISIONS.md` — se uma decisão arquitetural nova foi tomada

Nunca deixar a documentação desalinhada do código real.

## Comportamento esperado

- Se uma tarefa pedida contradiz algo em `DECISIONS.md` ou `PROJECT_PRINCIPLES.md`, apontar isso explicitamente antes de implementar — não seguir o pedido silenciosamente se ele reabre algo já decidido.
- Se não tiver certeza sobre um nome de coluna, rota ou assinatura de função, ler o arquivo real primeiro (o repositório está acessível via git) em vez de assumir.
- Preferir respostas objetivas; quando houver mais de uma alternativa técnica, listar vantagens/desvantagens de cada uma.