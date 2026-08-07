# DATABASE.md

Documento único de referência para o banco de dados. Qualquer dúvida sobre nome de tabela, coluna ou relacionamento é resolvida aqui — não em memória, não por suposição.

> **Nota de proveniência (2026-08):** este documento foi reconciliado contra um
> dump real do schema de produção (`pg_dump`/`supabase db dump`, extraído
> diretamente do Supabase). Antes dessa reconciliação, este arquivo e
> `DECISIONS.md` continham status de migration desatualizados (`014` e `019`
> marcadas como "pendente" quando já estavam executadas há semanas) e a
> definição de duas tabelas (`conteudos`, `questoes_individuais`) estava
> defasada em relação ao schema real. Tudo abaixo reflete o banco de produção
> como ele realmente está — não o que os arquivos `.sql` locais diziam.

---

## Convenção universal

Toda tabela do projeto segue este padrão:

```sql
uuid        TEXT PRIMARY KEY,               -- gerado no cliente: crypto.randomUUID()
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE            -- soft delete universal, nunca DELETE físico

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON <table>
  FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;
```

Chaves estrangeiras seguem `<tabela_singular>_uuid` (ex: `treino_uuid`, `materia_uuid`), nunca `_id`. Essa é a causa mais comum de bug neste projeto até agora — ver seção Gotchas.

**GRANT é obrigatório em toda migration, não opcional.** Projetos Supabase criados a partir de 2026-05-30 não recebem GRANT automático em nenhuma tabela nova, mesmo com RLS e policy corretos — sem o GRANT explícito para `authenticated`, a tabela fica inacessível via Data API (badge "API DISABLED" no dashboard) e o `supabase-js` recebe erro 42501 mesmo com policies válidas. RLS e GRANT são camadas independentes: GRANT decide se o papel alcança a tabela; RLS decide quais linhas ele vê dentro dela.

**Confirmado no dump real (2026-08):** são 44 tabelas em `public`; todas têm `ROW LEVEL SECURITY` habilitada, policy `user_own_data` (`auth.uid() = user_id`) e `GRANT ALL` para `authenticated`. Nenhuma tabela sem proteção. `anon` só recebe `REFERENCES, TRIGGER, TRUNCATE, MAINTAIN` (grants estruturais padrão do Supabase, sem `SELECT`/`INSERT`) — não representa acesso de dado. O número 46 que apareceu em versões anteriores deste documento era erro de contagem manual, não indicação de tabelas ausentes.

Índices parciais `WHERE NOT deleted` existem nas tabelas principais para acelerar as queries que sempre filtram registros ativos — confirmados no dump para praticamente todas as tabelas de alto volume (ver lista completa na seção Índices, ao final).

---

## Local dos arquivos de migration

`backend/supabase/migrations/*.sql` — **não** `supabase/migrations/` (caminho antigo, ainda mencionado em alguns documentos legados; já corrigido neste arquivo). Migrations são coladas manualmente no SQL Editor do Supabase pelo usuário — não existe Supabase CLI configurado neste projeto para aplicar migration via comando, apenas para operações pontuais de leitura (ex: `db dump`).

---

## Migrações

