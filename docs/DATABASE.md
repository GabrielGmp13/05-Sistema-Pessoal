# DATABASE.md

Documento único de referência para o banco de dados. Qualquer dúvida sobre nome de tabela, coluna ou relacionamento é resolvida aqui — não em memória, não por suposição.

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
Índices parciais `WHERE NOT deleted` existem nas tabelas principais para acelerar as queries que sempre filtram registros ativos.


---

## Migrações

| Arquivo | Status | Conteúdo |
|---|---|---|
| `001_schema_inicial.sql` | ✅ Executado e verificado no Supabase | 8 tabelas do núcleo (treino, shape, cardio, agenda, revisão) |
| `002_estudos.sql` | ✅ Executado e verificado no Supabase (2026-07-11) | 5 tabelas do módulo de Estudos |
| `003_biblioteca.sql` | ✅ Executado e verificado no Supabase (2026-07-11) | 11 tabelas do módulo Biblioteca — ver DEC-011, DEC-014 |
| `004_podcasts_itunes.sql` | ✅ Executado e verificado no Supabase (2026-07-13) | Adiciona `itunes_id` e `capa_url` à tabela `podcasts` — ver DEC-016 |
| `005_treino_v2.sql` | ✅ Executado e verificado no Supabase (2026-07-15) | Reestrutura Treino: `modulos_treino` (novo), `treinos.modulo_uuid` (novo), `exercicios_forca`/`exercicios_cardio` (substituem `exercicios`), `execucoes_forca`/`execucoes_cardio` (substituem `series_executadas`). Descontinua `cardio`. Ver DEC-020 |
| `006_biblioteca_v2_base.sql` | ✅ Executado e verificado no Supabase (2026-07-16) | Biblioteca v2 sub-fase B1: tabela `generos` + 5 junções `*_generos`, campos comuns novos (favorito, nota-estrela, banner, links etc.) em `livros`/`filmes`/`series`/`mangas`/`podcasts`. Ver DEC-023 |
| `007_remover_tags.sql` | ✅ Executado e verificado no Supabase (2026-07-16) | Remove `tags` e as 5 junções `*_tags`, descontinuadas em favor de `generos`. Ver DEC-023 |
| `008_biblioteca_v2_b2.sql` | ✅ Executado e verificado no Supabase (2026-07-17) | Biblioteca v2 sub-fase B2: colunas de produção em `filmes`/`series`, tabela `series_temporadas`, tabelas polimórficas `elenco` e `trilha_sonora`. Ver DEC-024 |
| `009_biblioteca_v2_b3.sql` | ✅ Executado e verificado no Supabase (2026-07-17) | Biblioteca v2 sub-fase B3: tabela `animes`, `animes_generos`, `animes_temporadas`, `animes_episodios` (granularidade com filler), `openings_endings`, `animes_ordem_consumo` (FK polimórfica); estende `elenco` com `dublador_original`/`dublador_br`; `filmes` ganha `anime_uuid`/`tipo_complemento` (complementos são filmes reais). Ver DEC-025 |
| `010_remover_tecnologias_filmes.sql` | ✅ Executado e verificado no Supabase (2026-07-17) | Remove `filmes.tecnologias` (criada em `008`), descartada de escopo antes do frontend consumi-la. Ver DEC-026 |
| `011_biblioteca_v2_b4_mangas.sql` | ✅ Executado no Supabase (2026-07-18) | Biblioteca v2 sub-fase B4: colunas de publicação em `mangas` (`titulo_traduzido`, `editora`, `status_publicacao`, período), tabela `mangas_volumes` (volumes agrupados por arco, com cor de identificação). Ver DEC-028 |
| `012_biblioteca_v2_b5_livros.sql` | ✅ Executado no Supabase (2026-07-18) | Biblioteca v2 sub-fase B5: colunas bibliográficas/leitura em `livros` (`editora`, `idioma`, `formato`, `ano_publicacao`), tabela `livros_anotacoes` (anotações e citações favoritas). Ver DEC-029 |
| `013_biblioteca_v2_b6_podcasts.sql` | ✅ Executado no Supabase (2026-07-18) | Biblioteca v2 sub-fase B6: coluna `produtora` em `podcasts` (sai do prefixo solto em `comentario`, ver DEC-016). Sem tabela nova. Ver DEC-030 |
| `014_nota_escala_dez.sql` | 🔄 Criada, execução pendente | Altera `nota` de `NUMERIC(2,1)` (1-5) para `NUMERIC(3,1)` (0-10) nas 6 tabelas de mídia da Biblioteca + constraint de faixa. Ver DEC-033 |
| `015_estudos_v2.sql` | 🔄 Criada, execução pendente | Estudos v2 (Fase 1/núcleo): substitui `assuntos`/`anotacoes`/`documentos_estudo`/`sessoes_questoes` por `conteudos`/`anotacoes_estudo`/`materiais_estudo`/`questoes_individuais`; adiciona `sessoes_estudo`, `simulados`, `redacoes`. `materias` mantida sem alteração. Ver DEC-035 |
| `016_estudos_v2_fase1b.sql` | ✅ Executado e verificado no Supabase (2026-07-23) | Estudos v2 Fase 1B: conteúdos passam a N:N com matérias (`conteudos_materias`), suporte a Cursos (`modulos_curso`), `atividades` (Escola/Curso), `provas` (agendamento/oficial), gabarito individual em `questoes_individuais` (`prova_uuid`/`numero`/`motivo_erro`), `simulados` ganha `conteudo_uuid` (dispara SM-2) e `redacao_uuid`, `materias` ganha campos de curso, `redacoes` ganha notas por competência. Ver DEC-036 |
| `017_estudos_gabarito_enem_redacao.sql` | ✅ Executado e verificado no Supabase (2026-08) | Adiciona `materias.area_enem`; `redacoes.texto` vira nullable + `redacoes.imagem_path` (foto da folha manuscrita). Ver DEC-041 |
| `018_materias_unicas_escola_enem.sql` | ✅ Executado e verificado no Supabase (2026-08) | Reverte duplicação de matéria (uma linha `tipo='escola'` + outra `tipo='enem'`, erro introduzido nesta mesma sessão) — matéria volta a ser linha única, ganha `mostra_escola`/`mostra_enem` (bool). Limpa dado de teste duplicado em cascata (`conteudos_materias`, `provas`, `atividades`, `questoes_individuais`, `simulados`, `sessoes_estudo`, `anotacoes_estudo`). Ver DEC-040 |
| `019_gabarito_dominio_dificuldade.sql` | ✅ Executado e verificado no Supabase (2026-08) | `questoes_individuais.materia_uuid` vira nullable (matéria só é decidida na fase de corrigir do gabarito, não na de lançar); adiciona `dificuldade` (fácil/médio/difícil). `conteudos.progresso` REMOVIDO, substituído por `teoria_vista` + `dominado_manual`. Ver DEC-041/DEC-042 |

