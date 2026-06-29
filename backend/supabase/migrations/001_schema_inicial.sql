-- ============================================================
-- Sistema Pessoal — Schema Inicial
-- Execute: Supabase Dashboard → SQL Editor → New query → Run
-- Salvar em: supabase/migrations/001_schema_inicial.sql
-- ============================================================

-- ── Storage: criar buckets ───────────────────────────────────
-- Todos privados. Arquivos servidos via signed URL (expira em 1h).
-- Convenção de path: {user_id}/nome-do-arquivo.ext

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('shape',      'shape',      false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('documentos', 'documentos', false, 52428800, ARRAY['application/pdf']),
  ('capas',      'capas',      false, 2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── Tabelas ──────────────────────────────────────────────────
-- Convenção universal:
--   uuid       TEXT PRIMARY KEY        (crypto.randomUUID() no cliente)
--   user_id    UUID NOT NULL           (auth.uid() da sessão)
--   updated_at TIMESTAMPTZ             (atualizado em todo write)
--   deleted    BOOLEAN DEFAULT FALSE   (soft delete — nunca DELETE físico)

-- Módulo: Treino

CREATE TABLE IF NOT EXISTS treinos (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS exercicios (
  uuid               TEXT PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_uuid        TEXT NOT NULL REFERENCES treinos(uuid),
  nome               TEXT NOT NULL,
  series_alvo        INTEGER,
  reps_alvo          INTEGER,
  carga_alvo         NUMERIC(6,2),
  descanso_segundos  INTEGER,
  ordem              INTEGER DEFAULT 0,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted            BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sessoes_treino (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_uuid TEXT NOT NULL REFERENCES treinos(uuid),
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim    TIMESTAMPTZ,
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS series_executadas (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sessao_uuid     TEXT NOT NULL REFERENCES sessoes_treino(uuid),
  exercicio_uuid  TEXT NOT NULL REFERENCES exercicios(uuid),
  serie_numero    INTEGER,
  carga_real      NUMERIC(6,2),
  reps_real       INTEGER,
  concluida       BOOLEAN DEFAULT FALSE,
  data_hora       TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS shape (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  peso        NUMERIC(5,2),
  foto_path   TEXT,
  observacoes TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS cardio (
  uuid             TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data             DATE NOT NULL,
  tipo             TEXT,
  duracao_minutos  INTEGER,
  distancia_km     NUMERIC(6,3),
  observacoes      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS agenda (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  treino_uuid TEXT REFERENCES treinos(uuid),
  titulo      TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

-- Módulo: Revisão Espaçada (SM-2)

CREATE TABLE IF NOT EXISTS revisao_espacada (
  uuid            TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pergunta        TEXT NOT NULL,
  resposta        TEXT,
  modulo          TEXT,
  referencia_uuid TEXT,
  ef              NUMERIC(4,2) DEFAULT 2.5,
  repeticoes      INTEGER DEFAULT 0,
  intervalo_dias  INTEGER DEFAULT 1,
  proxima_revisao DATE DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted         BOOLEAN DEFAULT FALSE
);

-- Fase 3 (Estudos): supabase/migrations/002_estudos.sql
-- Fase 4 (Biblioteca): supabase/migrations/003_biblioteca.sql

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE treinos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_treino    ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_executadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE shape             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda            ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisao_espacada  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON treinos           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON exercicios        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON sessoes_treino    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON series_executadas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON shape             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON cardio            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON agenda            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON revisao_espacada  FOR ALL USING (auth.uid() = user_id);

-- ── Storage Policies ─────────────────────────────────────────
-- Path obrigatório: {user_id}/arquivo.ext
-- Garante que cada usuário acessa apenas seus próprios arquivos.

CREATE POLICY "shape_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shape' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "shape_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shape' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "shape_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shape' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "shape_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shape' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "capas_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "capas_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "capas_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "capas_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Índices (parciais — só registros ativos) ─────────────────

CREATE INDEX IF NOT EXISTS idx_exercicios_treino  ON exercicios(treino_uuid)           WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_sessoes_data       ON sessoes_treino(data_inicio DESC)   WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_sessoes_treino     ON sessoes_treino(treino_uuid)        WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_series_exercicio   ON series_executadas(exercicio_uuid)  WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_series_sessao      ON series_executadas(sessao_uuid)     WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_shape_data         ON shape(data DESC)                   WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_cardio_data        ON cardio(data DESC)                  WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_agenda_data        ON agenda(data)                       WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_revisao_proxima    ON revisao_espacada(proxima_revisao)  WHERE NOT deleted;

-- ── Verificação pós-execução ─────────────────────────────────
-- Cole estas queries separadamente para confirmar:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;
--   SELECT id, name, public FROM storage.buckets ORDER BY 1;