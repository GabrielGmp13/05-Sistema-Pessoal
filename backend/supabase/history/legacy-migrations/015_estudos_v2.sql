-- 015_estudos_v2.sql
-- Estudos v2 (Fase 1 / núcleo): substitui assuntos/anotacoes/documentos_estudo/
-- sessoes_questoes (v1, 002_estudos.sql) por conteudos/anotacoes_estudo/
-- materiais_estudo/questoes_individuais; adiciona sessoes_estudo, simulados,
-- redacoes. materias mantida sem alteração nesta migration. Ver DEC-035.
--
-- ⚠️ REESCRITA em 2026-08: a cópia deste arquivo que estava no repositório
-- continha erros estruturais (coluna de sessoes_estudo aparecendo em índice
-- de outra tabela, referência a modulos_curso antes de ela existir). O banco
-- de produção nunca teve esse problema — só o arquivo local estava corrompido.
-- Esta versão foi reconstruída para bater exatamente com o dump real do
-- schema. Ver DATABASE.md, seção "Migrações", nota sobre 015/016 corrompidas.
--
-- Nota de sequência: o vínculo conteudo<->modulo_curso e a tabela modulos_curso
-- só existem a partir de 016_estudos_v2_fase1b.sql — por isso conteudos
-- nasce aqui SEM modulo_curso_uuid (adicionado depois). Da mesma forma,
-- conteudos nasce aqui COM materia_uuid (1:1) — a migration 016 troca isso
-- por vínculo N:N via conteudos_materias.

-- ── conteudos (substitui assuntos) ──────────────────────────────────────
CREATE TABLE conteudos (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  progresso     INTEGER DEFAULT 0,
  revisao_uuid  TEXT,   -- FK polimórfica pra revisao_espacada.uuid, sem REFERENCES físico
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON conteudos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON conteudos TO authenticated;

-- ── anotacoes_estudo (substitui anotacoes) ──────────────────────────────
CREATE TABLE anotacoes_estudo (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  conteudo_uuid TEXT REFERENCES conteudos(uuid),
  titulo        TEXT,
  corpo         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE anotacoes_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON anotacoes_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON anotacoes_estudo TO authenticated;
CREATE INDEX idx_anotacoes_estudo_materia ON anotacoes_estudo USING btree (materia_uuid) WHERE (NOT deleted);
CREATE INDEX idx_anotacoes_estudo_conteudo ON anotacoes_estudo USING btree (conteudo_uuid) WHERE (NOT deleted);

-- ── materiais_estudo (substitui documentos_estudo) ──────────────────────
CREATE TABLE materiais_estudo (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
  tipo          TEXT NOT NULL DEFAULT 'link',  -- 'link' | 'pdf' | 'video' | 'livro' | 'outro'
  titulo        TEXT NOT NULL,
  url           TEXT,
  arquivo_path  TEXT,   -- bucket 'documentos'
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE materiais_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON materiais_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON materiais_estudo TO authenticated;
CREATE INDEX idx_materiais_estudo_conteudo ON materiais_estudo USING btree (conteudo_uuid) WHERE (NOT deleted);

-- ── sessoes_estudo (novo) ────────────────────────────────────────────────
CREATE TABLE sessoes_estudo (
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
);

ALTER TABLE sessoes_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON sessoes_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON sessoes_estudo TO authenticated;
CREATE INDEX idx_sessoes_estudo_materia ON sessoes_estudo USING btree (materia_uuid) WHERE (NOT deleted);
CREATE INDEX idx_sessoes_estudo_inicio ON sessoes_estudo USING btree (inicio) WHERE (NOT deleted);

-- ── questoes_individuais (substitui sessoes_questoes) ───────────────────
CREATE TABLE questoes_individuais (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  conteudo_uuid TEXT REFERENCES conteudos(uuid),
  acertou       BOOLEAN NOT NULL,
  data          DATE NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE questoes_individuais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON questoes_individuais FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON questoes_individuais TO authenticated;
CREATE INDEX idx_questoes_individuais_materia ON questoes_individuais USING btree (materia_uuid) WHERE (NOT deleted);
CREATE INDEX idx_questoes_individuais_conteudo ON questoes_individuais USING btree (conteudo_uuid) WHERE (NOT deleted);

-- ── simulados (novo) ──────────────────────────────────────────────────────
CREATE TABLE simulados (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid    TEXT REFERENCES materias(uuid),  -- nullable: multi-matéria
  data            DATE NOT NULL,
  total_questoes  INTEGER NOT NULL,
  total_acertos   INTEGER NOT NULL DEFAULT 0,
  tempo_minutos   INTEGER,
  observacoes     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

ALTER TABLE simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON simulados FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON simulados TO authenticated;
CREATE INDEX idx_simulados_data ON simulados USING btree (data) WHERE (NOT deleted);

-- ── redacoes (novo) ───────────────────────────────────────────────────────
CREATE TABLE redacoes (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema        TEXT NOT NULL,
  texto       TEXT NOT NULL,
  nota        NUMERIC(4,1),
  comentario  TEXT,
  data        DATE NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE redacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON redacoes FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON redacoes TO authenticated;
CREATE INDEX idx_redacoes_data ON redacoes USING btree (data) WHERE (NOT deleted);

-- ── tabelas descontinuadas (v1 de Estudos) ──────────────────────────────
-- Confirmado com o usuário: dado existente era só de teste. Ver DEC-035.
DROP TABLE IF EXISTS sessoes_questoes;
DROP TABLE IF EXISTS documentos_estudo;
DROP TABLE IF EXISTS anotacoes;
DROP TABLE IF EXISTS assuntos;
