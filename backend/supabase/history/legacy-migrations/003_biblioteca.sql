-- 003_biblioteca.sql
-- Módulo: Biblioteca (Fase 4)
-- Catálogo pessoal de mídia (livros, filmes, séries, mangás, podcasts)
-- Ver DEC-011 (catálogo, nunca hospedagem de mídia) e DEC-014 (tabelas separadas por tipo)

-- =========================================
-- TAGS (compartilhada entre todos os tipos)
-- =========================================
CREATE TABLE tags (
  uuid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted    BOOLEAN DEFAULT FALSE
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON tags FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- LIVROS
-- =========================================
CREATE TABLE livros (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  autor           TEXT,
  isbn            TEXT,
  google_books_id TEXT,                    -- para refresh futuro de metadados
  capa_url        TEXT,                    -- retornada pela Google Books API
  capa_path       TEXT,                    -- upload manual no bucket 'capas', só se API não tiver capa
  paginas_total   INTEGER,
  pagina_atual    INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'quero_ler', -- 'quero_ler' | 'lendo' | 'pausado' | 'concluido' | 'abandonado'
  nota            INTEGER,                  -- 1 a 10, nullable
  comentario      TEXT,
  data_inicio     DATE,
  data_fim        DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

ALTER TABLE livros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON livros FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_livros_ativos ON livros (user_id) WHERE NOT deleted;

CREATE TABLE livros_tags (
  uuid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  livro_uuid TEXT NOT NULL REFERENCES livros(uuid),
  tag_uuid   TEXT NOT NULL REFERENCES tags(uuid),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted    BOOLEAN DEFAULT FALSE
);

ALTER TABLE livros_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON livros_tags FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- FILMES
-- =========================================
CREATE TABLE filmes (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  diretor     TEXT,
  tmdb_id     TEXT,                      -- para refresh futuro de metadados
  capa_url    TEXT,
  capa_path   TEXT,
  status      TEXT DEFAULT 'quero_ver',  -- 'quero_ver' | 'assistido' | 'abandonado'
  nota        INTEGER,                   -- 1 a 10
  comentario  TEXT,
  data_inicio DATE,
  data_fim    DATE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE filmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON filmes FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_filmes_ativos ON filmes (user_id) WHERE NOT deleted;

CREATE TABLE filmes_tags (
  uuid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filme_uuid TEXT NOT NULL REFERENCES filmes(uuid),
  tag_uuid   TEXT NOT NULL REFERENCES tags(uuid),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted    BOOLEAN DEFAULT FALSE
);

ALTER TABLE filmes_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON filmes_tags FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- SÉRIES
-- =========================================
CREATE TABLE series (
  uuid             TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  diretor          TEXT,
  tmdb_id          TEXT,
  capa_url         TEXT,
  capa_path        TEXT,
  temporada_atual  INTEGER DEFAULT 1,
  episodio_atual   INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'quero_ver', -- 'quero_ver' | 'assistindo' | 'pausado' | 'concluido' | 'abandonado'
  nota             INTEGER,
  comentario       TEXT,
  data_inicio      DATE,
  data_fim         DATE,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON series FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_series_ativas ON series (user_id) WHERE NOT deleted;

CREATE TABLE series_tags (
  uuid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  serie_uuid TEXT NOT NULL REFERENCES series(uuid),
  tag_uuid   TEXT NOT NULL REFERENCES tags(uuid),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted    BOOLEAN DEFAULT FALSE
);

ALTER TABLE series_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON series_tags FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- MANGÁS (API: MyAnimeList/Jikan — gratuita, sem key)
-- =========================================
CREATE TABLE mangas (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  autor           TEXT,
  mal_id          TEXT,                      -- MyAnimeList/Jikan API — refresh futuro de volumes, sinopse, nota da comunidade
  capa_url        TEXT,                      -- Jikan fornece capa via URL
  capa_path       TEXT,                      -- upload manual, só se não vier da API
  capitulo_atual  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'quero_ler',  -- 'quero_ler' | 'lendo' | 'pausado' | 'concluido' | 'abandonado'
  nota            INTEGER,
  comentario      TEXT,
  data_inicio     DATE,
  data_fim        DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON mangas FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mangas_ativos ON mangas (user_id) WHERE NOT deleted;

CREATE TABLE mangas_tags (
  uuid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_uuid TEXT NOT NULL REFERENCES mangas(uuid),
  tag_uuid   TEXT NOT NULL REFERENCES tags(uuid),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted    BOOLEAN DEFAULT FALSE
);

ALTER TABLE mangas_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON mangas_tags FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- PODCASTS (sem API definida — sempre upload manual de capa)
-- =========================================
CREATE TABLE podcasts (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  capa_path       TEXT,
  episodio_atual  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ouvindo', -- 'ouvindo' | 'pausado' | 'abandonado'
  nota            INTEGER,
  comentario      TEXT,
  data_inicio     DATE,
  data_fim        DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON podcasts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_podcasts_ativos ON podcasts (user_id) WHERE NOT deleted;

CREATE TABLE podcasts_tags (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_uuid  TEXT NOT NULL REFERENCES podcasts(uuid),
  tag_uuid      TEXT NOT NULL REFERENCES tags(uuid),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE podcasts_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON podcasts_tags FOR ALL USING (auth.uid() = user_id);