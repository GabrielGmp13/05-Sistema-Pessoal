# NAMING_CONVENTIONS.md

Padrões observados e a seguir daqui em diante. Onde já existe inconsistência no código atual, está marcado — não é motivo para reescrever tudo agora, mas todo código novo deve seguir o padrão descrito.

---

## Arquivos HTML

`kebab-case`, prefixado pelo módulo quando há mais de uma página: `treino-plano.html`, `treino-academia.html`, `treino-shape.html`. Página única de um módulo não leva prefixo redundante: `revisao.html`, `estudos.html`, não `estudos-estudos.html`.

## Páginas e componentes React (v2, desde DEC-018)

- Componentes: `PascalCase.tsx` — `CardExercicio.tsx`, `ModalObra.tsx`, `RatingEstrela.tsx`.
- Rotas (App Router): pasta em `kebab-case` seguindo a URL — `app/biblioteca/page.tsx`, `app/treino/plano/page.tsx`.
- Hooks: `camelCase` prefixado com `use` — `useSessao.ts`, `useObra.ts`.
- API Routes: `app/api/<recurso>/route.ts` — `app/api/tmdb/search/route.ts`.
- Módulos de lógica (`lib/`): nome curto, sem prefixo — `lib/supabase.ts`, `lib/auth.ts`, `lib/sm2.ts` (mesma convenção que já existia para `assets/*.js`).

## Classes CSS

*(sem mudança na convenção em si — kebab-case, prefixo por escopo — mas o "onde é definida" agora é: `globals.css` = compartilhado, `Componente.module.css` ou classe local do componente = com prefixo/escopo do componente, mesmo espírito do padrão antigo por página)*

## Scripts (`assets/`)

Nome curto, sem prefixo: `supabase.js`, `auth.js`, `sm2.js`.

## Tabelas SQL

Substantivo no plural, `snake_case`: `treinos`, `exercicios`, `sessoes_treino`, `materias`, `sessoes_questoes`.

## Colunas SQL

`snake_case`. Chave estrangeira sempre `<tabela_singular>_uuid` — nunca `_id`:

```
treino_uuid, exercicio_uuid, sessao_uuid, materia_uuid, assunto_uuid, documento_uuid
```

Exceção documentada: `revisao_espacada.referencia_uuid` é uma FK polimórfica genérica (não aponta para uma tabela fixa), por isso não segue o padrão `<tabela>_uuid`.

Sempre conferir contra `DATABASE.md` antes de escrever uma query — ver os gotchas já registrados lá.

## Funções JavaScript

`camelCase`, verbo + substantivo: `carregarTreinos()`, `salvarExercicio()`, `deletarCard()`, `renderCalendario()`.

## Variáveis JavaScript

`camelCase`: `userId`, `treinoAtivo`, `signedUrlsDoc`.


## Migrações SQL

`00N_nome-do-modulo.sql`, numeração sequencial de 3 dígitos: `001_schema_inicial.sql`, `002_estudos.sql`, `003_biblioteca.sql` (planejado).

## Módulos/Fases no roadmap

Fases numeradas (`Fase 1`, `Fase 2`...) para o roadmap principal; sub-fases da migração usam `M0`, `M1`, `M2`, `M3`. Não misturar os dois esquemas de numeração.