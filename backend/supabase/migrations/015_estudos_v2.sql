-- 015_estudos_v2.sql
-- Estudos v2 (Fase 1 / núcleo) — ver DEC-034 em DECISIONS.md.
-- Substitui `assuntos`, `anotacoes`, `documentos_estudo`, `sessoes_questoes`
-- (v1, 002_estudos.sql) por schema novo, desenhado do zero para o v2.
-- `materias` é mantida sem alteração — segue compatível.
-- Confirmado com o usuário: dados existentes nas tabelas antigas são só de
-- teste, sem uso real acumulado — remoção segura (mesmo raciocínio de
-- DEC-023/DEC-020 em outras migrations do projeto).

-- ============================================================
-- 1. conteudos (substitui `assuntos`)
-- ============================================================
CREATE TABLE conteudos (
  uuid         TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid TEXT NOT NULL REFERENCES materias(uuid),
  nome         TEXT NOT NULL,
  progresso    INTEGER DEFAULT 0,   -- 0 a 100
  revisao_uuid TEXT,                -- aponta pra revisao_espacada.uuid, sem REFERENCES físico (mesma exceção de referencia_uuid)
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN DEFAULT FALSE
);

ALTER TABLE conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON conteudos FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON conteudos TO authenticated;
CREATE INDEX idx_conteudos_materia ON conteudos(materia_uuid) WHERE NOT deleted;

-- ============================================================
-- 2. anotacoes_estudo (substitui `anotacoes`)
-- ============================================================
CREATE TABLE anotacoes_estudo (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  conteudo_uuid TEXT REFERENCES conteudos(uuid),  -- nullable: anotação geral da matéria
  titulo        TEXT,
  corpo         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE anotacoes_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON anotacoes_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON anotacoes_estudo TO authenticated;
CREATE INDEX idx_anotacoes_estudo_materia ON anotacoes_estudo(materia_uuid) WHERE NOT deleted;
CREATE INDEX idx_anotacoes_estudo_conteudo ON anotacoes_estudo(conteudo_uuid) WHERE NOT deleted;

-- ============================================================
-- 3. materiais_estudo (substitui `documentos_estudo` — mais amplo: link/vídeo/livro, não só PDF)
-- ============================================================
CREATE TABLE materiais_estudo (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo_uuid TEXT NOT NULL REFERENCES conteudos(uuid),
  tipo          TEXT NOT NULL DEFAULT 'link',  -- 'link' | 'pdf' | 'video' | 'livro' | 'outro'
  titulo        TEXT NOT NULL,
  url           TEXT,          -- link externo ou vídeo
  arquivo_path  TEXT,          -- upload no bucket 'documentos' (já existe, 50MB, PDF)
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE materiais_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON materiais_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON materiais_estudo TO authenticated;
CREATE INDEX idx_materiais_estudo_conteudo ON materiais_estudo(conteudo_uuid) WHERE NOT deleted;

-- ============================================================
-- 4. sessoes_estudo (novo)
-- ============================================================
CREATE TABLE sessoes_estudo (
  uuid             TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid     TEXT NOT NULL REFERENCES materias(uuid),
  conteudo_uuid    TEXT REFERENCES conteudos(uuid),  -- nullable: sessão geral da matéria
  inicio           TIMESTAMPTZ NOT NULL,
  fim              TIMESTAMPTZ,
  duracao_minutos  INTEGER,          -- calculado no frontend a partir de inicio/fim, ou registrado manualmente
  observacoes      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);

ALTER TABLE sessoes_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON sessoes_estudo FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON sessoes_estudo TO authenticated;
CREATE INDEX idx_sessoes_estudo_materia ON sessoes_estudo(materia_uuid) WHERE NOT deleted;
CREATE INDEX idx_sessoes_estudo_inicio ON sessoes_estudo(inicio) WHERE NOT deleted;  -- acelera queries de dashboard (hoje/semana/mês)

-- ============================================================
-- 5. questoes_individuais (substitui `sessoes_questoes` — granularidade por questão)
-- ============================================================
CREATE TABLE questoes_individuais (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid  TEXT NOT NULL REFERENCES materias(uuid),
  conteudo_uuid TEXT REFERENCES conteudos(uuid),  -- nullable
  acertou       BOOLEAN NOT NULL,
  data          DATE NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE questoes_individuais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON questoes_individuais FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON questoes_individuais TO authenticated;
CREATE INDEX idx_questoes_individuais_materia ON questoes_individuais(materia_uuid) WHERE NOT deleted;
CREATE INDEX idx_questoes_individuais_conteudo ON questoes_individuais(conteudo_uuid) WHERE NOT deleted;

-- ============================================================
-- 6. simulados (novo — registro de prova completa, separado de questão individual)
-- ============================================================
CREATE TABLE simulados (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid    TEXT REFERENCES materias(uuid),  -- nullable: simulado multi-matéria (ex: ENEM completo)
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
CREATE INDEX idx_simulados_data ON simulados(data) WHERE NOT deleted;

-- ============================================================
-- 7. redacoes (novo — versão leve, sem versionamento)
-- ============================================================
CREATE TABLE redacoes (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema        TEXT NOT NULL,
  texto       TEXT NOT NULL,
  nota        NUMERIC(4,1),   -- livre, sem escala fixa (ENEM usa 0-1000, outras bancas variam)
  comentario  TEXT,
  data        DATE NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE redacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON redacoes FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON redacoes TO authenticated;
CREATE INDEX idx_redacoes_data ON redacoes(data) WHERE NOT deleted;

-- ============================================================
-- 8. Remoção das tabelas v1 substituídas (confirmado: só dado de teste)
-- ============================================================
DROP TABLE IF EXISTS sessoes_questoes;
DROP TABLE IF EXISTS documentos_estudo;
DROP TABLE IF EXISTS anotacoes;
DROP TABLE IF EXISTS assuntos;

-- `materias` NÃO é removida — schema compatível, reaproveitada sem alteração.
-- `revisao_espacada` NÃO é alterada — reaproveitada via convenção de uso:
-- modulo = 'estudos', referencia_uuid = conteudos.uuid, pergunta = rótulo do
-- conteúdo (sem par pergunta/resposta — é lembrete, não flashcard).