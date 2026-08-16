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

**Confirmado no banco real (2026-08):** a baseline tinha 44 tabelas em `public`, todas com RLS, policy `user_own_data` e GRANT para `authenticated`. As migrations incrementais aplicadas adicionaram 19 tabelas; produção e ambiente local possuem agora 63 tabelas. `anon` continua sem `SELECT`/`INSERT` sobre dados da aplicação.

Índices parciais `WHERE NOT deleted` existem nas tabelas principais para acelerar as queries que sempre filtram registros ativos — confirmados no dump para praticamente todas as tabelas de alto volume (ver lista completa na seção Índices, ao final).

---

## Local dos arquivos de migration

`backend/supabase/migrations/*.sql` é a cadeia operacional ativa do Supabase
CLI. `backend/supabase/history/legacy-migrations/` é somente acervo histórico e
`backend/supabase/snapshots/` é somente evidência diagnóstica; nenhum arquivo
dessas duas pastas deve ser executado como migration.

---

## Migrações

### Cadeia ativa

| Versão | Arquivo | Estado oficial |
|---|---|---|
| `20260807000100` | `20260807000100_baseline_public.sql` | ✅ Baseline de `public`, replay local aprovado e registrada como `applied` em produção |
| `20260807000200` | `20260807000200_baseline_rls_guard.sql` | ✅ `rls_auto_enable()` + `ensure_rls`, replay local aprovado e registrada como `applied` |
| `20260807000300` | `20260807000300_baseline_storage.sql` | ✅ Cinco buckets + 14 policies, replay local aprovado e registrada como `applied` |
| `20260811000100` | `20260811000100_agenda_v2.sql` | ✅ Reset/testes locais aprovados e aplicada em produção em 2026-08-11; pós-check sem pendências |
| `20260811000200` | `20260811000200_biblioteca_videos_artigos.sql` | ✅ Reset/testes aprovados e aplicada em produção em 2026-08-11 |
| `20260811000300` | `20260811000300_conteudos_video.sql` | ✅ Reset/testes locais aprovados e aplicada em produção em 2026-08-12; pós-check sem pendências |
| `20260812000100` | `20260812000100_revisao_arquivados.sql` | ✅ Reset/suíte SQL local aprovados e aplicada em produção em 2026-08-12 após dry-run limpo; pós-check sem pendências |
| `20260812000200` | `20260812000200_projetos_receitas.sql` | ✅ Testes locais aprovados e aplicada em produção em 2026-08-12 após dry-run limpo; pós-check sem pendências |
| `20260813000100` | `20260813000100_saude_financas_lugares.sql` | ✅ Reset/suíte SQL local aprovados e aplicada em produção em 2026-08-13 após dry-run limpo; pós-check sem pendências |
| `20260813000200` | `20260813000200_biblioteca_nota_cinco_estrelas.sql` | ✅ Reset local e teste específico aprovados; aplicada em produção em 2026-08-14 após dry-run limpo; pós-check sem pendências |
| `20260814000100` | `20260814000100_idiomas.sql` | ✅ Reset e nove testes SQL aprovados; aplicada em produção em 2026-08-15 após dry-run exclusivo; pós-check confirmou tabelas, RLS, policies e GRANTs |
| `20260815000100` | `20260815000100_programacao_investimentos.sql` | ✅ Reset e dez testes SQL aprovados; aplicada em produção em 2026-08-15 após dry-run exclusivo; pós-check confirmou 63 tabelas, histórico, campos de Projetos, RLS, policy e GRANT de Investimentos |
| `20260815000200` | `20260815000200_v21_hardening.sql` | ✅ Reset e onze testes SQL aprovados; aplicada em produção em 2026-08-15 após dry-run exclusivo; pós-check confirmou histórico alinhado e nenhum arquivo pendente |

> **Estado confirmado (2026-08-15):** produção e cadeia local estão alinhadas
> até o hardening v2.1. A migration não cria tabelas; `public` permanece com
> 63 tabelas.

As três baselines foram adotadas no histórico remoto em 2026-08-08 por
`migration repair --status applied`, depois de recaptura somente leitura de
produção e ensaio equivalente em projeto descartável. O repair não executou
os SQLs. `schema_migrations` passou a conter exatamente as três versões; os
objetos da aplicação permaneceram inalterados; `db push --dry-run` retornou
`upToDate=true`, `dryRun=true` e `migrations=[]`. Nenhum `db push` real foi
necessário.

