-- 004_podcasts_itunes.sql
-- Adiciona metadados da iTunes Search API a podcasts. Ver DEC-016.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

ALTER TABLE podcasts
  ADD COLUMN IF NOT EXISTS itunes_id TEXT,
  ADD COLUMN IF NOT EXISTS capa_url  TEXT;
