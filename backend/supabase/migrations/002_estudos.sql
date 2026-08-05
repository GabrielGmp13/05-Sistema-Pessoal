-- ============================================================
-- 002_estudos.sql
-- Módulo de Estudos — Sistema Pessoal
--
-- Tabelas:
--   materias          → disciplinas com tipo e cor
--   assuntos          → tópicos dentro de matérias + progresso
--   anotacoes         → notas e resumos
--   documentos_estudo → PDFs e arquivos (bucket 'documentos')
--   sessoes_questoes  → desempenho por sessão de prática
--
-- Convenções seguidas:
--   • uuid TEXT PRIMARY KEY (gerado no cliente)
--   • user_id UUID FK → auth.users
--   • FKs: <tabela_singular>_uuid (ex: materia_uuid, assunto_uuid)
--   • deleted BOOLEAN DEFAULT FALSE (soft delete universal)
--   • RLS obrigatório em toda tabela
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. MATÉRIAS
-- Disciplinas de estudo com tipo e cor para identificação visual
-- ─────────────────────────────────────────────────────────────
CREATE TABLE materias (
  uuid           TEXT PRIMARY KEY,
user_id        UUID NOT NULL REFERENCES auth.users(id),
nome           TEXT NOT NULL,
tipo           TEXT NOT NULL DEFAULT 'academica',  -- 'academica' | 'olimpiada' | 'concurso' | 'curso' | 'outro'
cor            TEXT,
mostra_escola  BOOLEAN NOT NULL DEFAULT false,  -- ver DEC-040 · migration 018
mostra_enem    BOOLEAN NOT NULL DEFAULT false,  -- ver DEC-040 · migration 018
area_enem      TEXT,  -- 'linguagens'|'humanas'|'natureza'|'matematica', só quando mostra_enem=true · migration 017
updated_at     TIMESTAMPTZ DEFAULT NOW(),
deleted        BOOLEAN DEFAULT FALSE
);

ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON materias
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_materias_user
  ON materias(user_id)
  WHERE NOT deleted;


-- ─────────────────────────────────────────────────────────────
-- 2. ASSUNTOS
-- Tópicos dentro de cada matéria com acompanhamento de progresso
-- ─────────────────────────────────────────────────────────────
CREATE TABLE assuntos (
  uuid         TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id),
  materia_uuid TEXT        NOT NULL REFERENCES materias(uuid),
  nome         TEXT        NOT NULL,
  progresso    INTEGER     DEFAULT 0,
    -- 0 a 100 — percentual de domínio definido manualmente
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN     DEFAULT FALSE,

  CONSTRAINT progresso_valido CHECK (progresso BETWEEN 0 AND 100)
);

ALTER TABLE assuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON assuntos
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_assuntos_materia
  ON assuntos(materia_uuid)
  WHERE NOT deleted;


-- ─────────────────────────────────────────────────────────────
-- 3. ANOTAÇÕES
-- Notas, resumos e fórmulas — vinculadas à matéria e
-- opcionalmente a um assunto específico
-- ─────────────────────────────────────────────────────────────
CREATE TABLE anotacoes (
  uuid         TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id),
  materia_uuid TEXT        NOT NULL REFERENCES materias(uuid),
  assunto_uuid TEXT        REFERENCES assuntos(uuid),
    -- nullable: null = anotação geral da matéria
  titulo       TEXT,
  conteudo     TEXT        NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN     DEFAULT FALSE
);

ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON anotacoes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_anotacoes_materia
  ON anotacoes(materia_uuid)
  WHERE NOT deleted;

CREATE INDEX idx_anotacoes_assunto
  ON anotacoes(assunto_uuid)
  WHERE assunto_uuid IS NOT NULL AND NOT deleted;


-- ─────────────────────────────────────────────────────────────
-- 4. DOCUMENTOS DE ESTUDO
-- PDFs, apostilas e provas — armazenados no bucket 'documentos'
-- arquivo_path segue a convenção: {user_id}/{nome-arquivo}.pdf
-- ─────────────────────────────────────────────────────────────
CREATE TABLE documentos_estudo (
  uuid         TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id),
  materia_uuid TEXT        REFERENCES materias(uuid),
    -- nullable: documento geral sem matéria específica
  assunto_uuid TEXT        REFERENCES assuntos(uuid),
    -- nullable
  nome         TEXT        NOT NULL,
  arquivo_path TEXT,
    -- path no bucket 'documentos', ex: '{user_id}/enem-2022-matematica.pdf'
    -- null se for apenas referência sem upload
  tipo         TEXT        DEFAULT 'outro',
    -- valores: 'apostila' | 'prova' | 'gabarito' | 'resumo' | 'exercicios' | 'outro'
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted      BOOLEAN     DEFAULT FALSE
);

ALTER TABLE documentos_estudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON documentos_estudo
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_docs_estudo_materia
  ON documentos_estudo(materia_uuid)
  WHERE NOT deleted;

CREATE INDEX idx_docs_estudo_user
  ON documentos_estudo(user_id)
  WHERE NOT deleted;


-- ─────────────────────────────────────────────────────────────
-- 5. SESSÕES DE QUESTÕES
-- Registra cada sessão de prática com questões:
-- quantas foram feitas, quantas acertou, de qual fonte, quando.
-- Pode referenciar um documento (ex: prova em PDF) como origem.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE sessoes_questoes (
  uuid             TEXT        PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  materia_uuid     TEXT        REFERENCES materias(uuid),
    -- nullable: sessão multi-matéria (ex: ENEM completo)
  assunto_uuid     TEXT        REFERENCES assuntos(uuid),
    -- nullable
  documento_uuid   TEXT        REFERENCES documentos_estudo(uuid),
    -- nullable: prova de referência
  fonte            TEXT,
    -- descrição livre, ex: 'ENEM 2022 - Caderno Azul', 'Lista cap. 3'
  total_questoes   INTEGER     NOT NULL,
  total_acertos    INTEGER     NOT NULL DEFAULT 0,
  data_estudo      DATE        NOT NULL,
  tempo_minutos    INTEGER,
    -- nullable: duração da sessão em minutos
  observacoes      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN     DEFAULT FALSE,

  CONSTRAINT questoes_positivo CHECK (total_questoes > 0),
  CONSTRAINT acertos_validos   CHECK (total_acertos >= 0 AND total_acertos <= total_questoes)
);

ALTER TABLE sessoes_questoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON sessoes_questoes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sessoes_q_user
  ON sessoes_questoes(user_id)
  WHERE NOT deleted;

CREATE INDEX idx_sessoes_q_materia
  ON sessoes_questoes(materia_uuid)
  WHERE NOT deleted;

CREATE INDEX idx_sessoes_q_data
  ON sessoes_questoes(data_estudo DESC)
  WHERE NOT deleted;