### Acervo histórico `001`–`019` — não operacional

A tabela abaixo descreve a evolução histórica. Os arquivos correspondentes
estão em `backend/supabase/history/legacy-migrations/`, não formam cadeia
reproduzível, não são lidos pelo CLI e nunca devem ser executados. Proveniência
e hashes ficam em `history/provenance.yaml`.

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

**🔧 Nota sobre arquivos recriados (2026-08):** seis migrations (`004`, `005`, `007`, `010`, `014`, `019`) nunca foram copiadas para a pasta local do projeto (falha de cópia manual do usuário para o VS Code, não perda de dado — todas estavam executadas no Supabase o tempo todo). Foram reconstruídas a partir do estado final observado no dump. Elas documentam o efeito pretendido, mas não são cópias dos scripts originais; por isso permanecem somente no acervo e têm `replay_supported: false`.

**⚠️ Nota sobre `015`/`016` corrompidas (2026-08):** os arquivos locais dessas duas migrations continham erros internos (colunas de uma tabela referenciadas em índice de outra, tabela referenciada antes de ser criada) — provavelmente uma cópia/colagem errada em sessão de chat anterior sobrescreveu o conteúdo correto. **O banco de produção nunca teve esse problema.** As versões reconciliadas também permanecem somente no acervo; a cadeia ativa não depende delas.

**Encerramento do replay legado:** a cadeia `001`–`019` não é e não será
tratada como reproduzível. Suas colisões foram preservadas no acervo. A
reprodutibilidade foi resolvida pelas três baselines timestamped, aprovadas em
dois resets locais completos e comparadas com produção.

**Workflow obrigatório para novas migrations:** criar uma nova migration
timestamped; nunca editar baseline/migration já aplicada; executar `db reset
--local --no-seed`; rodar testes estruturais e comportamentais relevantes;
revisar SQL, RLS, policies, grants e efeitos destrutivos; executar `db push
--dry-run`; somente depois de novo precheck e autorização executar operação
remota; por fim atualizar `DATABASE.md`, `CHANGELOG.md` e, quando aplicável,
`DECISIONS.md`. A produção não tem link persistido. Enquanto a CLI `2.112.0`
não conseguir usar `supabase link`, operações remotas especificamente
autorizadas podem usar `--db-url` com variável de ambiente da sessão. Nunca
registrar connection strings, tokens, senhas ou project refs temporários.

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
> A migration incremental `20260811000100_agenda_v2.sql`, aplicada em
> produção em 2026-08-11, torna `titulo` obrigatório e acrescenta:
> `tipo TEXT NOT NULL DEFAULT 'geral'`
> (`geral`, `estudo` ou `treino`), `hora_inicio TIME`,
> `duracao_minutos INTEGER`, `descricao TEXT`,
> `materia_uuid TEXT REFERENCES materias(uuid)`,
> `conteudo_uuid TEXT REFERENCES conteudos(uuid)` e
> `concluido BOOLEAN NOT NULL DEFAULT FALSE`. Ela também adiciona checks de
> título, duração e coerência dos vínculos. O frontend `/agenda` está liberado
> para publicação contra esse schema.

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
arquivado       BOOLEAN NOT NULL DEFAULT FALSE,
updated_at      TIMESTAMPTZ DEFAULT NOW(),
deleted         BOOLEAN DEFAULT FALSE
```
> Reaproveitada por Estudos v2 (SM-2, ver DEC-035) — cada conteúdo pode ter um card com `modulo = 'estudos'`, `referencia_uuid = conteudos.uuid`. A página dedicada `/revisao` também aceita cards independentes com `modulo = 'manual'` e `referencia_uuid = NULL`. A migration incremental `20260812000100_revisao_arquivados.sql`, aplicada em produção em 2026-08-12, acrescentou `arquivado`: o card sai das filas ativas sem perder progresso, vínculo ou histórico; `deleted` continua reservado à exclusão lógica.

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

## Schema — Biblioteca v2 (`006`–`014` + incrementais timestamped)

### `generos`
```sql
uuid       TEXT PRIMARY KEY,
user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome       TEXT NOT NULL,
descricao  TEXT,
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted    BOOLEAN DEFAULT FALSE
```

### `videos` (migration `20260811000200`, aplicada em produção)
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo            TEXT NOT NULL,
url               TEXT NOT NULL,
youtube_id        TEXT,
canal             TEXT,
duracao_segundos  INTEGER,
capa_url          TEXT,
assistido         BOOLEAN NOT NULL DEFAULT FALSE,
favorito          BOOLEAN NOT NULL DEFAULT FALSE,
nota              NUMERIC(2,1),
comentario        TEXT,
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE
```
> Checks garantem título/URL não vazios, duração positiva e nota entre 0 e 5
> em passos de 0.5. A UI extrai `youtube_id` e thumbnail apenas de URLs
> reconhecidas, sem API.