| Arquivo | Status real (confirmado via dump 2026-08) | Conteúdo |
|---|---|---|
| `001_schema_inicial.sql` | ✅ Executado | 8 tabelas do núcleo (treino, shape, cardio, agenda, revisão) |
| `002_estudos.sql` | ✅ Executado (v1, tabelas depois substituídas por `015`) | 5 tabelas do módulo de Estudos v1 |
| `003_biblioteca.sql` | ✅ Executado | 11 tabelas do módulo Biblioteca v1 — ver DEC-011, DEC-014 |
| `004_podcasts_itunes.sql` | ✅ Executado · 🔧 arquivo local recriado (ver nota abaixo) | Adiciona `itunes_id` e `capa_url` à tabela `podcasts` — ver DEC-016 |
| `005_treino_v2.sql` | ✅ Executado · 🔧 arquivo local recriado | Reestrutura Treino: `modulos_treino`, `exercicios_forca`/`exercicios_cardio`, `execucoes_forca`/`execucoes_cardio`. Remove `cardio`, `exercicios`, `series_executadas`. Ver DEC-020 |
| `006_biblioteca_v2_base.sql` | ✅ Executado | `generos` + 5 junções `*_generos`, campos comuns novos em `livros`/`filmes`/`series`/`mangas`/`podcasts`. Ver DEC-023 |
| `007_remover_tags.sql` | ✅ Executado · 🔧 arquivo local recriado | Remove `tags` e as 5 junções `*_tags`. Ver DEC-023 |
| `008_biblioteca_v2_b2.sql` | ✅ Executado | Colunas de produção em `filmes`/`series`, `series_temporadas`, `elenco`, `trilha_sonora`. Ver DEC-024 |
| `009_biblioteca_v2_b3.sql` | ✅ Executado | `animes`, `animes_generos`, `animes_temporadas`, `animes_episodios`, `openings_endings`, `animes_ordem_consumo`. Ver DEC-025 |
| `010_remover_tecnologias_filmes.sql` | ✅ Executado · 🔧 arquivo local recriado | Remove `filmes.tecnologias`. Ver DEC-026 |
| `011_biblioteca_v2_b4_mangas.sql` | ✅ Executado | Colunas de publicação em `mangas`, `mangas_volumes`. Ver DEC-028 |
| `012_biblioteca_v2_b5_livros.sql` | ✅ Executado | Colunas bibliográficas em `livros`, `livros_anotacoes`. Ver DEC-029 |
| `013_biblioteca_v2_b6_podcasts.sql` | ✅ Executado | Coluna `produtora` em `podcasts`. Ver DEC-030 |
| `014_nota_escala_dez.sql` | ✅ Executado · 🔧 arquivo local recriado | `nota` de `NUMERIC(2,1)` (1-5) para `NUMERIC(3,1)` (0-10) nas 6 tabelas de mídia + `CHECK` de faixa. **Confirmado no dump**: `nota NUMERIC(3,1)` com `CHECK (nota BETWEEN 0 AND 10)` presente em `filmes`, `series`, `animes`, `mangas`, `livros`, `podcasts`. Ver DEC-033 |
| `015_estudos_v2.sql` | ✅ Executado · ⚠️ **arquivo local estava corrompido, reescrito nesta sessão** (ver nota abaixo) | Estudos v2 (Fase 1/núcleo): `conteudos`, `anotacoes_estudo`, `materiais_estudo`, `sessoes_estudo`, `questoes_individuais`, `simulados`, `redacoes`. Ver DEC-035 |
| `016_estudos_v2_fase1b.sql` | ✅ Executado · ⚠️ **arquivo local estava corrompido, reescrito nesta sessão** | `conteudos_materias` (N:N), `modulos_curso`, `atividades`, `provas`, gabarito em `questoes_individuais`. Ver DEC-036 |
| `017_estudos_gabarito_enem_redacao.sql` | ✅ Executado | `materias.area_enem`; `redacoes.texto` nullable + `redacoes.imagem_path`. Ver DEC-041 |
| `018_materias_unicas_escola_enem.sql` | ✅ Executado | `materias.mostra_escola`/`mostra_enem`, limpeza de dado duplicado. Ver DEC-040 |
| `019_gabarito_dominio_dificuldade.sql` | ✅ Executado · 🔧 arquivo local recriado | `questoes_individuais.materia_uuid` nullable, `letra_marcada`/`letra_correta`/`dificuldade`; `conteudos.progresso` removido, `teoria_vista`/`dominado_manual` adicionados. Ver DEC-041/DEC-042 |

**🔧 Nota sobre arquivos recriados (2026-08):** seis migrations (`004`, `005`, `007`, `010`, `014`, `019`) nunca foram copiadas para a pasta local do projeto (falha de cópia manual do usuário para o VS Code, não perda de dado — todas estavam executadas no Supabase o tempo todo). Foram reconstruídas a partir do estado final observado no dump. Elas documentam o efeito pretendido, mas não são cópias dos scripts originais e a sequência completa ainda não foi validada por replay em banco vazio.

**⚠️ Nota sobre `015`/`016` corrompidas (2026-08):** os arquivos locais dessas duas migrations continham erros internos (colunas de uma tabela referenciadas em índice de outra, tabela referenciada antes de ser criada) — provavelmente uma cópia/colagem errada em sessão de chat anterior sobrescreveu o conteúdo correto. **O banco de produção nunca teve esse problema** — o que rodou no SQL Editor na época estava correto, só a cópia que ficou no repositório é que ficou malformada. Ambos os arquivos foram reescritos nesta sessão para bater exatamente com o dump real.

**⚠️ Replay local ainda pendente (confirmado por inspeção em 2026-08):** a cadeia `001`–`019` não deve ser tratada como reproduzível hoje. `002_estudos.sql` já contém `area_enem`, `mostra_escola` e `mostra_enem`, que `017`/`018` tentam adicionar novamente; `017` e `019` também repetem os nomes das constraints de `letra_marcada`/`letra_correta`. O schema de produção está confirmado pelo dump, mas corrigir o histórico exige tarefa dedicada e teste em banco descartável.

**Convenção para novas migrações:** numeração sequencial de 3 dígitos + nome do módulo em snake_case (`00N_nome-modulo.sql`). Depois de rodar no SQL Editor, atualizar a tabela acima e a seção correspondente deste documento — e, a partir de agora, **também rodar um novo `db dump` periodicamente** para evitar que o repositório volte a divergir do banco real sem que ninguém perceba.

---

## Schema — `001_schema_inicial.sql`