**Convenção para novas migrações:** numeração sequencial de 3 dígitos + nome do módulo em snake_case (`00N_nome-modulo.sql`). Depois de rodar no SQL Editor, atualizar a tabela acima e a seção correspondente deste documento.

---

## Schema — `001_schema_inicial.sql`

### `treinos`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
descricao   TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `exercicios`
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
nome               TEXT NOT NULL,
series_alvo        INTEGER,
reps_alvo          INTEGER,
carga_alvo         NUMERIC(6,2),
descanso_segundos  INTEGER,
ordem              INTEGER DEFAULT 0,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE
```
> Não existe coluna `grupo_muscular`. Nunca existiu no schema.

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

### `series_executadas`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid  TEXT NOT NULL REFERENCES exercicios(uuid),
serie_numero    INTEGER,
carga_real      NUMERIC(6,2),
reps_real       INTEGER,
concluida       BOOLEAN DEFAULT FALSE,
data_hora       TIMESTAMPTZ DEFAULT NOW(),
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
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

### `cardio`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
data             DATE NOT NULL,
tipo             TEXT,
duracao_minutos  INTEGER,
distancia_km     NUMERIC(6,3),
observacoes      TEXT,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```
> Ainda sem página própria. Nenhuma tela consome esta tabela até agora.

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

### `revisao_espacada`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
pergunta        TEXT NOT NULL,
resposta        TEXT,
modulo          TEXT,            -- 'treino', 'enem', 'olimpiadas', etc.
referencia_uuid TEXT,
ef              NUMERIC(4,2) DEFAULT 2.5,
repeticoes      INTEGER DEFAULT 0,
intervalo_dias  INTEGER DEFAULT 1,
proxima_revisao DATE DEFAULT CURRENT_DATE,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
> ⚠️ Ver Gotchas — `revisao.html` foi implementado com nomes de coluna diferentes destes.

---

## Schema — `002_estudos.sql`

### `materias`
```sql
uuid       TEXT PRIMARY KEY,
user_id    UUID NOT NULL REFERENCES auth.users(id),
nome       TEXT NOT NULL,
tipo       TEXT NOT NULL DEFAULT 'escola',  -- 'enem' | 'olimpiada' | 'escola' | 'concurso' | 'outro'
cor        TEXT,                             -- hex, ex: '#b8f566'
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE
```

### `assuntos`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
nome         TEXT NOT NULL,
progresso    INTEGER DEFAULT 0,   -- 0 a 100
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `anotacoes`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
assunto_uuid TEXT REFERENCES assuntos(uuid),  -- nullable: anotação geral da matéria
titulo       TEXT,
conteudo     TEXT NOT NULL,
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `documentos_estudo`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id),
materia_uuid TEXT REFERENCES materias(uuid),   -- nullable
assunto_uuid TEXT REFERENCES assuntos(uuid),    -- nullable
nome         TEXT NOT NULL,
arquivo_path TEXT,   -- path no bucket 'documentos'
tipo         TEXT DEFAULT 'outro',  -- 'apostila' | 'prova' | 'gabarito' | 'resumo' | 'exercicios' | 'outro'
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

### `sessoes_questoes`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id),
materia_uuid     TEXT REFERENCES materias(uuid),      -- nullable: sessão multi-matéria
assunto_uuid     TEXT REFERENCES assuntos(uuid),        -- nullable
documento_uuid   TEXT REFERENCES documentos_estudo(uuid), -- nullable
fonte            TEXT,   -- ex: 'ENEM 2022 - Caderno Azul'
total_questoes   INTEGER NOT NULL,
total_acertos    INTEGER NOT NULL DEFAULT 0,
data_estudo      DATE NOT NULL,
tempo_minutos    INTEGER,
observacoes      TEXT,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

