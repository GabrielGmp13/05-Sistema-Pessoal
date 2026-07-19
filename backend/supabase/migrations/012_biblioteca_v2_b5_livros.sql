-- ============================================================
-- 012_biblioteca_v2_b5_livros.sql
-- Biblioteca v2 — Sub-fase B5: Livros
-- Dados bibliográficos, leitura (formato/velocidade), anotações e citações.
-- Ver DECISIONS.md — DEC-028 (a registrar)
-- ============================================================

-- ---------- livros: colunas bibliográficas + leitura ----------

ALTER TABLE livros
  ADD COLUMN editora    TEXT,
  ADD COLUMN idioma     TEXT,
  ADD COLUMN formato    TEXT DEFAULT 'fisico', -- 'fisico' | 'ebook' | 'audiobook'
  ADD COLUMN ano_publicacao INTEGER;

-- ---------- livros_anotacoes ----------
-- Anotações e citações favoritas, associadas a uma página (quando aplicável).
-- 'tipo' distingue anotação livre de citação — validação no frontend, sem CHECK
-- (mesma convenção já usada em status de mídia).

CREATE TABLE livros_anotacoes (
  uuid        TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  livro_uuid  TEXT NOT NULL REFERENCES livros(uuid),
  tipo        TEXT NOT NULL DEFAULT 'anotacao', -- 'anotacao' | 'citacao'
  pagina      INTEGER,
  texto       TEXT NOT NULL,
  favorito    BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted     BOOLEAN DEFAULT FALSE
);

ALTER TABLE livros_anotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON livros_anotacoes
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON livros_anotacoes TO authenticated;

CREATE INDEX idx_livros_anotacoes_livro ON livros_anotacoes (livro_uuid) WHERE NOT deleted;