### `artigos` (migration `20260811000200`, aplicada em produção)
```sql
uuid                   TEXT PRIMARY KEY,
user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo                 TEXT NOT NULL,
url                    TEXT NOT NULL,
autor                  TEXT,
site_origem            TEXT,
data_leitura           DATE,
tempo_leitura_minutos  INTEGER,
favorito               BOOLEAN NOT NULL DEFAULT FALSE,
comentario             TEXT,
updated_at             TIMESTAMPTZ DEFAULT NOW(),
deleted                BOOLEAN DEFAULT FALSE
```
> `data_leitura = NULL` representa artigo ainda não lido; o tempo, quando
> informado, deve ser positivo. As duas tabelas têm RLS, policy
> `user_own_data`, GRANT CRUD para `authenticated` e índice parcial por usuário.

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
nota               NUMERIC(2,1),   -- 0.0 a 5.0 em passos de 0.5, ver DEC-054
roteirista         TEXT,
produtores         TEXT,
estudio            TEXT,
distribuidora      TEXT,
orcamento          NUMERIC(14,2),
bilheteria         NUMERIC(14,2),
ano_lancamento     INTEGER,
anime_uuid         TEXT REFERENCES animes(uuid),   -- nulo = filme normal
tipo_complemento   TEXT,   -- 'filme' | 'ova' | 'ona' | 'special' — nulo = filme normal
CONSTRAINT filmes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
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
nota               NUMERIC(2,1),
roteirista         TEXT,
produtores         TEXT,
estudio            TEXT,
distribuidora      TEXT,
ano_lancamento     INTEGER,
ano_termino        INTEGER,
CONSTRAINT series_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
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
nota                     NUMERIC(2,1),
comentario               TEXT,
data_inicio              DATE,
data_fim                 DATE,
favorito                 BOOLEAN DEFAULT FALSE,
vezes_consumido          INTEGER DEFAULT 0,
onde_consumi             TEXT,
valor_pago               NUMERIC(10,2),
updated_at               TIMESTAMPTZ DEFAULT NOW(),
deleted                  BOOLEAN DEFAULT FALSE,
CONSTRAINT animes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
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
nota                   NUMERIC(2,1),
titulo_traduzido       TEXT,
editora                TEXT,
status_publicacao      TEXT DEFAULT 'em_andamento',
ano_inicio_publicacao  INTEGER,
ano_fim_publicacao     INTEGER,
CONSTRAINT mangas_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
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
nota               NUMERIC(2,1),
editora            TEXT,
idioma             TEXT,
formato            TEXT DEFAULT 'fisico',
ano_publicacao     INTEGER,
CONSTRAINT livros_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
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
nota               NUMERIC(2,1),
produtora          TEXT,
CONSTRAINT podcasts_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 5 AND nota * 2 = trunc(nota * 2)))
```
> Sem campo de autor/diretor dedicado — `artistName` da iTunes API vai em `produtora`.
>
> **Uso de `duracao_minutos` na interface:** filme usa duração total; série,
> anime e podcast usam duração média por episódio; mangá e livro usam tempo
> estimado de leitura/consumo. O campo já existia nas seis tabelas originais e
> continua opcional. Vídeos usam `duracao_segundos`; Artigos usam
> `tempo_leitura_minutos`.

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
user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome                       TEXT NOT NULL,
tipo                       TEXT NOT NULL DEFAULT 'academica',
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
CONSTRAINT materias_area_enem_check CHECK (area_enem IS NULL OR area_enem IN ('linguagens','humanas','natureza','matematica')),
CONSTRAINT materias_tipo_check CHECK (tipo IN ('academica','olimpiada','vestibular','concurso','curso','outro'))
```
> Desde `20260815000200_v21_hardening.sql`, valores históricos `escola`/`enem`
> são normalizados para `academica`, o default corresponde à DEC-040, o domínio
> é imposto por CHECK e a FK de usuário usa cascade.