## Schema — `003_biblioteca.sql`

Convenção de status por tipo (texto livre, sem CHECK constraint — validação fica no frontend):
- `livros`/`mangas`: `quero_ler` | `lendo` | `lido` | `pausado` | `abandonado`
- `filmes`: `quero_ver` | `assistido` | `abandonado`
- `series`: `quero_ver` | `assistindo` | `assistido` | `pausado` | `abandonado`
- `podcasts`: `quero_ouvir` | `ouvindo` | `concluido` | `pausado` | `abandonado`

### `livros`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id),
titulo           TEXT NOT NULL,
autor            TEXT,
isbn             TEXT,
google_books_id  TEXT,
capa_url         TEXT,   -- prioritária, vem da API
capa_path        TEXT,   -- fallback, upload manual no bucket 'capas'
paginas_total    INTEGER,
pagina_atual     INTEGER DEFAULT 0,
status           TEXT DEFAULT 'quero_ler',
nota             NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario       TEXT,
data_inicio      DATE,
data_fim         DATE,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

### `filmes`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id),
titulo      TEXT NOT NULL,
diretor     TEXT,
tmdb_id     TEXT,
capa_url    TEXT,
capa_path   TEXT,
status      TEXT DEFAULT 'quero_ver',
nota        NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario  TEXT,
data_inicio DATE,
data_fim    DATE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```

### `series`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id),
titulo           TEXT NOT NULL,
diretor          TEXT,   -- reaproveita o mesmo campo de filmes (direção/criação)
tmdb_id          TEXT,
capa_url         TEXT,
capa_path        TEXT,
temporada_atual  INTEGER DEFAULT 1,
episodio_atual   INTEGER DEFAULT 0,
status           TEXT DEFAULT 'quero_ver',
nota             NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario       TEXT,
data_inicio      DATE,
data_fim         DATE,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

### `mangas`
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id),
titulo           TEXT NOT NULL,
autor            TEXT,
mal_id           TEXT,   -- MyAnimeList/Jikan
capa_url         TEXT,
capa_path        TEXT,
capitulo_atual   INTEGER DEFAULT 0,
status           TEXT DEFAULT 'quero_ler',
nota             NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario       TEXT,
data_inicio      DATE,
data_fim         DATE,
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```

### `podcasts`
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id),
titulo          TEXT NOT NULL,
itunes_id       TEXT,   -- iTunes Search API, ver DEC-016
capa_url        TEXT,   -- prioritária, vem da iTunes Search API
capa_path       TEXT,   -- sem capa_url: podcasts não têm API de metadados definida ainda
episodio_atual  INTEGER DEFAULT 0,
status          TEXT DEFAULT 'ouvindo',
nota            NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario      TEXT,
data_inicio     DATE,
data_fim        DATE,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
> Ganhou `itunes_id` e `capa_url` em 004_podcasts_itunes.sql (DEC-016). Segue sem campo de autor/diretor dedicado — `artistName` da iTunes API pode ser salvo em `comentario` ou descartado, a definir na implementação do frontend.

### `tags`
```sql
uuid       TEXT PRIMARY KEY,
user_id    UUID NOT NULL REFERENCES auth.users(id),
nome       TEXT NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE
```

### Tabelas de junção (`*_tags`)
Todas seguem o mesmo padrão — `uuid`, `user_id`, `<tipo_singular>_uuid`, `tag_uuid`, `updated_at`, `deleted`:

| Tabela | FK do item |
|---|---|
| `livros_tags` | `livro_uuid` |
| `filmes_tags` | `filme_uuid` |
| `series_tags` | `serie_uuid` |
| `mangas_tags` | `manga_uuid` |
| `podcasts_tags` | `podcast_uuid` |

---
## Schema — `005_treino_v2.sql`

### `modulos_treino`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
cor         TEXT,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
> Seed de 7 módulos (Cardio, Força, Resistência, Hipertrofia, Flexibilidade,
> Mobilidade, Potência) é responsabilidade do frontend no primeiro carregamento,
> não da migration — ver DEC-020.

### `treinos` (alterada)
Ganhou a coluna `modulo_uuid TEXT REFERENCES modulos_treino(uuid)`. Demais colunas sem mudança (ver `001_schema_inicial.sql`).

### `exercicios_forca` (substitui `exercicios`)
```sql
uuid               TEXT PRIMARY KEY,
user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
nome               TEXT NOT NULL,
series_alvo        INTEGER,
reps_alvo          INTEGER,
carga_alvo         NUMERIC(6,2),
descanso_segundos  INTEGER,
imagem_path        TEXT,   -- path no bucket 'exercicios'
ordem              INTEGER DEFAULT 0,
updated_at         TIMESTAMPTZ DEFAULT NOW(),
deleted            BOOLEAN DEFAULT FALSE
```

+### `exercicios_cardio` (novo)
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

