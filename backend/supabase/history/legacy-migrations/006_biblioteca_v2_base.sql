-- ============================================================
-- 006_biblioteca_v2_base.sql
-- Biblioteca v2 — Sub-fase B1: base compartilhada
-- Gêneros + campos comuns (favorito, nota por estrela, banner,
-- links externos, etc.) nos 5 tipos existentes.
-- Ver DECISIONS.md — DEC-023 (a registrar)
-- ============================================================

-- ---------- Tabela nova: generos ----------

CREATE TABLE generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON generos
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON generos TO authenticated;

CREATE INDEX idx_generos_ativos ON generos (user_id) WHERE NOT deleted;

-- ---------- Tabelas de junção *_generos ----------
-- Mesmo padrão das *_tags já existentes em 003_biblioteca.sql

CREATE TABLE livros_generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  livro_uuid  TEXT NOT NULL REFERENCES livros(uuid),
  genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE livros_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON livros_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON livros_generos TO authenticated;

CREATE TABLE filmes_generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filme_uuid  TEXT NOT NULL REFERENCES filmes(uuid),
  genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE filmes_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON filmes_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON filmes_generos TO authenticated;

CREATE TABLE series_generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  serie_uuid  TEXT NOT NULL REFERENCES series(uuid),
  genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE series_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON series_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON series_generos TO authenticated;

CREATE TABLE mangas_generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_uuid  TEXT NOT NULL REFERENCES mangas(uuid),
  genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE mangas_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON mangas_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON mangas_generos TO authenticated;

CREATE TABLE podcasts_generos (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_uuid  TEXT NOT NULL REFERENCES podcasts(uuid),
  genero_uuid   TEXT NOT NULL REFERENCES generos(uuid),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);
ALTER TABLE podcasts_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON podcasts_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON podcasts_generos TO authenticated;

-- ---------- Colunas novas: livros, filmes, series, mangas, podcasts ----------
-- Repetido por tabela (nenhuma tabela genérica — mesma filosofia da DEC-014)

ALTER TABLE livros
  ADD COLUMN favorito                 BOOLEAN DEFAULT FALSE,
  ADD COLUMN vezes_consumido          INTEGER DEFAULT 0,
  ADD COLUMN onde_consumi             TEXT,
  ADD COLUMN valor_pago               NUMERIC(10,2),
  ADD COLUMN banner_url               TEXT,
  ADD COLUMN banner_path              TEXT,
  ADD COLUMN classificacao_indicativa TEXT,
  ADD COLUMN duracao_minutos          INTEGER,
  ADD COLUMN link_imdb                TEXT,
  ADD COLUMN link_mal                 TEXT,
  ADD COLUMN link_anilist             TEXT,
  ADD COLUMN link_oficial             TEXT;

ALTER TABLE livros DROP COLUMN nota;
ALTER TABLE livros ADD COLUMN nota NUMERIC(2,1);

ALTER TABLE filmes
  ADD COLUMN favorito                 BOOLEAN DEFAULT FALSE,
  ADD COLUMN vezes_consumido          INTEGER DEFAULT 0,
  ADD COLUMN onde_consumi             TEXT,
  ADD COLUMN valor_pago               NUMERIC(10,2),
  ADD COLUMN banner_url               TEXT,
  ADD COLUMN banner_path              TEXT,
  ADD COLUMN classificacao_indicativa TEXT,
  ADD COLUMN duracao_minutos          INTEGER,
  ADD COLUMN link_imdb                TEXT,
  ADD COLUMN link_mal                 TEXT,
  ADD COLUMN link_anilist             TEXT,
  ADD COLUMN link_oficial             TEXT;

ALTER TABLE filmes DROP COLUMN nota;
ALTER TABLE filmes ADD COLUMN nota NUMERIC(2,1);

ALTER TABLE series
  ADD COLUMN favorito                 BOOLEAN DEFAULT FALSE,
  ADD COLUMN vezes_consumido          INTEGER DEFAULT 0,
  ADD COLUMN onde_consumi             TEXT,
  ADD COLUMN valor_pago               NUMERIC(10,2),
  ADD COLUMN banner_url               TEXT,
  ADD COLUMN banner_path              TEXT,
  ADD COLUMN classificacao_indicativa TEXT,
  ADD COLUMN duracao_minutos          INTEGER,
  ADD COLUMN link_imdb                TEXT,
  ADD COLUMN link_mal                 TEXT,
  ADD COLUMN link_anilist             TEXT,
  ADD COLUMN link_oficial             TEXT;

ALTER TABLE series DROP COLUMN nota;
ALTER TABLE series ADD COLUMN nota NUMERIC(2,1);

ALTER TABLE mangas
  ADD COLUMN favorito                 BOOLEAN DEFAULT FALSE,
  ADD COLUMN vezes_consumido          INTEGER DEFAULT 0,
  ADD COLUMN onde_consumi             TEXT,
  ADD COLUMN valor_pago               NUMERIC(10,2),
  ADD COLUMN banner_url               TEXT,
  ADD COLUMN banner_path              TEXT,
  ADD COLUMN classificacao_indicativa TEXT,
  ADD COLUMN duracao_minutos          INTEGER,
  ADD COLUMN link_imdb                TEXT,
  ADD COLUMN link_mal                 TEXT,
  ADD COLUMN link_anilist             TEXT,
  ADD COLUMN link_oficial             TEXT;

ALTER TABLE mangas DROP COLUMN nota;
ALTER TABLE mangas ADD COLUMN nota NUMERIC(2,1);

ALTER TABLE podcasts
  ADD COLUMN favorito                 BOOLEAN DEFAULT FALSE,
  ADD COLUMN vezes_consumido          INTEGER DEFAULT 0,
  ADD COLUMN onde_consumi             TEXT,
  ADD COLUMN valor_pago               NUMERIC(10,2),
  ADD COLUMN banner_url               TEXT,
  ADD COLUMN banner_path              TEXT,
  ADD COLUMN classificacao_indicativa TEXT,
  ADD COLUMN duracao_minutos          INTEGER,
  ADD COLUMN link_imdb                TEXT,
  ADD COLUMN link_mal                 TEXT,
  ADD COLUMN link_anilist             TEXT,
  ADD COLUMN link_oficial             TEXT;

ALTER TABLE podcasts DROP COLUMN nota;
ALTER TABLE podcasts ADD COLUMN nota NUMERIC(2,1);