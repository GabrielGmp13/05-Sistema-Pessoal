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
| `004_podcasts_itunes.sql` | 🔄 Aguardando execução no Supabase | Adiciona `itunes_id` e `capa_url` à tabela `podcasts` — ver DEC-016 |
| `005_treino_v2.sql` | ✅ Executado e verificado no Supabase (2026-07-15) | Reestrutura Treino: `modulos_treino` (novo), `treinos.modulo_uuid` (novo), `exercicios_forca`/`exercicios_cardio` (substituem `exercicios`), `execucoes_forca`/`execucoes_cardio` (substituem `series_executadas`). Descontinua `cardio`. Ver DEC-020 |

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
nota             INTEGER,  -- 1-10
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
nota        INTEGER,
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
nota             INTEGER,
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
nota             INTEGER,
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
nota            INTEGER,
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

## Storage

Buckets e políticas detalhados em `ARCHITECTURE.md` → Supabase Storage e `DECISIONS.md` → DEC-010. Resumo: 3 buckets, todos privados, sempre via signed URL, path `{user_id}/arquivo.ext`.

Bucket `exercicios` adicionado em `005_treino_v2.sql` (ver DEC-020) — mesmo padrão de privacidade e path.

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