### `treinos`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
descricao   TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE,
modulo_uuid TEXT REFERENCES modulos_treino(uuid)   -- adicionada em 005_treino_v2.sql
```

### `sessoes_treino`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid TEXT NOT NULL REFERENCES treinos(uuid),
data_inicio TIMESTAMPTZ NOT NULL,
data_fim    TIMESTAMPTZ,
observacoes TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `shape`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data        DATE NOT NULL,
peso        NUMERIC(5,2),
foto_path   TEXT,  -- path no bucket 'shape', ex: '{user_id}/2024-01-15.jpg'
observacoes TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `agenda`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data        DATE NOT NULL,
treino_uuid TEXT REFERENCES treinos(uuid),
titulo      TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
> Schema existe e está ativo no banco; nenhuma tela do frontend consome esta tabela até agora (Agenda ainda não é módulo dedicado — ver `VISION.md`).

### `revisao_espacada`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
pergunta        TEXT NOT NULL,
resposta        TEXT,
modulo          TEXT,            -- 'treino', 'estudos', etc.
referencia_uuid TEXT,            -- FK polimórfica, sem REFERENCES físico
ef              NUMERIC(4,2) DEFAULT 2.5,
repeticoes      INTEGER DEFAULT 0,
intervalo_dias  INTEGER DEFAULT 1,
proxima_revisao DATE DEFAULT CURRENT_DATE,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
> Reaproveitada por Estudos v2 (SM-2, ver DEC-035) — cada conteúdo pode ter um card com `modulo = 'estudos'`, `referencia_uuid = conteudos.uuid`. Sem página dedicada de Revisão Espaçada na v2 ainda (ver `ROADMAP.md` → 7.4).

### Tabelas descontinuadas de `001`
`cardio`, `exercicios`, `series_executadas` — removidas em `005_treino_v2.sql`. Confirmado ausentes no dump real. Ver DEC-020.

---

## Schema — `002_estudos.sql` (v1 — tabelas substituídas)

`assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes` — todas removidas em `015_estudos_v2.sql`, confirmadas ausentes no dump real. `materias` (criada aqui) foi mantida e evoluiu — ver seção `016`/`017`/`018` abaixo para o schema atual dela.

---

## Schema — `003_biblioteca.sql` (v1 — parcialmente substituído)

Convenção de status por tipo (texto livre, sem `CHECK` constraint — validação fica no frontend):
- `livros`/`mangas`: `quero_ler` | `lendo` | `lido` | `pausado` | `abandonado`
- `filmes`: `quero_ver` | `assistido` | `abandonado`
- `series`: `quero_ver` | `assistindo` | `assistido` | `pausado` | `abandonado`
- `podcasts`: `quero_ouvir` | `ouvindo` | `concluido` | `pausado` | `abandonado`

`tags` e as 5 junções `*_tags` — removidas em `007_remover_tags.sql`, confirmadas ausentes no dump. Ver schema atual de `livros`/`filmes`/`series`/`mangas`/`podcasts` na seção Biblioteca v2, abaixo — os campos originais de `003` foram estendidos por `006`–`014`, não existe mais uma versão "pura" de `003`.

---

## Schema — Biblioteca v2 (`006`–`014`)

### `generos`
```sql
uuid       TEXT PRIMARY KEY,
user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome       TEXT NOT NULL,
descricao  TEXT,
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE
```

### `filmes` (schema atual completo, confirmado no dump)
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo             TEXT NOT NULL,
diretor            TEXT,
tmdb_id            TEXT,
capa_url           TEXT,
capa_path          TEXT,
status             TEXT DEFAULT 'quero_ver',
comentario         TEXT,
data_inicio        DATE,
data_fim           DATE,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE,
favorito           BOOLEAN DEFAULT FALSE,
vezes_consumido    INTEGER DEFAULT 0,
onde_consumi       TEXT,
valor_pago         NUMERIC(10,2),
banner_url         TEXT,
banner_path        TEXT,
classificacao_indicativa TEXT,
duracao_minutos    INTEGER,
link_imdb          TEXT,
link_mal           TEXT,
link_anilist       TEXT,
link_oficial       TEXT,
nota               NUMERIC(3,1),   -- 0.0 a 10.0, ver DEC-033
roteirista         TEXT,
produtores         TEXT,
estudio            TEXT,
distribuidora      TEXT,
orcamento          NUMERIC(14,2),
bilheteria         NUMERIC(14,2),
ano_lancamento     INTEGER,
anime_uuid         TEXT REFERENCES animes(uuid),   -- nulo = filme normal
tipo_complemento   TEXT,   -- 'filme' | 'ova' | 'ona' | 'special' — nulo = filme normal
CONSTRAINT filmes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```
> `tecnologias` não existe (removida em `010`, confirmado ausente no dump).