### `execucoes_forca` (substitui `series_executadas`)
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid  TEXT NOT NULL REFERENCES exercicios_forca(uuid),
serie_numero    INTEGER,
carga_real      NUMERIC(6,2),  -- null = assume carga_alvo (regra de negócio no frontend)
reps_real       INTEGER,       -- null = assume reps_alvo
concluida       BOOLEAN DEFAULT FALSE,
data_hora       TIMESTAMPTZ DEFAULT NOW(),
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
### `execucoes_cardio` (novo)
```sql
uuid                  TEXT PRIMARY KEY,
user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
sessao_uuid           TEXT NOT NULL REFERENCES sessoes_treino(uuid),
exercicio_uuid        TEXT NOT NULL REFERENCES exercicios_cardio(uuid),
concluido             BOOLEAN DEFAULT FALSE,
distancia_real_km     NUMERIC(6,3),  -- null = assume distancia_alvo_km
duracao_real_minutos  INTEGER,       -- null = assume duracao_alvo_minutos
data_hora             TIMESTAMPTZ DEFAULT NOW(),
updated_at            TIMESTAMPTZ DEFAULT NOW(),
deleted               BOOLEAN DEFAULT FALSE
```

### Tabelas descontinuadas
`cardio`, `exercicios`, `series_executadas` — removidas em `005_treino_v2.sql`. Sem dados relevantes perdidos (uso de teste). Ver DEC-020.

## Schema — `008_biblioteca_v2_b2.sql`

### `filmes` (alterada)
Ganhou colunas de produção: `roteirista TEXT`, `produtores TEXT`, `estudio TEXT`,
`distribuidora TEXT`, `orcamento NUMERIC(14,2)`, `bilheteria NUMERIC(14,2)`,
`ano_lancamento INTEGER`. Demais colunas sem mudança (ver `003_biblioteca.sql`
e `006_biblioteca_v2_base.sql`).
> A coluna `tecnologias TEXT[]` foi adicionada em `008_biblioteca_v2_b2.sql` e
> removida em `010_remover_tecnologias_filmes.sql` antes de qualquer frontend
> consumi-la — ver DEC-026.

### `series` (alterada)
Ganhou colunas de produção: `roteirista TEXT`, `produtores TEXT`, `estudio TEXT`,
`distribuidora TEXT`, `ano_lancamento INTEGER`, `ano_termino INTEGER` (nullable —
série em andamento). Demais colunas sem mudança.

### `series_temporadas` (novo)
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
serie_uuid        TEXT NOT NULL REFERENCES series(uuid),
numero            INTEGER NOT NULL,
numero_episodios  INTEGER,
nota_imdb         NUMERIC(3,1),
minha_nota        NUMERIC(2,1),
data_assisti      DATE,
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE
```
Índice parcial em `serie_uuid WHERE NOT deleted`. Só guarda contagem de
episódios (`numero_episodios`), não granularidade por episódio — isso é
exclusivo de Animes (B3, `animes_episodios`). Ver DEC-024.

### `elenco` (novo — reutilizável entre filmes/séries, e animes na B3)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tipo_obra   TEXT NOT NULL,   -- 'filme' | 'serie' (validação no frontend, sem CHECK)
obra_uuid   TEXT NOT NULL,   -- FK polimórfica, sem REFERENCES físico
ator        TEXT NOT NULL,
personagem  TEXT,
foto_url    TEXT,
ordem       INTEGER DEFAULT 0,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
Índice parcial em `(tipo_obra, obra_uuid) WHERE NOT deleted`. FK polimórfica —
mesmo padrão de exceção de `revisao_espacada.referencia_uuid` (ver
`NAMING_CONVENTIONS.md`). Na B3 (DEC-025) ganha `dublador_original` e
`dublador_br` para uso em animes.

### `trilha_sonora` (novo — reutilizável entre filmes/séries, e animes na B3)
```sql
uuid                TEXT PRIMARY KEY,
user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tipo_obra           TEXT NOT NULL,   -- 'filme' | 'serie'
obra_uuid           TEXT NOT NULL,   -- FK polimórfica
nome                TEXT NOT NULL,
artista             TEXT,
duracao_segundos    INTEGER,
link_spotify        TEXT,
link_youtube_music  TEXT,
ordem               INTEGER DEFAULT 0,
updated_at          TIMESTAMPTZ DEFAULT NOW(),
deleted             BOOLEAN DEFAULT FALSE
```
Índice parcial em `(tipo_obra, obra_uuid) WHERE NOT deleted`.

## Schema — `009_biblioteca_v2_b3.sql`

### `elenco` (alterada — ver `008` acima para a forma original)
Ganhou `dublador_original TEXT` e `dublador_br TEXT`. Anime preenche esses
dois campos e deixa `ator` nulo; filme/série seguem preenchendo só `ator`.
`personagem` e `foto_url` continuam compartilhados entre todos os tipos.
`tipo_obra` passa a aceitar também `'anime'`.

### `animes` (novo)
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
duracao_minutos          INTEGER,   -- duração média por episódio
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
status                   TEXT DEFAULT 'quero_ver',  -- mesmos valores de 'series'
nota                     NUMERIC(3,1),  -- 0.0 a 10.0, ver DEC-033
comentario               TEXT,
data_inicio              DATE,
data_fim                 DATE,
favorito                 BOOLEAN DEFAULT FALSE,
vezes_consumido          INTEGER DEFAULT 0,
onde_consumi             TEXT,
valor_pago               NUMERIC(10,2),
updated_at               TIMESTAMPTZ DEFAULT NOW(),
deleted                  BOOLEAN DEFAULT FALSE
```
Índice parcial em `user_id WHERE NOT deleted`. Tabela própria — não reaproveita
`series` (ver DEC-025 para a justificativa).

