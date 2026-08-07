-- 010_remover_tecnologias_filmes.sql
-- Remove filmes.tecnologias (criada em 008), descartada de escopo antes de
-- qualquer frontend consumi-la. Ver DEC-026.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

ALTER TABLE filmes DROP COLUMN IF EXISTS tecnologias;