### `series` (schema atual completo)
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo             TEXT NOT NULL,
diretor            TEXT,
tmdb_id            TEXT,
capa_url           TEXT,
capa_path          TEXT,
temporada_atual    INTEGER DEFAULT 1,
episodio_atual     INTEGER DEFAULT 0,
status             TEXT DEFAULT 'quero_ver',
comentario         TEXT,
data_inicio        DATE,
data_fim           DATE,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE,
favorito           BOOLEAN DEFAULT FALSE,
vezes_consumido    INTEGER DEFAULT 0,
onde_consumi       TEXT,
valor_pago         NUMERIC(10,2),
banner_url         TEXT,
banner_path        TEXT,
classificacao_indicativa TEXT,
duracao_minutos    INTEGER,
link_imdb          TEXT,
link_mal           TEXT,
link_anilist       TEXT,
link_oficial       TEXT,
nota               NUMERIC(3,1),
roteirista         TEXT,
produtores         TEXT,
estudio            TEXT,
distribuidora      TEXT,
ano_lancamento     INTEGER,
ano_termino        INTEGER,
CONSTRAINT series_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```

### `animes` (schema atual completo)
```sql
uuid                     TEXT PRIMARY KEY,
user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome_original            TEXT NOT NULL,
nome_traduzido           TEXT,
capa_url                 TEXT,
capa_path                TEXT,
banner_url               TEXT,
banner_path              TEXT,
sinopse                  TEXT,
ano_lancamento           INTEGER,
ano_termino              INTEGER,
classificacao_indicativa TEXT,
duracao_minutos          INTEGER,
mal_id                   TEXT,
anilist_id               TEXT,
link_imdb                TEXT,
link_mal                 TEXT,
link_anilist             TEXT,
link_oficial             TEXT,
diretor                  TEXT,
roteirista               TEXT,
produtores               TEXT,
estudio                  TEXT,
distribuidora            TEXT,
character_designer       TEXT,
animador_chefe           TEXT,
compositor               TEXT,
status                   TEXT DEFAULT 'quero_ver',
nota                     NUMERIC(3,1),
comentario               TEXT,
data_inicio              DATE,
data_fim                 DATE,
favorito                 BOOLEAN DEFAULT FALSE,
vezes_consumido          INTEGER DEFAULT 0,
onde_consumi             TEXT,
valor_pago               NUMERIC(10,2),
updated_at               TIMESTAMPTZ DEFAULT NOW(),
deleted                  BOOLEAN DEFAULT FALSE,
CONSTRAINT animes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```

### `mangas` (schema atual completo)
```sql
uuid                   TEXT PRIMARY KEY,
user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo                 TEXT NOT NULL,
autor                  TEXT,
mal_id                 TEXT,
capa_url               TEXT,
capa_path              TEXT,
capitulo_atual         INTEGER DEFAULT 0,
status                 TEXT DEFAULT 'quero_ler',
comentario             TEXT,
data_inicio            DATE,
data_fim               DATE,
updated_at             TIMESTAMPTZ DEFAULT NOW(),
deleted                BOOLEAN DEFAULT FALSE,
favorito               BOOLEAN DEFAULT FALSE,
vezes_consumido        INTEGER DEFAULT 0,
onde_consumi           TEXT,
valor_pago             NUMERIC(10,2),
banner_url             TEXT,
banner_path            TEXT,
classificacao_indicativa TEXT,
duracao_minutos        INTEGER,
link_imdb              TEXT,
link_mal               TEXT,
link_anilist           TEXT,
link_oficial           TEXT,
nota                   NUMERIC(3,1),
titulo_traduzido       TEXT,
editora                TEXT,
status_publicacao      TEXT DEFAULT 'em_andamento',
ano_inicio_publicacao  INTEGER,
ano_fim_publicacao     INTEGER,
CONSTRAINT mangas_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```

### `livros` (schema atual completo)
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo             TEXT NOT NULL,
autor              TEXT,
isbn               TEXT,
google_books_id    TEXT,
capa_url           TEXT,
capa_path          TEXT,
paginas_total      INTEGER,
pagina_atual       INTEGER DEFAULT 0,
status             TEXT DEFAULT 'quero_ler',
comentario         TEXT,
data_inicio        DATE,
data_fim           DATE,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE,
favorito           BOOLEAN DEFAULT FALSE,
vezes_consumido    INTEGER DEFAULT 0,
onde_consumi       TEXT,
valor_pago         NUMERIC(10,2),
banner_url         TEXT,
banner_path        TEXT,
classificacao_indicativa TEXT,
duracao_minutos    INTEGER,
link_imdb          TEXT,
link_mal           TEXT,
link_anilist       TEXT,
link_oficial       TEXT,
nota               NUMERIC(3,1),
editora            TEXT,
idioma             TEXT,
formato            TEXT DEFAULT 'fisico',
ano_publicacao     INTEGER,
CONSTRAINT livros_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```

### `podcasts` (schema atual completo)
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo             TEXT NOT NULL,
capa_path          TEXT,
episodio_atual     INTEGER DEFAULT 0,
status             TEXT DEFAULT 'ouvindo',
comentario         TEXT,
data_inicio        DATE,
data_fim           DATE,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE,
itunes_id          TEXT,
capa_url           TEXT,
favorito           BOOLEAN DEFAULT FALSE,
vezes_consumido    INTEGER DEFAULT 0,
onde_consumi       TEXT,
valor_pago         NUMERIC(10,2),
banner_url         TEXT,
banner_path        TEXT,
classificacao_indicativa TEXT,
duracao_minutos    INTEGER,
link_imdb          TEXT,
link_mal           TEXT,
link_anilist       TEXT,
link_oficial       TEXT,
nota               NUMERIC(3,1),
produtora          TEXT,
CONSTRAINT podcasts_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10))
```
> Sem campo de autor/diretor dedicado — `artistName` da iTunes API vai em `produtora`.

### Tabelas de junção `*_generos`
Todas seguem o mesmo padrão — `uuid`, `user_id`, `<tipo_singular>_uuid`, `genero_uuid`, `updated_at`, `deleted`:

| Tabela | FK do item |
|---|---|
| `filmes_generos` | `filme_uuid` |
| `series_generos` | `serie_uuid` |
| `animes_generos` | `anime_uuid` |
| `mangas_generos` | `manga_uuid` |
| `livros_generos` | `livro_uuid` |
| `podcasts_generos` | `podcast_uuid` |

### `series_temporadas` / `animes_temporadas`
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
serie_uuid | anime_uuid  TEXT NOT NULL REFERENCES series(uuid) | animes(uuid),
numero            INTEGER NOT NULL,
numero_episodios  INTEGER,
nota_imdb         NUMERIC(3,1),
minha_nota        NUMERIC(2,1),
data_assisti      DATE,
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE
```