### `animes_generos` (novo — junção)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid  TEXT NOT NULL REFERENCES animes(uuid),
genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
> ⚠️ Sem `lib/` nem UI ainda — schema existe, mas nenhuma tela usa esta tabela
> até agora. Ver `BACKLOG.md`.

### `animes_temporadas` (novo)
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid        TEXT NOT NULL REFERENCES animes(uuid),
numero            INTEGER NOT NULL,
numero_episodios  INTEGER,
nota_imdb         NUMERIC(3,1),
minha_nota        NUMERIC(2,1),
data_assisti      DATE,
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE
```
Índice parcial em `anime_uuid WHERE NOT deleted`. Equivalente a
`series_temporadas`, mas com granularidade extra em `animes_episodios`.

### `animes_episodios` (novo)
```sql
uuid           TEXT PRIMARY KEY,
user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
temporada_uuid TEXT NOT NULL REFERENCES animes_temporadas(uuid),
numero         INTEGER NOT NULL,
titulo         TEXT,
arco           TEXT,     -- nome do arco narrativo, pode não coincidir com a temporada
filler         BOOLEAN DEFAULT FALSE,
assistido      BOOLEAN DEFAULT FALSE,
updated_at     TIMESTAMPTZ DEFAULT NOW(),
deleted        BOOLEAN DEFAULT FALSE
```
Índice parcial em `temporada_uuid WHERE NOT deleted`. Exclusivo de Animes — série
comum (`series_temporadas`) só guarda contagem, não episódio a episódio. % de
filler é calculada no frontend a partir desta lista, não persistida.

### `openings_endings` (novo)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid  TEXT NOT NULL REFERENCES animes(uuid),
tipo        TEXT NOT NULL,   -- 'opening' | 'ending' — validado no frontend, sem CHECK
nome        TEXT NOT NULL,
artista     TEXT,
link_video  TEXT,
minha_nota  NUMERIC(2,1),
ordem       INTEGER DEFAULT 0,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
Equivalente à `trilha_sonora` de filme/série, mas exclusivo de anime (conceito
próprio do formato, não reaproveitado).

### `filmes` (alterada)
Ganhou `anime_uuid TEXT REFERENCES animes(uuid)` (nulo = filme normal, não
vinculado a nenhum anime) e `tipo_complemento TEXT` (`'filme'` | `'ova'` |
`'ona'` | `'special'` — nulo = filme normal). Complementos de anime **não são
tabela própria**: são linhas reais em `filmes`, editáveis também na tela de
Filmes da Biblioteca. Índice parcial em `anime_uuid WHERE anime_uuid IS NOT
NULL AND NOT deleted`. Ver DEC-025.

### `animes_ordem_consumo` (novo)
```sql
uuid             TEXT PRIMARY KEY,
user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
anime_uuid       TEXT NOT NULL REFERENCES animes(uuid),
ordem            INTEGER NOT NULL,
tipo_referencia  TEXT NOT NULL,   -- 'temporada' | 'complemento'
referencia_uuid  TEXT NOT NULL,   -- aponta pra animes_temporadas.uuid ou filmes.uuid
rotulo           TEXT NOT NULL,   -- ex: "Temporada 1", "Filme: O Início"
updated_at       TIMESTAMPTZ DEFAULT NOW(),
deleted          BOOLEAN DEFAULT FALSE
```
Índice parcial em `anime_uuid WHERE NOT deleted`. FK polimórfica — mesmo
padrão de exceção de `elenco`/`trilha_sonora` (DEC-024) e
`revisao_espacada.referencia_uuid` (histórico).

## Schema — `011_biblioteca_v2_b4_mangas.sql`

### `mangas` (alterada)
Ganhou colunas de publicação: `titulo_traduzido TEXT`, `editora TEXT`,
`status_publicacao TEXT DEFAULT 'em_andamento'` (`'em_andamento'` |
`'concluida'` | `'hiato'` | `'cancelada'`), `ano_inicio_publicacao INTEGER`,
`ano_fim_publicacao INTEGER` (nullable — ainda em publicação). `titulo`
(`003_biblioteca.sql`) continua sendo o nome principal exibido.

### `mangas_volumes` (novo)
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
manga_uuid    TEXT NOT NULL REFERENCES mangas(uuid),
numero        INTEGER NOT NULL,
arco          TEXT,
cor           TEXT,             -- hex, ex: '#b8f566' — identificação visual do arco
lido          BOOLEAN DEFAULT FALSE,
data_leitura  DATE,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
Índice parcial em `manga_uuid WHERE NOT deleted`. Cada linha é um volume,
agrupado visualmente por arco via `cor`. Ver DEC-028.

## Schema — `012_biblioteca_v2_b5_livros.sql`

### `livros` (alterada)
Ganhou colunas bibliográficas/leitura: `editora TEXT`, `idioma TEXT`,
`formato TEXT DEFAULT 'fisico'` (`'fisico'` | `'ebook'` | `'audiobook'`),
`ano_publicacao INTEGER`.

### `livros_anotacoes` (novo)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
livro_uuid  TEXT NOT NULL REFERENCES livros(uuid),
tipo        TEXT NOT NULL DEFAULT 'anotacao', -- 'anotacao' | 'citacao'
pagina      INTEGER,
texto       TEXT NOT NULL,
favorito    BOOLEAN DEFAULT FALSE,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
Índice parcial em `livro_uuid WHERE NOT deleted`. `tipo` distingue anotação
livre de citação favorita — validação no frontend, sem CHECK (mesma convenção
de `status` nas tabelas de mídia). Ver DEC-029.

## Schema — `013_biblioteca_v2_b6_podcasts.sql`

### `podcasts` (alterada)
Ganhou `produtora TEXT`. Sem tabela nova. `artistName` da iTunes Search API
(DEC-016), que até aqui era salvo prefixado em `comentario` ("Produtora:
..."), passa a ser salvo direto em `produtora` pelo frontend v2 — sem
migração automática dos dados antigos (só dados de teste existentes até
agora, mesmo raciocínio de DEC-023). Ver DEC-030.

---
NOVO BLOCO A INSERIR:

## Schema — `015_estudos_v2.sql`

Substitui `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`
(v1, `002_estudos.sql`) — ver DEC-035. `materias` mantida sem alteração.

### `conteudos` (substitui `assuntos`)
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome         TEXT NOT NULL,
progresso    INTEGER DEFAULT 0,
revisao_uuid TEXT,   -- FK polimórfica pra revisao_espacada.uuid, sem REFERENCES físico
modulo_curso_uuid TEXT REFERENCES modulos_curso(uuid),  -- nullable, só usado quando o conteúdo é aula de curso
updated_at   TIMESTAMPTZ DEFAULT NOW(),
deleted      BOOLEAN DEFAULT FALSE
```