### `conteudos`
```sql
uuid              TEXT PRIMARY KEY,
user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome              TEXT NOT NULL,
revisao_uuid      TEXT,   -- FK polimórfica pra revisao_espacada.uuid, sem REFERENCES físico
modulo_curso_uuid TEXT REFERENCES modulos_curso(uuid),
video_uuid        TEXT REFERENCES videos(uuid),
updated_at        TIMESTAMPTZ DEFAULT NOW(),
deleted           BOOLEAN DEFAULT FALSE,
teoria_vista      BOOLEAN NOT NULL DEFAULT FALSE,
dominado_manual   BOOLEAN NOT NULL DEFAULT FALSE
```
> Sem `materia_uuid` (vínculo é N:N via `conteudos_materias`, DEC-036) e sem
> `progresso` (removido em `019`, DEC-042). "Dominado" é calculado, não
> gravado: `dominado_manual = true OR revisao_espacada.repeticoes >= 5`.
>
> A migration `20260811000300_conteudos_video.sql`, aplicada em produção em
> 2026-08-12, adicionou `video_uuid` nullable para identificar aulas originadas
> da Biblioteca. Também criou o índice parcial
> `idx_conteudos_video_ativos`. O progresso permanece independente entre o
> vídeo da Biblioteca e o conteúdo do Curso.

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
> Schema existe e confere com o banco real. A UI de Matéria e Curso registra
> sessões concluídas com início, duração e fim calculado, vinculadas
> opcionalmente a um conteúdo (`lib/sessoes-estudo.ts`).

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
> Schema existe e confere com o banco real. A UI de Matéria e Curso permite
> cadastrar referências por conteúdo usando título, tipo e URL ou enviar
> arquivos de até 50 MB ao bucket privado `documentos`. A UI persiste
> `arquivo_path` e gera signed URL para abertura (`lib/materiais-estudo.ts`),
> sem alterar buckets ou policies existentes.

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
> Schema existe e confere com o banco real. A UI de Matéria e Curso permite
> anotações gerais da matéria ou vinculadas opcionalmente a um conteúdo
> (`lib/anotacoes-estudo.ts`).

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

### Idiomas (`20260814000100_idiomas.sql`)

Idiomas é um domínio próprio, separado de `materias`/`conteudos`, porque
vocabulário, prática e tempo possuem ciclo de vida próprio (DEC-055).

