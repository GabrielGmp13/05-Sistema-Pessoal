-- ============================================================================
-- 017_estudos_gabarito_enem_redacao.sql
--
-- 1) materias.area_enem — hierarquia ENEM: Área (fixa) → Matéria → Conteúdo.
-- 2) questoes_individuais: fluxo de gabarito em 2 fases —
--      Fase "lançar" (durante a prova): só letra_marcada (A-E ou NULL se
--      ficou em branco quando o tempo acabou). acertou fica NULL.
--      Fase "corrigir" (depois, com calma): usuário informa letra_correta.
--      acertou é derivado: letra_marcada IS NULL → permanece NULL (perdida,
--      nem certo nem errado); senão, letra_marcada = letra_correta.
--      `letra_correta IS NULL` é o sinal de "ainda não corrigida" — não
--      precisa de coluna de status separada.
-- 3) redacoes: texto vira opcional, ganha imagem_path (foto da folha
--    manuscrita) e uso explícito de `comentario` como correção do professor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) materias.area_enem
-- ----------------------------------------------------------------------------
ALTER TABLE materias
  ADD COLUMN area_enem TEXT;

ALTER TABLE materias
  ADD CONSTRAINT materias_area_enem_check
  CHECK (area_enem IS NULL OR area_enem IN ('linguagens', 'humanas', 'natureza', 'matematica'));

-- ----------------------------------------------------------------------------
-- 2) questoes_individuais — gabarito em 2 fases
-- ----------------------------------------------------------------------------
ALTER TABLE questoes_individuais
  ALTER COLUMN acertou DROP NOT NULL;

ALTER TABLE questoes_individuais
  ADD COLUMN letra_marcada TEXT;

ALTER TABLE questoes_individuais
  ADD CONSTRAINT questoes_individuais_letra_marcada_check
  CHECK (letra_marcada IS NULL OR letra_marcada IN ('A', 'B', 'C', 'D', 'E'));

ALTER TABLE questoes_individuais
  ADD COLUMN letra_correta TEXT;

ALTER TABLE questoes_individuais
  ADD CONSTRAINT questoes_individuais_letra_correta_check
  CHECK (letra_correta IS NULL OR letra_correta IN ('A', 'B', 'C', 'D', 'E'));

-- ----------------------------------------------------------------------------
-- 3) redacoes — texto opcional + imagem
-- ----------------------------------------------------------------------------
ALTER TABLE redacoes
  ALTER COLUMN texto DROP NOT NULL;

ALTER TABLE redacoes
  ADD COLUMN imagem_path TEXT;

-- ----------------------------------------------------------------------------
-- GRANT (DEC-015)
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON materias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON questoes_individuais TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON redacoes TO authenticated;

-- ============================================================================
-- NOTA — Storage (ação manual, fora deste SQL):
--
-- 1. Supabase Dashboard → Storage → New bucket → nome: 'redacoes'
--    - Privado (NÃO marcar "Public bucket")
--    - Tipos aceitos: JPEG, PNG, WebP · Limite sugerido: 10MB
--
-- 2. Rodar no SQL Editor:
--
--    CREATE POLICY "redacoes_isolamento_usuario"
--    ON storage.objects FOR ALL
--    USING (
--      bucket_id = 'redacoes'
--      AND (storage.foldername(name))[1] = auth.uid()::text
--    )
--    WITH CHECK (
--      bucket_id = 'redacoes'
--      AND (storage.foldername(name))[1] = auth.uid()::text
--    );
-- ============================================================================