> ⚠️ **Alterado em `016_estudos_v2_fase1b.sql` (DEC-036):** `materia_uuid`
> removido. Um conteúdo não pertence mais a uma matéria só — o vínculo agora
> é N:N via `conteudos_materias` (ver seção `016` abaixo), permitindo o
> mesmo conteúdo (ex: "Funções") ser compartilhado entre ENEM e Escola com
> um único checklist/progresso.

### `anotacoes_estudo` (substitui `anotacoes`)
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
conteudo_uuid TEXT REFERENCES conteudos(uuid),  -- nullable: anotação geral da matéria
titulo        TEXT,
corpo         TEXT NOT NULL,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```

### `materiais_estudo` (substitui `documentos_estudo`)
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

### `sessoes_estudo` (novo)
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

### `questoes_individuais` (substitui `sessoes_questoes`)
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
conteudo_uuid TEXT REFERENCES conteudos(uuid),
acertou       BOOLEAN NOT NULL,
data          DATE NOT NULL,
prova_uuid    TEXT REFERENCES provas(uuid),   -- nullable, vincula a questão ao gabarito de uma prova específica
numero        INTEGER,                          -- nullable, posição da questão dentro da área (ex: 1 a 45 no ENEM)
motivo_erro   TEXT,                             -- nullable, preenchido só quando acertou = false
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
> Alterado em `016_estudos_v2_fase1b.sql` (DEC-036). Sem `prova_uuid`, uma
> linha aqui é uma questão avulsa (uso já previsto na Fase 1). Com
> `prova_uuid` preenchido, é uma questão do gabarito digital de uma prova
> oficial (ex: 90 linhas pro dia 1 do ENEM).

### `simulados` (novo)
```sql
uuid            TEXT PRIMARY KEY,
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid    TEXT REFERENCES materias(uuid),  -- nullable: multi-matéria
data            DATE NOT NULL,
total_questoes  INTEGER NOT NULL,
total_acertos   INTEGER NOT NULL DEFAULT 0,
tempo_minutos   INTEGER,
observacoes     TEXT,
conteudo_uuid   TEXT REFERENCES conteudos(uuid),  -- nullable; quando preenchido, dispara cálculo de SM-2 do conteúdo
redacao_uuid    TEXT REFERENCES redacoes(uuid),   -- nullable; só usado em simulado do dia 1 do ENEM (com redação)

updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
Alterado em `016_estudos_v2_fase1b.sql` (DEC-036). **Regra de negócio
> importante:** só `simulados` (sessão informal por conteúdo) alimenta
> `revisao_espacada`/SM-2. `provas` (evento oficial) nunca influencia
> revisão espaçada, mesmo tendo `conteudo_uuid` indiretamente via
> `questoes_individuais`.
### `redacoes` (novo)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tema        TEXT NOT NULL,
texto       TEXT NOT NULL,
nota        NUMERIC(4,1),
comentario  TEXT,
data        DATE NOT NULL,
competencia_1 NUMERIC(5,1),  -- 0 a 200, domínio da norma culta
competencia_2 NUMERIC(5,1),  -- 0 a 200, compreensão do tema
competencia_3 NUMERIC(5,1),  -- 0 a 200, argumentação
competencia_4 NUMERIC(5,1),  -- 0 a 200, coesão textual
competencia_5 NUMERIC(5,1),  -- 0 a 200, proposta de intervenção
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
> Alterado em `016_estudos_v2_fase1b.sql` (DEC-036). `nota` continua como
> nota geral (soma ou nota final, a critério do frontend); as 5 competências
> seguem o critério oficial do ENEM (0-200 cada, total 1000), reaproveitado
> também pra redações de Escola mesmo com escala real diferente lá.


### Tabelas descontinuadas
`assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes` — removidas
em `015_estudos_v2.sql`. Sem dados relevantes perdidos (confirmado uso de
teste). Ver DEC-035.

## Storage