```sql
-- idiomas
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome TEXT NOT NULL, nivel_atual TEXT, objetivo TEXT, cor TEXT,
ativo BOOLEAN NOT NULL DEFAULT TRUE,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE

-- idiomas_vocabulario
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
idioma_uuid TEXT NOT NULL REFERENCES idiomas(uuid) ON DELETE CASCADE,
termo TEXT NOT NULL, traducao TEXT NOT NULL, exemplo TEXT,
dominado BOOLEAN NOT NULL DEFAULT FALSE,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE

-- idiomas_praticas
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
idioma_uuid TEXT NOT NULL REFERENCES idiomas(uuid) ON DELETE CASCADE,
data DATE NOT NULL,
tipo TEXT NOT NULL, -- leitura|escuta|conversacao|escrita|aula|revisao|outro
duracao_minutos INTEGER NOT NULL, observacoes TEXT,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

As três tabelas têm RLS, policy `user_own_data`, CRUD explícito para
`authenticated`, checks de domínio e índices parciais `WHERE NOT deleted`.

### `projetos`
```sql
uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
nome        TEXT NOT NULL,
descricao   TEXT,
status      TEXT NOT NULL DEFAULT 'ativo', -- 'ativo' | 'pausado' | 'concluido'
data_prazo  DATE,
repositorio_url TEXT,
linguagem_principal TEXT,
destaque    BOOLEAN NOT NULL DEFAULT FALSE,
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted     BOOLEAN NOT NULL DEFAULT FALSE
```

### `projetos_tarefas`
```sql
uuid         TEXT PRIMARY KEY,
user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
projeto_uuid TEXT NOT NULL REFERENCES projetos(uuid),
titulo       TEXT NOT NULL,
status       TEXT NOT NULL DEFAULT 'a_fazer', -- 'a_fazer' | 'fazendo' | 'feito'
ordem        INTEGER NOT NULL DEFAULT 0,
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted      BOOLEAN NOT NULL DEFAULT FALSE
```
> Projetos e tarefas usam soft delete independente. A interface move tarefas
> por botões entre as três etapas; não existe drag-and-drop nem automação.

### `receitas`
```sql
uuid                    TEXT PRIMARY KEY,
user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
titulo                  TEXT NOT NULL,
ingredientes            TEXT NOT NULL,
modo_preparo            TEXT NOT NULL,
tempo_preparo_minutos   INTEGER,
porcoes                 INTEGER,
categoria               TEXT,
nota                    NUMERIC(3,1), -- 0 a 10
favorito                 BOOLEAN NOT NULL DEFAULT FALSE,
fez                      BOOLEAN NOT NULL DEFAULT FALSE,
foto_url                 TEXT,
updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted                  BOOLEAN NOT NULL DEFAULT FALSE
```
> A foto permanece uma URL externa. O módulo não cria bucket nem integra API.

### Saúde

O peso não foi duplicado: `shape` continua sendo a fonte única. O módulo Saúde
apenas consulta seu último registro e usa as tabelas abaixo para as áreas novas.

#### `saude_sono`
```sql
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
data DATE NOT NULL, horas_dormidas NUMERIC(4,2) NOT NULL,
horario_dormir TIME, horario_acordar TIME, qualidade SMALLINT NOT NULL,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### `saude_hidratacao`
```sql
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
data DATE NOT NULL, copos INTEGER NOT NULL DEFAULT 0, meta_copos INTEGER NOT NULL DEFAULT 8,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### `saude_humor`
```sql
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
data DATE NOT NULL, humor SMALLINT NOT NULL, energia SMALLINT NOT NULL, observacoes TEXT,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### `saude_medicamentos` e `saude_medicamentos_registros`
```sql
-- saude_medicamentos
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
nome TEXT NOT NULL, dosagem TEXT, horario TIME, ativo BOOLEAN NOT NULL DEFAULT TRUE, estoque INTEGER,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE

-- saude_medicamentos_registros
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
medicamento_uuid TEXT NOT NULL REFERENCES saude_medicamentos(uuid),
data DATE NOT NULL, tomado BOOLEAN NOT NULL DEFAULT TRUE,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

### Finanças

#### `financas_categorias` e `financas_lancamentos`
```sql
-- financas_categorias
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
nome TEXT NOT NULL, tipo TEXT NOT NULL, cor TEXT,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE

