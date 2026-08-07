-- ============================================================
-- 009_biblioteca_v2_b3.sql
-- Biblioteca v2 — Sub-fase B3: Animes
-- Ver DECISIONS.md — DEC-025 (a registrar)
-- ============================================================

-- ---------- elenco: estende pra suportar dublador (anime) ----------

ALTER TABLE elenco
  ADD COLUMN dublador_original TEXT,
  ADD COLUMN dublador_br       TEXT;
-- 'ator' permanece usado por filme/série. Anime preenche os dois novos
-- campos e deixa 'ator' nulo. 'personagem' e 'foto_url' seguem compartilhados.

-- ---------- animes ----------

CREATE TABLE animes (
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
  duracao_minutos          INTEGER,     -- duração média por episódio
  mal_id                   TEXT,
  anilist_id                TEXT,
  link_imdb                TEXT,
  link_mal                 TEXT,
  link_anilist              TEXT,
  link_oficial              TEXT,
  diretor                  TEXT,
  roteirista               TEXT,
  produtores               TEXT,
  estudio                  TEXT,
  distribuidora             TEXT,
  character_designer        TEXT,
  animador_chefe            TEXT,
  compositor                TEXT,
  status                    TEXT DEFAULT 'quero_ver',  -- mesmos valores de 'series'
  nota                      NUMERIC(2,1),
  comentario                 TEXT,
  data_inicio                DATE,
  data_fim                   DATE,
  favorito                   BOOLEAN DEFAULT FALSE,
  vezes_consumido            INTEGER DEFAULT 0,
  onde_consumi                TEXT,
  valor_pago                  NUMERIC(10,2),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  deleted                     BOOLEAN DEFAULT FALSE
);

ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON animes
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON animes TO authenticated;

CREATE INDEX idx_animes_ativos ON animes (user_id) WHERE NOT deleted;

-- ---------- animes_generos ----------

CREATE TABLE animes_generos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_uuid  TEXT NOT NULL REFERENCES animes(uuid),
  genero_uuid TEXT NOT NULL REFERENCES generos(uuid),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE animes_generos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON animes_generos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON animes_generos TO authenticated;

-- ---------- animes_temporadas ----------

CREATE TABLE animes_temporadas (
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
);
ALTER TABLE animes_temporadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON animes_temporadas FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON animes_temporadas TO authenticated;

CREATE INDEX idx_animes_temporadas_anime ON animes_temporadas (anime_uuid) WHERE NOT deleted;

-- ---------- animes_episodios (granularidade por episódio, com filler) ----------

CREATE TABLE animes_episodios (
  uuid           TEXT PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temporada_uuid TEXT NOT NULL REFERENCES animes_temporadas(uuid),
  numero         INTEGER NOT NULL,
  titulo         TEXT,
  arco           TEXT,          -- nome do arco narrativo (pode não coincidir com fronteira de temporada)
  filler         BOOLEAN DEFAULT FALSE,
  assistido       BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);
ALTER TABLE animes_episodios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON animes_episodios FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON animes_episodios TO authenticated;

CREATE INDEX idx_animes_episodios_temporada ON animes_episodios (temporada_uuid) WHERE NOT deleted;

-- ---------- openings_endings ----------

CREATE TABLE openings_endings (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_uuid  TEXT NOT NULL REFERENCES animes(uuid),
  tipo        TEXT NOT NULL,     -- 'opening' | 'ending' — validado no frontend
  nome        TEXT NOT NULL,
  artista     TEXT,
  link_video  TEXT,
  minha_nota  NUMERIC(2,1),
  ordem       INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);
ALTER TABLE openings_endings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON openings_endings FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON openings_endings TO authenticated;

-- ---------- filmes: suporte a complementos de anime ----------

ALTER TABLE filmes
  ADD COLUMN anime_uuid        TEXT REFERENCES animes(uuid),  -- nulo = filme normal, não vinculado
  ADD COLUMN tipo_complemento  TEXT;  -- 'filme' | 'ova' | 'ona' | 'special' — nulo = filme normal

CREATE INDEX idx_filmes_anime ON filmes (anime_uuid) WHERE anime_uuid IS NOT NULL AND NOT deleted;

-- ---------- animes_ordem_consumo ----------
-- referencia_uuid aponta para animes_temporadas.uuid OU filmes.uuid,
-- dependendo de tipo_referencia. FK polimórfica — mesmo padrão de exceção
-- já usado em elenco/trilha_sonora (DEC-024) e revisao_espacada (histórico).

CREATE TABLE animes_ordem_consumo (
  uuid              TEXT PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_uuid        TEXT NOT NULL REFERENCES animes(uuid),
  ordem             INTEGER NOT NULL,
  tipo_referencia   TEXT NOT NULL,   -- 'temporada' | 'complemento'
  referencia_uuid   TEXT NOT NULL,
  rotulo            TEXT NOT NULL,   -- ex: "Temporada 1", "Filme: O Início"
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted             BOOLEAN DEFAULT FALSE
);
ALTER TABLE animes_ordem_consumo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON animes_ordem_consumo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON animes_ordem_consumo TO authenticated;

CREATE INDEX idx_ordem_consumo_anime ON animes_ordem_consumo (anime_uuid) WHERE NOT deleted;