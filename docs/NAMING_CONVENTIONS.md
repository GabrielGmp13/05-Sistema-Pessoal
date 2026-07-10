# NAMING_CONVENTIONS.md

Padrões observados e a seguir daqui em diante. Onde já existe inconsistência no código atual, está marcado — não é motivo para reescrever tudo agora, mas todo código novo deve seguir o padrão descrito.

---

## Arquivos HTML

`kebab-case`, prefixado pelo módulo quando há mais de uma página: `treino-plano.html`, `treino-academia.html`, `treino-shape.html`. Página única de um módulo não leva prefixo redundante: `revisao.html`, `estudos.html`, não `estudos-estudos.html`.

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

## Classes CSS

`kebab-case`. Regra: **o local onde a classe é definida decide se ela leva prefixo.**

- Classe definida em `style.css` (compartilhada de verdade, usada por múltiplas páginas) → sem prefixo: `.btn-sm`, `.modal-overlay`, `.toast`, `.card`.
- Classe definida dentro do `<style>` de uma página específica → leva o prefixo daquela página: `.rev-card` (revisão), `.cal-cell` (calendário em `treino.html`), `.ex-card` (academia).

Motivo: cada página hoje tem seu próprio bloco `<style>` isolado, então não há colisão real agora. Mas se esse CSS um dia for consolidado em `style.css`, duas páginas com nomes genéricos parecidos (`.card-item`, por exemplo) colidiriam. O prefixo é a garantia barata contra isso — não muda nada no código existente, só orienta o que vem depois.

## Migrações SQL

`00N_nome-do-modulo.sql`, numeração sequencial de 3 dígitos: `001_schema_inicial.sql`, `002_estudos.sql`, `003_biblioteca.sql` (planejado).

## Módulos/Fases no roadmap

Fases numeradas (`Fase 1`, `Fase 2`...) para o roadmap principal; sub-fases da migração usam `M0`, `M1`, `M2`, `M3`. Não misturar os dois esquemas de numeração.