-- 007_remover_tags.sql
-- Remove tags e as 5 junções *_tags, substituídas por generos (006). Ver DEC-023.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

DROP TABLE IF EXISTS livros_tags;
DROP TABLE IF EXISTS filmes_tags;
DROP TABLE IF EXISTS series_tags;
DROP TABLE IF EXISTS mangas_tags;
DROP TABLE IF EXISTS podcasts_tags;
DROP TABLE IF EXISTS tags;