### `animes_episodios`
```sql
uuid           TEXT PRIMARY KEY,
user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
temporada_uuid TEXT NOT NULL REFERENCES animes_temporadas(uuid),
numero         INTEGER NOT NULL,
titulo         TEXT,
arco           TEXT,
filler         BOOLEAN DEFAULT FALSE,
assistido      BOOLEAN DEFAULT FALSE,
updated_at     TIMESTAMPTZ DEFAULT NOW(),
deleted        BOOLEAN DEFAULT FALSE
```

### `elenco`
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tipo_obra          TEXT NOT NULL,   -- 'filme' | 'serie' | 'anime'
obra_uuid          TEXT NOT NULL,   -- FK polimórfica, sem REFERENCES físico
ator               TEXT NOT NULL,
personagem         TEXT,
foto_url           TEXT,
ordem              INTEGER DEFAULT 0,
dublador_original  TEXT,
dublador_br        TEXT,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE
```

### `trilha_sonora`
```sql
uuid                TEXT PRIMARY KEY,
user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tipo_obra           TEXT NOT NULL,
obra_uuid           TEXT NOT NULL,
nome                TEXT NOT NULL,
artista             TEXT,
duracao_segundos    INTEGER,
link_spotify        TEXT,
link_youtube_music  TEXT,
ordem               INTEGER DEFAULT 0,
updated_at          TIMESTAMPTZ DEFAULT NOW(),
deleted             BOOLEAN DEFAULT FALSE
```

### `openings_endings`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid  TEXT NOT NULL REFERENCES animes(uuid),
tipo        TEXT NOT NULL,   -- 'opening' | 'ending'
nome        TEXT NOT NULL,
artista     TEXT,
link_video  TEXT,
minha_nota  NUMERIC(2,1),
ordem       INTEGER DEFAULT 0,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `animes_ordem_consumo`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid       TEXT NOT NULL REFERENCES animes(uuid),
ordem            INTEGER NOT NULL,
tipo_referencia  TEXT NOT NULL,   -- 'temporada' | 'complemento'
referencia_uuid  TEXT NOT NULL,   -- FK polimórfica
rotulo           TEXT NOT NULL,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

### `mangas_volumes`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
manga_uuid    TEXT NOT NULL REFERENCES mangas(uuid),
numero        INTEGER NOT NULL,
arco          TEXT,
cor           TEXT,
lido          BOOLEAN DEFAULT FALSE,
data_leitura  DATE,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```

### `livros_anotacoes`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
livro_uuid  TEXT NOT NULL REFERENCES livros(uuid),
tipo        TEXT DEFAULT 'anotacao' NOT NULL,  -- 'anotacao' | 'citacao'
pagina      INTEGER,
texto       TEXT NOT NULL,
favorito    BOOLEAN DEFAULT FALSE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

---

## Schema — Treino v2 (`005_treino_v2.sql`)

### `modulos_treino`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
cor         TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `exercicios_forca`
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
nome               TEXT NOT NULL,
series_alvo        INTEGER,
reps_alvo          INTEGER,
carga_alvo         NUMERIC(6,2),
descanso_segundos  INTEGER,
imagem_path        TEXT,
ordem              INTEGER DEFAULT 0,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE
```

### `exercicios_cardio`
```sql
uuid                  TEXT PRIMARY KEY,
user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid           TEXT NOT NULL REFERENCES treinos(uuid),
nome                  TEXT NOT NULL,
distancia_alvo_km     NUMERIC(6,3),
duracao_alvo_minutos  INTEGER,
imagem_path           TEXT,
ordem                 INTEGER DEFAULT 0,
updated_at            TIMESTAMPTZ DEFAULT NOW(),
deleted               BOOLEAN DEFAULT FALSE
```

### `execucoes_forca`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid  TEXT NOT NULL REFERENCES exercicios_forca(uuid),
serie_numero    INTEGER,
carga_real      NUMERIC(6,2),
reps_real       INTEGER,
concluida       BOOLEAN DEFAULT FALSE,
data_hora       TIMESTAMPTZ DEFAULT NOW(),
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```

