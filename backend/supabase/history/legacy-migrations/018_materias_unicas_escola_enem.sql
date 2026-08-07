-- ============================================================================
-- 018_materias_unicas_escola_enem.sql
--
-- Reverte o modelo de "matéria duplicada" (uma linha tipo='escola', outra
-- tipo='enem') adotado erroneamente na leva anterior. Matéria volta a ser
-- UMA linha só; o que muda por página é só o que a tela decide mostrar,
-- não o dado em si. Ver DECISIONS.md (correção 2026-08).
--
-- Modelo: mostra_escola / mostra_enem são flags independentes na mesma
-- linha. area_enem só é significativa quando mostra_enem = true.
-- tipo ganha o valor 'academica' pra matérias de Escola/ENEM (curso,
-- olimpiada, concurso, outro continuam como categorias à parte, sem flags).
-- ============================================================================

ALTER TABLE materias
  ADD COLUMN mostra_escola BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE materias
  ADD COLUMN mostra_enem BOOLEAN NOT NULL DEFAULT false;

-- Limpa as matérias duplicadas criadas pelo seed anterior (dado de teste,
-- confirmado descartável pelo usuário — mesmo raciocínio já usado em
-- DEC-020/DEC-023/DEC-035 pra dados sem uso real acumulado).
DELETE FROM materias WHERE tipo IN ('enem', 'escola');

-- Nota: GRANT não precisa ser reemitido — é table-level (DEC-015), colunas
-- novas em tabela já concedida a `authenticated` já estão cobertas.