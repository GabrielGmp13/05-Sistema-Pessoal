-- 016_estudos_v2_fase1b.sql
-- Estudos v2 Fase 1B: conteúdo compartilhado (N:N) entre matérias, hierarquia
-- de Curso, Atividades, Prova como estrutura distinta de Simulado, gabarito
-- digital em questoes_individuais. Ver DEC-036.
--
-- ⚠️ REESCRITA em 2026-08: a cópia deste arquivo que estava no repositório
-- continha erros estruturais (conteudos_materias com a estrutura de
-- redacoes por engano, índice em colunas inexistentes). O banco de produção
-- nunca teve esse problema — só o arquivo local estava corrompido. Esta
-- versão foi reconstruída para bater exatamente com o dump real do schema.
-- Ver DATABASE.md, seção "Migrações", nota sobre 015/016 corrompidas.

-- ── modulos_curso (novo) — precisa existir antes do ALTER de conteudos ──
CREATE TABLE modulos_curso (
  uuid         TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid TEXT NOT NULL REFERENCES materias(uuid),  -- o curso
  nome         TEXT NOT NULL,
  ordem        INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN DEFAULT FALSE
);

ALTER TABLE modulos_curso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON modulos_curso FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON modulos_curso TO authenticated;
CREATE INDEX idx_modulos_curso_materia ON modulos_curso USING btree (materia_uuid) WHERE (NOT deleted);

-- ── conteudos_materias (novo — N:N, substitui conteudos.materia_uuid) ──
CREATE TABLE conteudos_materias (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE conteudos_materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON conteudos_materias FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON conteudos_materias TO authenticated;
CREATE INDEX idx_conteudos_materias_conteudo ON conteudos_materias USING btree (conteudo_uuid) WHERE (NOT deleted);
CREATE INDEX idx_conteudos_materias_materia ON conteudos_materias USING btree (materia_uuid) WHERE (NOT deleted);

-- Migra dados existentes de conteudos.materia_uuid para conteudos_materias
-- antes de remover a coluna (nenhuma linha deve ser perdida).
INSERT INTO conteudos_materias (uuid, user_id, conteudo_uuid, materia_uuid, updated_at, deleted)
SELECT gen_random_uuid()::text, user_id, uuid, materia_uuid, NOW(), FALSE
FROM conteudos
WHERE materia_uuid IS NOT NULL;

-- ── conteudos: perde materia_uuid (1:1), ganha modulo_curso_uuid ───────
ALTER TABLE conteudos
  DROP COLUMN IF EXISTS materia_uuid,
  ADD COLUMN IF NOT EXISTS modulo_curso_uuid TEXT REFERENCES modulos_curso(uuid);

-- ── atividades (novo — Escola e Curso) ──────────────────────────────────
CREATE TABLE atividades (
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
);

ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON atividades FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON atividades TO authenticated;
CREATE INDEX idx_atividades_materia ON atividades USING btree (materia_uuid) WHERE (NOT deleted);

-- ── provas (novo — evento oficial, diferente de simulados) ─────────────
CREATE TABLE provas (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT REFERENCES materias(uuid),   -- nullable: ENEM cobre 2 áreas
  tipo          TEXT NOT NULL DEFAULT 'escola',   -- 'escola'|'enem_dia1'|'enem_dia2'|'curso'|'outro'
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
);

ALTER TABLE provas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON provas FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON provas TO authenticated;
CREATE INDEX idx_provas_data ON provas USING btree (data) WHERE (NOT deleted);

-- ── questoes_individuais: ganha gabarito ────────────────────────────────
ALTER TABLE questoes_individuais
  ADD COLUMN IF NOT EXISTS prova_uuid  TEXT REFERENCES provas(uuid),
  ADD COLUMN IF NOT EXISTS numero      INTEGER,
  ADD COLUMN IF NOT EXISTS motivo_erro TEXT;

CREATE INDEX idx_questoes_individuais_prova ON questoes_individuais USING btree (prova_uuid) WHERE (NOT deleted);

-- ── simulados: ganha vínculo a conteúdo (dispara SM-2) e a redação ─────
ALTER TABLE simulados
  ADD COLUMN IF NOT EXISTS conteudo_uuid TEXT REFERENCES conteudos(uuid),
  ADD COLUMN IF NOT EXISTS redacao_uuid  TEXT REFERENCES redacoes(uuid);

CREATE INDEX idx_simulados_conteudo ON simulados USING btree (conteudo_uuid) WHERE (NOT deleted);

-- ── redacoes: ganha as 5 notas de competência ───────────────────────────
ALTER TABLE redacoes
  ADD COLUMN IF NOT EXISTS competencia_1 NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS competencia_2 NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS competencia_3 NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS competencia_4 NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS competencia_5 NUMERIC(5,1);

ALTER TABLE redacoes ADD CONSTRAINT redacoes_competencia_1_check CHECK (competencia_1 IS NULL OR competencia_1 BETWEEN 0 AND 200);
ALTER TABLE redacoes ADD CONSTRAINT redacoes_competencia_2_check CHECK (competencia_2 IS NULL OR competencia_2 BETWEEN 0 AND 200);
ALTER TABLE redacoes ADD CONSTRAINT redacoes_competencia_3_check CHECK (competencia_3 IS NULL OR competencia_3 BETWEEN 0 AND 200);
ALTER TABLE redacoes ADD CONSTRAINT redacoes_competencia_4_check CHECK (competencia_4 IS NULL OR competencia_4 BETWEEN 0 AND 200);
ALTER TABLE redacoes ADD CONSTRAINT redacoes_competencia_5_check CHECK (competencia_5 IS NULL OR competencia_5 BETWEEN 0 AND 200);

-- ── materias: ganha campos de Curso ─────────────────────────────────────
ALTER TABLE materias
  ADD COLUMN IF NOT EXISTS plataforma                 TEXT,
  ADD COLUMN IF NOT EXISTS carga_horaria_total_horas   NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS horas_dedicadas             NUMERIC(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certificado_path            TEXT,
  ADD COLUMN IF NOT EXISTS concluido                   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_conclusao               DATE;