### `execucoes_cardio`
```sql
uuid                  TEXT PRIMARY KEY,
user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid           TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid        TEXT NOT NULL REFERENCES exercicios_cardio(uuid),
concluido             BOOLEAN DEFAULT FALSE,
distancia_real_km     NUMERIC(6,3),
duracao_real_minutos  INTEGER,
data_hora             TIMESTAMPTZ DEFAULT NOW(),
updated_at            TIMESTAMPTZ DEFAULT NOW(),
deleted               BOOLEAN DEFAULT FALSE
```

---

## Schema — Estudos v2 (`015`, `016`, `017`, `018`, `019` — schema final consolidado)

> Este bloco documenta o **schema final atual**, já com todas as alterações de
> `016`–`019` aplicadas — não o estado intermediário de cada migration
> isolada. Para o histórico de qual migration mudou o quê, ver `DECISIONS.md`
> (DEC-035, 036, 040, 041, 042) e a tabela de migrations no topo deste arquivo.

### `materias`
```sql
uuid                       TEXT PRIMARY KEY,
user_id                    UUID NOT NULL REFERENCES auth.users(id),  -- ⚠️ sem ON DELETE CASCADE, ver Gotchas
nome                       TEXT NOT NULL,
tipo                       TEXT NOT NULL DEFAULT 'escola',  -- sem CHECK constraint no banco, ver Gotchas
cor                        TEXT,
updated_at                 TIMESTAMPTZ DEFAULT NOW(),
deleted                    BOOLEAN DEFAULT FALSE,
plataforma                 TEXT,      -- uso: tipo = 'curso'
carga_horaria_total_horas  NUMERIC(6,1),
horas_dedicadas            NUMERIC(6,1) DEFAULT 0,
certificado_path           TEXT,
concluido                  BOOLEAN DEFAULT FALSE,
data_conclusao             DATE,
area_enem                  TEXT,      -- CHECK: 'linguagens'|'humanas'|'natureza'|'matematica'
mostra_escola               BOOLEAN NOT NULL DEFAULT FALSE,
mostra_enem                 BOOLEAN NOT NULL DEFAULT FALSE,
CONSTRAINT materias_area_enem_check CHECK (area_enem IS NULL OR area_enem IN ('linguagens','humanas','natureza','matematica'))
```
> **Gotcha confirmado no dump:** o `DEFAULT` da coluna `tipo` continua `'escola'`
> (não foi alterado para `'academica'` quando a DEC-040 foi aplicada — a
> migration só mudou os dados existentes, não o valor padrão da coluna).
> Como não existe `CHECK` sobre `tipo`, isso não quebra nada tecnicamente
> (o banco aceita qualquer texto), mas uma matéria criada sem passar `tipo`
> explicitamente nasce como `'escola'`, não `'academica'`. Conferir se
> `lib/materias.ts` sempre passa `tipo: 'academica'` explicitamente ao criar
> matéria acadêmica — não depender do default do banco.

### `conteudos`
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome              TEXT NOT NULL,
revisao_uuid      TEXT,   -- FK polimórfica pra revisao_espacada.uuid, sem REFERENCES físico
modulo_curso_uuid TEXT REFERENCES modulos_curso(uuid),
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE,
teoria_vista      BOOLEAN NOT NULL DEFAULT FALSE,
dominado_manual   BOOLEAN NOT NULL DEFAULT FALSE
```
> Sem `materia_uuid` (vínculo é N:N via `conteudos_materias`, DEC-036) e sem
> `progresso` (removido em `019`, DEC-042). "Dominado" é calculado, não
> gravado: `dominado_manual = true OR revisao_espacada.repeticoes >= 5`.

### `conteudos_materias`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```

### `modulos_curso`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),  -- o curso
nome         TEXT NOT NULL,
ordem        INTEGER DEFAULT 0,
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `atividades`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
titulo        TEXT NOT NULL,
data_entrega  DATE,
feita         BOOLEAN DEFAULT FALSE,
entregue      BOOLEAN DEFAULT FALSE,
observacoes   TEXT,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```

### `provas`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT REFERENCES materias(uuid),
tipo          TEXT NOT NULL DEFAULT 'escola',  -- 'escola' | 'enem_dia1' | 'enem_dia2' | 'curso' | 'outro'
conteudo_uuid TEXT REFERENCES conteudos(uuid),
titulo        TEXT,
data          DATE NOT NULL,
tempo_minutos INTEGER,
redacao_uuid  TEXT REFERENCES redacoes(uuid),
nota          NUMERIC(5,1),
feita         BOOLEAN DEFAULT FALSE,
observacoes   TEXT,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```

