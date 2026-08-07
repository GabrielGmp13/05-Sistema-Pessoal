-- 014_nota_escala_dez.sql
-- Altera nota de NUMERIC(2,1) (escala 1-5, meia estrela) para NUMERIC(3,1)
-- (escala 0-10, uma casa decimal) nas 6 tabelas de mídia da Biblioteca.
-- Sem migração automática de dado (sem uso real acumulado na v2 até agora,
-- mesmo raciocínio de DEC-023). Ver DEC-033.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

ALTER TABLE filmes
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT filmes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));

ALTER TABLE series
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT series_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));

ALTER TABLE animes
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT animes_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));

ALTER TABLE mangas
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT mangas_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));

ALTER TABLE livros
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT livros_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));

ALTER TABLE podcasts
  ALTER COLUMN nota TYPE NUMERIC(3,1),
  ADD CONSTRAINT podcasts_nota_range CHECK (nota IS NULL OR (nota BETWEEN 0 AND 10));