Buckets e políticas detalhados em `ARCHITECTURE.md` → Supabase Storage e `DECISIONS.md` → DEC-010. Resumo: 3 buckets, todos privados, sempre via signed URL, path `{user_id}/arquivo.ext`.

Bucket `exercicios` adicionado em `005_treino_v2.sql` (ver DEC-020) — mesmo padrão de privacidade e path.

> ⚠️ **Pendência:** os campos `banner_path` (existentes desde `006_biblioteca_v2_base.sql`,
> DEC-023) não têm bucket de Storage definido ainda — hoje só é possível usar
> `banner_url` (link externo). Nenhuma tela da Biblioteca v2 tem upload de capa/banner
> implementado até agora. Ver `BACKLOG.md`.

---

## Gotchas — nomes de coluna que já causaram bugs

| Tabela | Nome usado incorretamente | Nome real | Onde apareceu |
|---|---|---|---|
| `exercicios` | `treino_id` | `treino_uuid` | Rascunho inicial de `treino-plano.html` — status da correção não confirmado |
| `exercicios` | `grupo_muscular` | *(não existe)* | Mesmo arquivo |
| `sessoes_treino` | `treino_id`, `data` | `treino_uuid`, `data_inicio` | `treino-academia.html` — já corrigido na auditoria M1 |
| `series_executadas` | `exercicio_id`, `sessao_id`, `serie_num`, `peso`, `repeticoes` | `exercicio_uuid`, `sessao_uuid`, `serie_numero`, `carga_real`, `reps_real` | `treino-academia.html` — já corrigido |
| `revisao_espacada` | `frente`, `verso`, `intervalo`, `fator` | `pergunta`, `resposta`, `intervalo_dias`, `ef` | `revisao.html` — **corrigido em 2026-07-11** |
| `sm2.js` | `calcularSM2(intervalo, fator, qualidade)` → `{novoIntervalo, novoFator, proximaRevisao}` | `calcularSM2(ef, repeticoes, intervaloDias, qualidade)` → `{ef, repeticoes, intervaloDias, proximaRevisao}` | `revisao.html` — **corrigido em 2026-07-11** |

**Status:** `revisao.html` corrigido em 2026-07-11 (via Cline+DeepSeek) — todas as colunas e a assinatura de `calcularSM2()` foram ajustadas para os nomes reais. `treino-plano.html` verificado na mesma data: já usava `treino_uuid` corretamente e não referenciava `grupo_muscular`, nenhuma alteração necessária. Ver `CHANGELOG.md`.

**Gotcha adicional (não é nome de coluna):** as migrations `001_schema_inicial.sql`, `002_estudos.sql` e `003_biblioteca.sql` foram executadas sem `GRANT` explícito para `authenticated`. Isso não impediu a criação das tabelas nem das policies, mas deixou todas as tabelas do projeto inacessíveis via Data API até a correção manual em 2026-07-11. GRANT foi aplicado retroativamente a todas as tabelas existentes via `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`. Toda migration a partir de agora deve incluir a linha de GRANT por tabela.

**Gotcha adicional (caminho de arquivo):** `biblioteca.html` foi gerado com
`<link rel="stylesheet" href="style.css">`, mas o arquivo real fica em
`frontend/assets/style.css` — como `biblioteca.html` já está dentro de
`frontend/`, o caminho correto a partir dele é `assets/style.css`. O erro só
aparece em teste real no navegador (MIME type incorreto no console), não no
editor. Corrigido em 2026-07-13. Verificar esse mesmo padrão de caminho
relativo em qualquer página nova gerada a partir de agora — conferir contra
a árvore real do projeto (`frontend/*.html` + `frontend/assets/*`), não por suposição.

**Gotcha adicional (deleção de usuário):** toda tabela usa `user_id UUID NOT NULL
REFERENCES auth.users(id) ON DELETE CASCADE`. Isso significa que **apagar um
usuário em Authentication → Users apaga em cascata todos os dados vinculados a
ele em todas as tabelas do projeto, sem confirmação extra e sem backup no free
tier do Supabase** (que não oferece point-in-time recovery). Confirmado na prática
em 2026-07-13: o usuário original foi deletado manualmente durante um problema de
login pós-deploy, e todas as tabelas (`treinos`, etc.) esvaziaram imediatamente,
com o schema intacto. Não houve perda de dados relevantes no caso real, mas o
comportamento é irreversível. **Nunca deletar um usuário em Authentication → Users
sem certeza absoluta de que os dados vinculados a ele são descartáveis** — não há
como recuperar depois. Se precisar trocar de conta/e-mail no futuro, preferir
atualizar o e-mail do usuário existente (Authentication → Users → editar) em vez
de apagar e recriar.

