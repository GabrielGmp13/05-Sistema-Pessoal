-- 019_gabarito_dominio_dificuldade.sql
-- questoes_individuais.materia_uuid vira nullable (matéria só é decidida na
-- fase de corrigir do gabarito); adiciona letra_marcada/letra_correta
-- (fluxo em 2 fases do gabarito) e dificuldade. conteudos.progresso é
-- REMOVIDO, substituído por teoria_vista + dominado_manual (domínio
-- calculado via SM-2, não gravado). Ver DEC-041/DEC-042.
-- Reconstruído em 2026-08 a partir do dump real do schema (arquivo original
-- não foi copiado para o VS Code — ver DATABASE.md, nota sobre arquivos recriados).

-- ── questoes_individuais: gabarito em 2 fases ───────────────────────────
ALTER TABLE questoes_individuais
  ALTER COLUMN materia_uuid DROP NOT NULL,
  ALTER COLUMN acertou DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS letra_marcada TEXT,
  ADD COLUMN IF NOT EXISTS letra_correta TEXT,
  ADD COLUMN IF NOT EXISTS dificuldade   TEXT;

ALTER TABLE questoes_individuais
  ADD CONSTRAINT questoes_individuais_letra_marcada_check
    CHECK (letra_marcada IS NULL OR letra_marcada IN ('A','B','C','D','E'));

ALTER TABLE questoes_individuais
  ADD CONSTRAINT questoes_individuais_letra_correta_check
    CHECK (letra_correta IS NULL OR letra_correta IN ('A','B','C','D','E'));

ALTER TABLE questoes_individuais
  ADD CONSTRAINT questoes_individuais_dificuldade_check
    CHECK (dificuldade IS NULL OR dificuldade IN ('facil','medio','dificil'));

-- ── conteudos: progresso solto sai, teoria_vista + dominado_manual entram ─
ALTER TABLE conteudos
  DROP COLUMN IF EXISTS progresso,
  ADD COLUMN IF NOT EXISTS teoria_vista    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dominado_manual BOOLEAN NOT NULL DEFAULT FALSE;

-- "Dominado" não é gravado: dominado_manual = true OR
-- revisao_espacada.repeticoes >= 5, calculado em lib/conteudos.ts.