-- financas_lancamentos
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
categoria_uuid TEXT NOT NULL REFERENCES financas_categorias(uuid),
tipo TEXT NOT NULL, valor NUMERIC(12,2) NOT NULL, data DATE NOT NULL, descricao TEXT,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### `financas_orcamentos` e `financas_metas_economia`
```sql
-- financas_orcamentos
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
categoria_uuid TEXT NOT NULL REFERENCES financas_categorias(uuid),
mes SMALLINT NOT NULL, ano INTEGER NOT NULL, valor_limite NUMERIC(12,2) NOT NULL,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE

-- financas_metas_economia
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
titulo TEXT NOT NULL, valor_alvo NUMERIC(12,2) NOT NULL,
valor_atual NUMERIC(12,2) NOT NULL DEFAULT 0, data_alvo DATE,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### `financas_investimentos`
```sql
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
ticker TEXT NOT NULL,
tipo TEXT NOT NULL, -- acao|fii|etf|bdr|cripto|renda_fixa|outro
quantidade NUMERIC(18,8) NOT NULL,
preco_medio NUMERIC(18,8) NOT NULL,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```
> A tabela guarda somente a posição manual. A cotação atual é consultada sob
> demanda pela API Route e não é persistida nem entra no Histórico.

### `lugares`
```sql
uuid TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id),
nome TEXT NOT NULL, tipo TEXT, cidade TEXT, pais TEXT,
latitude NUMERIC(9,6), longitude NUMERIC(9,6),
data_inicio DATE, data_fim DATE, custo NUMERIC(12,2), nota NUMERIC(3,1),
favorito BOOLEAN NOT NULL DEFAULT FALSE, texto TEXT, capa_url TEXT,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted BOOLEAN NOT NULL DEFAULT FALSE
```
> O link para Google Maps é montado no cliente a partir das coordenadas ou do
> nome/local. Não há Maps API, scraping, upload ou segredo nesse módulo.

### Tabelas descontinuadas de Estudos v1
`assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes` — confirmadas ausentes no dump. Ver DEC-035.

---

## Storage

Captura direta de produção em 2026-08-07 confirmou exatamente cinco buckets
privados: `shape`, `documentos`, `capas`, `exercicios` e `redacoes`, com 14
policies em `storage.objects`. Configuração literal, limites, MIME types,
roles, `USING` e `WITH CHECK` estão preservados em
`backend/supabase/snapshots/2026-08-07-production/critical_storage_metadata.json`
e reproduzidos por `20260807000300_baseline_storage.sql`.

Desde `20260815000200_v21_hardening.sql`, as policies de `redacoes` e
`exercicios` são limitadas a `authenticated` e possuem `USING` e `WITH CHECK`
para a primeira pasta `{user_id}`. A decisão permanente continua sendo manter
buckets privados e usar signed URLs/path `{user_id}/arquivo.ext` (DEC-010).

> ⚠️ **Pendência:** `banner_path` (existente desde `006_biblioteca_v2_base.sql`) não tem bucket de Storage definido — só `banner_url` (link externo) funciona hoje. Ver `BACKLOG.md`.

---

## Índices parciais confirmados no dump ou por migration aplicada (`WHERE NOT deleted`)

Confirmados em: `agenda`, `animes`, `animes_episodios`, `animes_temporadas`, `anotacoes_estudo` (×2, conteúdo e matéria), `atividades`, `conteudos_materias` (×2), `elenco`, `exercicios_cardio`, `exercicios_forca`, `filmes` (×2, incluindo `anime_uuid`), `financas_investimentos`, `generos`, `idiomas`, `idiomas_vocabulario`, `idiomas_praticas` (×2), `livros`, `livros_anotacoes`, `mangas`, `mangas_volumes`, `materiais_estudo`, `materias`, `modulos_curso`, `modulos_treino`, `animes_ordem_consumo`, `podcasts`, `projetos` (incluindo a visão especializada de programação), `provas` (por `data`), `questoes_individuais` (×3: conteúdo, matéria, prova), `redacoes` (por `data`), `revisao_espacada` (por `proxima_revisao` e, desde `20260812000100`, por `user_id`, `arquivado` e `proxima_revisao`), `series`, `series_temporadas`, `sessoes_treino` (×2), `sessoes_estudo` (×2), `shape`, `simulados` (×2), `treinos` (por `modulo_uuid`), `trilha_sonora`.

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

**Gotcha resolvido em 2026-08-15:** `materias.user_id` era a única FK do projeto sem `ON DELETE CASCADE`; `20260815000200_v21_hardening.sql` alinhou a FK às demais tabelas.

**Gotcha resolvido em 2026-08-15:** `materias.tipo` era texto livre e conservava default histórico `escola`; `20260815000200_v21_hardening.sql` normalizou os dados, definiu default `academica` e adicionou o domínio documentado por CHECK.

**Gotcha (tipos `Input` vs. update parcial, Biblioteca v2):** `MangaVolumeInput`/`AnimeEpisodioInput` exigiam `numero` obrigatório, mas os editores usam `atualizarVolume()`/`atualizarEpisodio()` para toggles simples sem reenviar `numero`. Corrigido criando tipos `XxxUpdate` (Partial completo) separados dos tipos `Input` de criação. Padrão a seguir daqui em diante.

**Gotcha (arquivo sobrescrito por engano, Biblioteca v2):** `AnotacoesLivroEditor.tsx` foi acidentalmente sobrescrito com lógica de `VolumesEditor.tsx` numa correção em massa — os dois componentes têm estrutura muito parecida. Corrigido em 2026-07-18. Atenção redobrada com reaproveitamento de correção automática entre componentes de "mesma forma".

**Gotcha (migrations locais divergindo do banco, 2026-08):** seis arquivos de migration nunca foram copiados para o VS Code (falha de cópia manual, não perda de dado) e dois outros (`015`, `016`) tinham conteúdo corrompido no repositório enquanto o banco real estava correto. Ver seção "Migrações" no topo deste documento para o que foi feito. **Lição:** rodar `supabase db dump` periodicamente e comparar contra os arquivos locais evita que essa divergência se acumule silenciosamente de novo.

**Estado preservado pela baseline, com correção incremental:** a baseline
continua reproduzindo o retrato histórico; policies de `redacoes`/`exercicios`,
cascade e domínio de `materias` foram corrigidos somente pela migration
incremental `20260815000200`. Os demais hardenings conhecidos continuam
futuros. Nunca editar as baselines para “corrigir” o passado.