### `questoes_individuais`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT REFERENCES materias(uuid),   -- nullable — só decidida na fase "corrigir" do gabarito
conteudo_uuid TEXT REFERENCES conteudos(uuid),
acertou       BOOLEAN,                          -- nullable — NULL = pendente OU perdida (ver letra_correta)
data          DATE NOT NULL,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE,
prova_uuid    TEXT REFERENCES provas(uuid),
numero        INTEGER,
motivo_erro   TEXT,
letra_marcada TEXT,   -- CHECK: A-E ou NULL
letra_correta TEXT,   -- CHECK: A-E ou NULL — NULL = correção ainda pendente
dificuldade   TEXT,   -- CHECK: 'facil' | 'medio' | 'dificil' ou NULL
CONSTRAINT questoes_individuais_letra_marcada_check CHECK (letra_marcada IS NULL OR letra_marcada IN ('A','B','C','D','E')),
CONSTRAINT questoes_individuais_letra_correta_check CHECK (letra_correta IS NULL OR letra_correta IN ('A','B','C','D','E')),
CONSTRAINT questoes_individuais_dificuldade_check CHECK (dificuldade IS NULL OR dificuldade IN ('facil','medio','dificil'))
```
> **Corrigido nesta reconciliação:** a versão anterior deste documento
> mostrava `materia_uuid TEXT NOT NULL` e `acertou BOOLEAN NOT NULL`, e não
> listava `letra_marcada`/`letra_correta`/`dificuldade` — estava desatualizada
> em relação ao schema real (que já reflete DEC-041/042 corretamente desde
> que `019` foi executada). Sem `prova_uuid`, uma linha é questão avulsa; com
> `prova_uuid`, é uma linha do gabarito digital de uma prova oficial.

### `sessoes_estudo`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid     TEXT NOT NULL REFERENCES materias(uuid),
conteudo_uuid    TEXT REFERENCES conteudos(uuid),
inicio           TIMESTAMPTZ NOT NULL,
fim              TIMESTAMPTZ,
duracao_minutos  INTEGER,
observacoes      TEXT,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```
> Schema existe e confere com o banco real. Sem página no frontend ainda.

### `materiais_estudo`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
tipo          TEXT NOT NULL DEFAULT 'link',  -- 'link' | 'pdf' | 'video' | 'livro' | 'outro'
titulo        TEXT NOT NULL,
url           TEXT,
arquivo_path  TEXT,   -- bucket 'documentos'
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
> Schema existe e confere com o banco real. Sem página no frontend ainda.

### `anotacoes_estudo`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
conteudo_uuid TEXT REFERENCES conteudos(uuid),
titulo        TEXT,
corpo         TEXT NOT NULL,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
> Schema existe e confere com o banco real. Sem página no frontend ainda.

### `simulados`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid    TEXT REFERENCES materias(uuid),
data            DATE NOT NULL,
total_questoes  INTEGER NOT NULL,
total_acertos   INTEGER NOT NULL DEFAULT 0,
tempo_minutos   INTEGER,
observacoes     TEXT,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE,
conteudo_uuid   TEXT REFERENCES conteudos(uuid),  -- preenchido = dispara SM-2
redacao_uuid    TEXT REFERENCES redacoes(uuid)    -- só simulado do dia 1 do ENEM
```
> **Regra de negócio:** só `simulados` alimenta `revisao_espacada`/SM-2.
> `provas` (evento oficial) nunca dispara SM-2, mesmo com `conteudo_uuid`
> indiretamente via `questoes_individuais`.

### `redacoes`
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tema          TEXT NOT NULL,
texto         TEXT,             -- nullable desde 017 — permite registrar só a foto
nota          NUMERIC(4,1),
comentario    TEXT,
data          DATE NOT NULL,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE,
competencia_1 NUMERIC(5,1),   -- 0-200
competencia_2 NUMERIC(5,1),
competencia_3 NUMERIC(5,1),
competencia_4 NUMERIC(5,1),
competencia_5 NUMERIC(5,1),
imagem_path   TEXT,          -- bucket 'redacoes', foto da folha manuscrita
CONSTRAINT redacoes_competencia_1_check CHECK (competencia_1 IS NULL OR competencia_1 BETWEEN 0 AND 200)
-- (mesma CHECK para competencia_2..5)
```

### Tabelas descontinuadas de Estudos v1
`assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes` — confirmadas ausentes no dump. Ver DEC-035.

---

## Storage

O `schema_real.sql` atual contém apenas o schema `public` e **não permite confirmar a quantidade nem o inventário de buckets existentes em produção**. O que o repositório comprova é:

- `001_schema_inicial.sql` provisiona `shape`, `documentos` e `capas` como privados e cria suas policies;
- `017_estudos_gabarito_enem_redacao.sql` instrui criar `redacoes` manualmente, e `frontend/lib/redacoes.ts` implementa upload/signed URL/remoção nesse nome;
- `exercicios` aparece como bucket planejado na documentação, mas não possui criação ou policy versionada;
- o frontend usa efetivamente `shape` e contém integração para `redacoes`; isso não substitui consultar `storage.buckets` no Supabase.

Até uma consulta direta (`SELECT id, name, public FROM storage.buckets ORDER BY 1`) ser registrada, a documentação não atribui um total confirmado de buckets de produção. A decisão permanente continua sendo mantê-los privados e usar signed URLs/path `{user_id}/arquivo.ext` (DEC-010).

> ⚠️ **Pendência:** `banner_path` (existente desde `006_biblioteca_v2_base.sql`) não tem bucket de Storage definido — só `banner_url` (link externo) funciona hoje. Ver `BACKLOG.md`.

---

## Índices parciais confirmados no dump (`WHERE NOT deleted`)

