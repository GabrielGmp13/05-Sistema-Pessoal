# NAMING_CONVENTIONS.md

Padrões observados e a seguir daqui em diante. Onde já existe inconsistência no código atual, está marcado — não é motivo para reescrever tudo agora, mas todo código novo deve seguir o padrão descrito.

---

## Arquivos HTML

`kebab-case`, prefixado pelo módulo quando há mais de uma página: `treino-plano.html`, `treino-academia.html`, `treino-shape.html`. Página única de um módulo não leva prefixo redundante: `revisao.html`, `estudos.html`, não `estudos-estudos.html`.

## Páginas e componentes React (v2, desde DEC-018)

- Componentes: `PascalCase.tsx` — `CardExercicio.tsx`, `ModalObra.tsx`, `RatingEstrela.tsx`.
- Rotas (App Router): pasta em `kebab-case` seguindo a URL — `app/biblioteca/page.tsx`, `app/treino/plano/page.tsx`.
**Exceção (DEC-032):** módulos com navegação por categoria interna (ex:
  Biblioteca) usam uma única página consolidada
  (`app/<modulo>/page.tsx`) em vez de uma rota por subcategoria — a
  categoria ativa é estado de cliente, não segmento de URL. Componente de
  layout do módulo fica em `app/<modulo>/layout.tsx`.
- Hooks: `camelCase` prefixado com `use` — `useSessao.ts`, `useObra.ts`.
- API Routes: `app/api/<recurso>/route.ts` — `app/api/tmdb/search/route.ts`.
- Módulos de lógica (`lib/`): nome curto, sem prefixo — `lib/supabase.ts`, `lib/revisao.ts`, `lib/materias.ts` (mesma convenção que já existia para `assets/*.js` na v1).
- Proteção de rota: `proxy.ts` (raiz de `frontend/`, não raiz do repositório) — não `middleware.ts`,
 convenção renomeada pelo Next.js 16. Ver ARCHITECTURE.md e DEC-031.

## Classes CSS

*(sem mudança na convenção em si — kebab-case, prefixo por escopo — mas o "onde é definida" agora é: `globals.css` = compartilhado, `Componente.module.css` ou classe local do componente = com prefixo/escopo do componente, mesmo espírito do padrão antigo por página)*

## Scripts (`assets/`)

Nome curto, sem prefixo: `supabase.js`, `auth.js`, `sm2.js`.

## Tabelas SQL

Substantivo no plural, `snake_case`: `treinos`, `exercicios_forca`, `sessoes_treino`, `materias`, `questoes_individuais`. (`sessoes_questoes` e `assuntos` eram nomes da v1 de Estudos, removidos em `015_estudos_v2.sql` — não usar como referência de nome novo, ver `DATABASE.md`.)

## Colunas SQL

`snake_case`. Chave estrangeira sempre `<tabela_singular>_uuid` — nunca `_id`:

```
treino_uuid, exercicio_uuid, sessao_uuid, materia_uuid, conteudo_uuid, prova_uuid
```

Exceção documentada: `revisao_espacada.referencia_uuid` é uma FK polimórfica genérica (não aponta para uma tabela fixa), por isso não segue o padrão `<tabela>_uuid`. Mesmo padrão em `elenco.obra_uuid`/`trilha_sonora.obra_uuid` (Biblioteca) e `animes_ordem_consumo.referencia_uuid`.

Sempre conferir contra `DATABASE.md` antes de escrever uma query — ver os gotchas já registrados lá, incluindo os dois achados de 2026-08 (`materias.user_id` sem `ON DELETE CASCADE`, `materias.tipo` sem `CHECK`).

## Funções JavaScript

`camelCase`, verbo + substantivo: `carregarTreinos()`, `salvarExercicio()`, `deletarCard()`, `renderCalendario()`.

## Variáveis JavaScript

`camelCase`: `userId`, `treinoAtivo`, `signedUrlsDoc`.


## Migrações SQL

Timestamp UTC de 14 dígitos + descrição em `snake_case`, por exemplo
`20260808093000_ajuste_materias.sql`. A cadeia ativa fica em
`backend/supabase/migrations/`; os arquivos `001`–`019` são acervo em
`backend/supabase/history/legacy-migrations/` e não podem ser reutilizados.
Nunca editar migration já aplicada.

## Módulos/Fases no roadmap

Fases numeradas (`Fase 1`, `Fase 2`...) para o roadmap principal; sub-fases da migração usam `M0`, `M1`, `M2`, `M3`. Não misturar os dois esquemas de numeração.
