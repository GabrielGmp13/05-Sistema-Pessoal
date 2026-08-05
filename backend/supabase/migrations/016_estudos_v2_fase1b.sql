-- 016_estudos_v2_fase1b.sql
-- Estudos v2 — Fase 1B: conteúdo compartilhado entre módulos, hierarquia de
-- Curso, Prova (evento oficial) como estrutura distinta de Simulado
-- (sessão informal que alimenta SM-2). Ver DEC-036.

-- =========================================================
-- 1. materias — novos campos, uso exclusivo quando tipo = 'curso'
-- =========================================================
ALTER TABLE materias
  ADD COLUMN plataforma TEXT,
  ADD COLUMN carga_horaria_total_horas NUMERIC(6,1),
  ADD COLUMN horas_dedicadas NUMERIC(6,1) DEFAULT 0,
  ADD COLUMN certificado_path TEXT,
  ADD COLUMN concluido BOOLEAN DEFAULT FALSE,
  ADD COLUMN data_conclusao DATE;

-- =========================================================
-- 2. redacoes — notas por competência (critério ENEM, 0-200 cada)
-- =========================================================
ALTER TABLE redacoes
  ADD COLUMN competencia_1 NUMERIC(5,1) CHECK (competencia_1 IS NULL OR competencia_1 BETWEEN 0 AND 200),
  ADD COLUMN competencia_2 NUMERIC(5,1) CHECK (competencia_2 IS NULL OR competencia_2 BETWEEN 0 AND 200),
  ADD COLUMN competencia_3 NUMERIC(5,1) CHECK (competencia_3 IS NULL OR competencia_3 BETWEEN 0 AND 200),
  ADD COLUMN competencia_4 NUMERIC(5,1) CHECK (competencia_4 IS NULL OR competencia_4 BETWEEN 0 AND 200),
  ADD COLUMN competencia_5 NUMERIC(5,1) CHECK (competencia_5 IS NULL OR competencia_5 BETWEEN 0 AND 200);

-- =========================================================
-- 3. modulos_curso (novo) — Curso → Módulo
-- =========================================================
CREATE TABLE modulos_curso (
  uuid         TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
  nome         TEXT NOT NULL,
  ordem        INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_modulos_curso_materia ON modulos_curso(materia_uuid) WHERE NOT deleted;

ALTER TABLE modulos_curso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON modulos_curso
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON modulos_curso TO authenticated;

-- =========================================================
-- 4. conteudos — remove materia_uuid direto, ganha modulo_curso_uuid
-- =========================================================
ALTER TABLE conteudos
  DROP COLUMN materia_uuid;

ALTER TABLE conteudos
  ADD COLUMN modulo_curso_uuid TEXT REFERENCES modulos_curso(uuid);

-- =========================================================
-- 5. conteudos_materias (novo) — N:N, substitui conteudos.materia_uuid
-- =========================================================
CREATE TABLE conteudos_materias (
  uuid        TEXT PRIMARY KEY,
user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
tema        TEXT NOT NULL,
texto       TEXT,  -- nullable desde migration 017 — pode registrar só a foto
nota        NUMERIC(4,1),
comentario  TEXT,  -- observação/correção do professor — só exposto na EDIÇÃO, não na criação (decisão do usuário)
data        DATE NOT NULL,
competencia_1 NUMERIC(5,1),
competencia_2 NUMERIC(5,1),
competencia_3 NUMERIC(5,1),
competencia_4 NUMERIC(5,1),
competencia_5 NUMERIC(5,1),
imagem_path TEXT,  -- path no bucket 'redacoes', foto da folha manuscrita · migration 017
updated_at  TIMESTAMPTZ DEFAULT NOW(),
deleted     BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conteudos_materias_conteudo ON conteudos_materias(conteudo_uuid) WHERE NOT deleted;
CREATE INDEX idx_conteudos_materias_materia ON conteudos_materias(materia_uuid) WHERE NOT deleted;

ALTER TABLE conteudos_materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON conteudos_materias
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON conteudos_materias TO authenticated;

-- =========================================================
-- 6. atividades (novo) — Escola e Curso, "backup do caderno"
-- =========================================================
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

CREATE INDEX idx_atividades_materia ON atividades(materia_uuid) WHERE NOT deleted;

ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON atividades
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON atividades TO authenticated;

-- =========================================================
-- 7. provas (novo) — evento oficial, diferente de simulados
-- =========================================================
CREATE TABLE provas (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT REFERENCES materias(uuid),
  tipo          TEXT NOT NULL DEFAULT 'escola',
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

CREATE INDEX idx_provas_data ON provas(data) WHERE NOT deleted;

ALTER TABLE provas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON provas
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON provas TO authenticated;

-- =========================================================
-- 8. questoes_individuais — gabarito digital
-- =========================================================
ALTER TABLE questoes_individuais
  ADD COLUMN prova_uuid TEXT REFERENCES provas(uuid),
  ADD COLUMN numero INTEGER,
  ADD COLUMN motivo_erro TEXT;

CREATE INDEX idx_questoes_individuais_prova ON questoes_individuais(prova_uuid) WHERE NOT deleted;

-- =========================================================
-- 9. simulados — dispara SM-2 por conteúdo, suporta redação (dia 1 ENEM)
-- =========================================================
ALTER TABLE simulados
  ADD COLUMN conteudo_uuid TEXT REFERENCES conteudos(uuid),
  ADD COLUMN redacao_uuid TEXT REFERENCES redacoes(uuid);

CREATE INDEX idx_simulados_conteudo ON simulados(conteudo_uuid) WHERE NOT deleted;