Confirmados em: `agenda`, `animes`, `animes_episodios`, `animes_temporadas`, `anotacoes_estudo` (×2, conteúdo e matéria), `atividades`, `conteudos_materias` (×2), `elenco`, `exercicios_cardio`, `exercicios_forca`, `filmes` (×2, incluindo `anime_uuid`), `generos`, `livros`, `livros_anotacoes`, `mangas`, `mangas_volumes`, `materiais_estudo`, `materias`, `modulos_curso`, `modulos_treino`, `animes_ordem_consumo`, `podcasts`, `provas` (por `data`), `questoes_individuais` (×3: conteúdo, matéria, prova), `redacoes` (por `data`), `revisao_espacada` (por `proxima_revisao`), `series`, `series_temporadas`, `sessoes_treino` (×2), `sessoes_estudo` (×2), `shape`, `simulados` (×2), `treinos` (por `modulo_uuid`), `trilha_sonora`.

---

## Gotchas — nomes de coluna que já causaram bugs

| Tabela | Nome usado incorretamente | Nome real | Onde apareceu |
|---|---|---|---|
| `exercicios` (v1) | `treino_id` | `treino_uuid` | Rascunho inicial de `treino-plano.html` |
| `exercicios` (v1) | `grupo_muscular` | *(não existe)* | Mesmo arquivo |
| `sessoes_treino` | `treino_id`, `data` | `treino_uuid`, `data_inicio` | `treino-academia.html` — corrigido |
| `series_executadas` (v1) | `exercicio_id`, `sessao_id`, `serie_num`, `peso`, `repeticoes` | `exercicio_uuid`, `sessao_uuid`, `serie_numero`, `carga_real`, `reps_real` | `treino-academia.html` — corrigido |
| `revisao_espacada` | `frente`, `verso`, `intervalo`, `fator` | `pergunta`, `resposta`, `intervalo_dias`, `ef` | `revisao.html` (v1) — corrigido |

**Gotcha (GRANT ausente, 2026-07):** migrations `001`–`003` foram executadas sem `GRANT` explícito — corrigido retroativamente via `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`. Toda migration desde então inclui a linha por tabela. **Confirmado no dump 2026-08:** todas as 44 tabelas atuais de `public` têm o GRANT correto.

**Gotcha (cascade de deleção de usuário):** quase todas as tabelas usam `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` — apagar um usuário em Authentication → Users apaga em cascata todos os dados dele, sem confirmação extra, sem backup no free tier. Confirmado na prática em 2026-07-13 (ver `CHANGELOG.md`). **Nunca deletar um usuário sem certeza absoluta.**

**Gotcha NOVO confirmado no dump (2026-08): `materias.user_id` é a única FK do projeto sem `ON DELETE CASCADE`** (`REFERENCES auth.users(id)` puro, sem cláusula de cascata). Na prática, apagar o usuário deixaria linhas de `materias` órfãs (ou o `DELETE` falharia, dependendo de outras constraints) em vez de limpar em cascata como nas outras 43 tabelas. Não é um bug ativo (nenhuma tela depende desse comportamento), mas é uma inconsistência real que vale corrigir numa migration futura (`ALTER TABLE materias DROP CONSTRAINT materias_user_id_fkey, ADD CONSTRAINT materias_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`) — não fazer isso às pressas, é baixo risco mas deve ser feito deliberadamente, não como parte de uma migration de feature.

**Gotcha NOVO confirmado no dump (2026-08): `materias.tipo` nunca teve `CHECK constraint`.** A coluna é `TEXT` livre — a DEC-040 ("tipo perde 'enem'/'escola', ganha 'academica'") é uma convenção de aplicação, não é imposta pelo banco. Isso significa que um bug de frontend poderia gravar `tipo = 'enem'` de novo sem o banco reclamar. Considerar adicionar `CHECK (tipo IN ('academica','curso','olimpiada','outro'))` numa migration futura, depois de confirmar com o código real quais valores `lib/materias.ts` efetivamente usa hoje.

**Gotcha (tipos `Input` vs. update parcial, Biblioteca v2):** `MangaVolumeInput`/`AnimeEpisodioInput` exigiam `numero` obrigatório, mas os editores usam `atualizarVolume()`/`atualizarEpisodio()` para toggles simples sem reenviar `numero`. Corrigido criando tipos `XxxUpdate` (Partial completo) separados dos tipos `Input` de criação. Padrão a seguir daqui em diante.

**Gotcha (arquivo sobrescrito por engano, Biblioteca v2):** `AnotacoesLivroEditor.tsx` foi acidentalmente sobrescrito com lógica de `VolumesEditor.tsx` numa correção em massa — os dois componentes têm estrutura muito parecida. Corrigido em 2026-07-18. Atenção redobrada com reaproveitamento de correção automática entre componentes de "mesma forma".

**Gotcha (migrations locais divergindo do banco, 2026-08):** seis arquivos de migration nunca foram copiados para o VS Code (falha de cópia manual, não perda de dado) e dois outros (`015`, `016`) tinham conteúdo corrompido no repositório enquanto o banco real estava correto. Ver seção "Migrações" no topo deste documento para o que foi feito. **Lição:** rodar `supabase db dump` periodicamente e comparar contra os arquivos locais evita que essa divergência se acumule silenciosamente de novo.
