-- ============================================================
-- 008_biblioteca_v2_b2.sql
-- Biblioteca v2 — Sub-fase B2: Filmes + Séries
-- Produção, elenco, trilha sonora, temporadas.
-- Ver DECISIONS.md — DEC-024 (a registrar)
-- ============================================================

-- ---------- Filmes: colunas de produção ----------

ALTER TABLE filmes
  ADD COLUMN roteirista     TEXT,
  ADD COLUMN produtores     TEXT,
  ADD COLUMN estudio        TEXT,
  ADD COLUMN distribuidora  TEXT,
  ADD COLUMN orcamento      NUMERIC(14,2),
  ADD COLUMN bilheteria     NUMERIC(14,2),
  ADD COLUMN tecnologias    TEXT[],        -- ex: {IMAX, "Dolby Vision"}
  ADD COLUMN ano_lancamento INTEGER;

-- ---------- Séries: colunas de produção ----------

ALTER TABLE series
  ADD COLUMN roteirista     TEXT,
  ADD COLUMN produtores     TEXT,
  ADD COLUMN estudio        TEXT,
  ADD COLUMN distribuidora  TEXT,
  ADD COLUMN ano_lancamento INTEGER,
  ADD COLUMN ano_termino    INTEGER;   -- nullable: série em andamento

-- ---------- series_temporadas ----------

CREATE TABLE series_temporadas (
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
);

ALTER TABLE series_temporadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON series_temporadas
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON series_temporadas TO authenticated;

CREATE INDEX idx_series_temporadas_serie ON series_temporadas (serie_uuid) WHERE NOT deleted;

-- ---------- elenco (reutilizável — filmes e séries por ora) ----------
-- tipo_obra + obra_uuid: FK polimórfica, mesmo padrão de exceção documentado
-- para revisao_espacada.referencia_uuid em NAMING_CONVENTIONS.md.
-- Valores válidos de tipo_obra hoje: 'filme', 'serie'. Validação no frontend,
-- sem CHECK constraint — mesma convenção já usada em status de mídia (DATABASE.md).

CREATE TABLE elenco (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_obra   TEXT NOT NULL,
  obra_uuid   TEXT NOT NULL,
  ator        TEXT NOT NULL,
  personagem  TEXT,
  foto_url    TEXT,
  ordem       INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE elenco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON elenco
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON elenco TO authenticated;

CREATE INDEX idx_elenco_obra ON elenco (tipo_obra, obra_uuid) WHERE NOT deleted;

-- ---------- trilha_sonora (reutilizável — filmes e séries por ora) ----------

CREATE TABLE trilha_sonora (
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
);

ALTER TABLE trilha_sonora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON trilha_sonora
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON trilha_sonora TO authenticated;

CREATE INDEX idx_trilha_sonora_obra ON trilha_sonora (tipo_obra, obra_uuid) WHERE NOT deleted;