**Auditoria de segurança pós-deploy (2026-07-13):** confirmado via `pg_policies` e
`information_schema.role_table_grants` que as 24 tabelas do projeto (8 de `001`,
5 de `002`, 11 de `003`) têm policy `user_own_data` ativa e GRANT completo
(`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para `authenticated`. Nenhuma tabela
descoberta sem proteção. Também confirmado: cadastro público de novos usuários
desabilitado em Authentication → Settings, e nenhuma ocorrência de `service_role`
key em código do frontend.

**Gotcha adicional (tipos `Input` vs. update parcial, Biblioteca v2):** os tipos
`MangaVolumeInput` e `AnimeEpisodioInput` exigiam `numero` obrigatório, mas
`VolumesEditor.tsx`/`EpisodiosEditor.tsx` usam `atualizarVolume()`/
`atualizarEpisodio()` para toggles simples (`lido`, `filler`, `assistido`) sem
reenviar `numero` — 5 erros de TypeScript. Corrigido em 2026-07-18 (via
Cline+DeepSeek) criando tipos `MangaVolumeUpdate`/`AnimeEpisodioUpdate`
(Partial completo, sem campo obrigatório) separados dos tipos `Input` usados
na criação. Padrão a seguir daqui em diante: sempre que um componente precisar
atualizar só um campo de uma entidade que tem campo obrigatório no tipo de
criação, criar um tipo `XxxUpdate` dedicado em vez de afrouxar o `XxxInput`.

**Gotcha adicional (arquivo sobrescrito por engano, Biblioteca v2):** durante a
mesma correção, `components/AnotacoesLivroEditor.tsx` foi acidentalmente
sobrescrito com a lógica de `VolumesEditor.tsx` (import de `lib/mangas-volumes`
em vez de `lib/livros-anotacoes`, prop `mangaUuid` em vez de `livroUuid`) — os
dois componentes têm estrutura muito parecida (lista editável com CRUD simples)
e foram confundidos durante uma correção automática. Corrigido em 2026-07-18.
Atenção redobrada ao reaproveitar `Cline`/IA para correções em massa quando
existem múltiplos componentes com a mesma "forma" (`VolumesEditor` ↔
`AnotacoesLivroEditor`, `TemporadasEditor` ↔ `TemporadasAnimeEditor`).

## Schema — `016_estudos_v2_fase1b.sql`

Fase 1B do Estudos v2 (DEC-036). Refina a Fase 1 (`015`) com conteúdo
compartilhado entre módulos, hierarquia de Curso, Prova como estrutura
distinta de Simulado, e gabarito digital.

### `conteudos_materias` (novo — N:N, substitui `conteudos.materia_uuid`)
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
Índice parcial em `(conteudo_uuid, materia_uuid) WHERE NOT deleted`. Um
conteúdo com 2 linhas aqui (uma pra matéria "Matemática" tipo `enem`, outra
pra "Matemática" tipo `escola`) é o caso de conteúdo compartilhado descrito
na DEC-036.

### `modulos_curso` (novo)
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid TEXT NOT NULL REFERENCES materias(uuid),  -- o curso
nome        TEXT NOT NULL,
ordem       INTEGER DEFAULT 0,
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
```
Índice parcial em `materia_uuid WHERE NOT deleted`. Só usado quando
`materias.tipo = 'curso'`. `conteudos.modulo_curso_uuid` referencia esta
tabela para formar a hierarquia Curso → Módulo → Aula.

### `atividades` (novo — Escola e Curso)
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
Índice parcial em `materia_uuid WHERE NOT deleted`. Backup funcional do
caderno — não guarda o conteúdo da atividade em si, só o registro de
"pendente/feita/entregue".

### `provas` (novo — evento oficial, diferente de `simulados`)
```sql
uuid          TEXT PRIMARY KEY,
user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
materia_uuid  TEXT REFERENCES materias(uuid),   -- nullable: prova de ENEM cobre 2 áreas, granularidade fica em questoes_individuais
tipo          TEXT NOT NULL DEFAULT 'escola',   -- 'escola' | 'enem_dia1' | 'enem_dia2' | 'curso' | 'outro'
conteudo_uuid TEXT REFERENCES conteudos(uuid),  -- nullable, uso principal na Escola
titulo        TEXT,
data          DATE NOT NULL,
tempo_minutos INTEGER,                          -- duração real, uso principal ENEM (timer de fundo)
redacao_uuid  TEXT REFERENCES redacoes(uuid),   -- nullable, só dia 1 do ENEM
nota          NUMERIC(5,1),
feita         BOOLEAN DEFAULT FALSE,
observacoes   TEXT,
updated_at    TIMESTAMPTZ DEFAULT NOW(),
deleted       BOOLEAN DEFAULT FALSE
```
Índice parcial em `data WHERE NOT deleted`. Alimenta o card "próximas
provas" (contagem regressiva) no dashboard geral de Estudos e no dashboard
de cada matéria. **Nunca dispara SM-2** — só `simulados.conteudo_uuid` faz
isso (ver DEC-036).

### Tabelas alteradas por esta migration
`conteudos` (perde `materia_uuid`, ganha `modulo_curso_uuid`),
`questoes_individuais` (ganha `prova_uuid`, `numero`, `motivo_erro`),
`simulados` (ganha `conteudo_uuid`, `redacao_uuid`), `redacoes` (ganha as 5
colunas de competência), `materias` (ganha os 6 campos de Curso — ver bloco
abaixo). Blocos originais já atualizados nas seções correspondentes acima.
### `materias` — campos novos (uso exclusivo quando `tipo = 'curso'`)
```sql
plataforma                TEXT,      -- Udemy, Alura, YouTube, etc.
carga_horaria_total_horas NUMERIC(6,1),
horas_dedicadas           NUMERIC(6,1) DEFAULT 0,  -- preenchido manualmente, sem integração automática (ver DEC-036 — YPT sem API pública)
certificado_path          TEXT,      -- upload PDF, bucket 'documentos'
concluido                 BOOLEAN DEFAULT FALSE,
data_conclusao             DATE
```