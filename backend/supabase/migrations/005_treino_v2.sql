-- 005_treino_v2.sql
-- Reestrutura Treino: módulos fixos, exercícios/execuções separados por
-- força/cardio. Ver DEC-020, DEC-022.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

-- ── modulos_treino ──────────────────────────────────────────────────────
CREATE TABLE modulos_treino (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cor         TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE modulos_treino ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON modulos_treino FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON modulos_treino TO authenticated;
CREATE INDEX idx_modulos_treino_ativos ON modulos_treino USING btree (user_id) WHERE (NOT deleted);

-- Seed dos 7 módulos fixos é responsabilidade do frontend no primeiro
-- carregamento (seedModulosSeNecessario()), não desta migration — ver DEC-020.

-- ── treinos: ganha vínculo a módulo ────────────────────────────────────
ALTER TABLE treinos
  ADD COLUMN IF NOT EXISTS modulo_uuid TEXT REFERENCES modulos_treino(uuid);

CREATE INDEX idx_treinos_modulo ON treinos USING btree (modulo_uuid) WHERE (NOT deleted);

-- ── exercicios_forca (substitui exercicios) ────────────────────────────
CREATE TABLE exercicios_forca (
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
);

ALTER TABLE exercicios_forca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON exercicios_forca FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON exercicios_forca TO authenticated;
CREATE INDEX idx_exercicios_forca_ativos ON exercicios_forca USING btree (treino_uuid) WHERE (NOT deleted);

-- ── exercicios_cardio (novo) ────────────────────────────────────────────
CREATE TABLE exercicios_cardio (
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
);

ALTER TABLE exercicios_cardio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON exercicios_cardio FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON exercicios_cardio TO authenticated;
CREATE INDEX idx_exercicios_cardio_ativos ON exercicios_cardio USING btree (treino_uuid) WHERE (NOT deleted);

-- ── execucoes_forca (substitui series_executadas) ──────────────────────
CREATE TABLE execucoes_forca (
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
);

ALTER TABLE execucoes_forca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON execucoes_forca FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON execucoes_forca TO authenticated;

-- ── execucoes_cardio (novo) ─────────────────────────────────────────────
CREATE TABLE execucoes_cardio (
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
);

ALTER TABLE execucoes_cardio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON execucoes_cardio FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON execucoes_cardio TO authenticated;

-- ── tabelas descontinuadas ──────────────────────────────────────────────
-- Sem dados relevantes perdidos (uso de teste) — ver DEC-020.
DROP TABLE IF EXISTS series_executadas;
DROP TABLE IF EXISTS exercicios;
DROP TABLE IF EXISTS cardio;
