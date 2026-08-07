-- ============================================================
-- 011_biblioteca_v2_b4_mangas.sql
-- Biblioteca v2 — Sub-fase B4: Mangás
-- Publicação + volumes agrupados por arco (com cor de identificação).
-- Ver DECISIONS.md — DEC-027 (a registrar)
-- ============================================================

-- ---------- mangas: colunas de publicação ----------
-- 'titulo' (003_biblioteca.sql) segue sendo o nome principal exibido.
-- 'titulo_traduzido' é opcional, mesmo espírito de nome_original/nome_traduzido em animes.

ALTER TABLE mangas
  ADD COLUMN titulo_traduzido      TEXT,
  ADD COLUMN editora               TEXT,
  ADD COLUMN status_publicacao     TEXT DEFAULT 'em_andamento', -- 'em_andamento' | 'concluida' | 'hiato' | 'cancelada'
  ADD COLUMN ano_inicio_publicacao INTEGER,
  ADD COLUMN ano_fim_publicacao    INTEGER; -- nullable: ainda em publicação

-- ---------- mangas_volumes ----------
-- Cada linha é um volume físico/digital, agrupado por arco. `cor` permite
-- identificação visual rápida do arco na estante (hex, ex: '#b8f566').

CREATE TABLE mangas_volumes (
  uuid          TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_uuid    TEXT NOT NULL REFERENCES mangas(uuid),
  numero        INTEGER NOT NULL,
  arco          TEXT,
  cor           TEXT,             -- hex, ex: '#b8f566' — identificação visual do arco
  lido          BOOLEAN DEFAULT FALSE,
  data_leitura  DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted       BOOLEAN DEFAULT FALSE
);

ALTER TABLE mangas_volumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_data" ON mangas_volumes
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON mangas_volumes TO authenticated;

CREATE INDEX idx_mangas_volumes_manga ON mangas_volumes (manga_uuid) WHERE NOT deleted;