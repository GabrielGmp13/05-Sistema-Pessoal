\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Saude/Financas/Lugares assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*) = 10
   FROM pg_class
   WHERE oid IN (
     'public.saude_sono'::regclass,
     'public.saude_hidratacao'::regclass,
     'public.saude_humor'::regclass,
     'public.saude_medicamentos'::regclass,
     'public.saude_medicamentos_registros'::regclass,
     'public.financas_categorias'::regclass,
     'public.financas_lancamentos'::regclass,
     'public.financas_orcamentos'::regclass,
     'public.financas_metas_economia'::regclass,
     'public.lugares'::regclass
   )),
  'as dez tabelas devem existir'
);

SELECT pg_temp.assert_true(
  to_regclass('public.saude_peso') IS NULL AND to_regclass('public.shape') IS NOT NULL,
  'peso deve continuar com fonte unica na tabela shape'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 10
   FROM pg_class
   WHERE oid IN (
     'public.saude_sono'::regclass,
     'public.saude_hidratacao'::regclass,
     'public.saude_humor'::regclass,
     'public.saude_medicamentos'::regclass,
     'public.saude_medicamentos_registros'::regclass,
     'public.financas_categorias'::regclass,
     'public.financas_lancamentos'::regclass,
     'public.financas_orcamentos'::regclass,
     'public.financas_metas_economia'::regclass,
     'public.lugares'::regclass
   ) AND relrowsecurity),
  'RLS deve estar habilitada nas dez tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 10
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN (
       'saude_sono', 'saude_hidratacao', 'saude_humor', 'saude_medicamentos',
       'saude_medicamentos_registros', 'financas_categorias', 'financas_lancamentos',
       'financas_orcamentos', 'financas_metas_economia', 'lugares'
     )
     AND policyname = 'user_own_data'
     AND roles = ARRAY['authenticated']::name[]
     AND cmd = 'ALL'
     AND with_check IS NOT NULL),
  'cada tabela deve ter policy completa para authenticated'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.saude_sono', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.saude_hidratacao', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.saude_humor', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.saude_medicamentos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.saude_medicamentos_registros', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.financas_categorias', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.financas_lancamentos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.financas_orcamentos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.financas_metas_economia', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.lugares', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve ter CRUD nas dez tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 10
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN (
       'idx_saude_sono_data_ativa', 'idx_saude_hidratacao_data_ativa',
       'idx_saude_humor_data_ativa', 'idx_saude_medicamentos_ativos',
       'idx_saude_medicamentos_registros_data_ativa', 'idx_financas_categorias_ativas',
       'idx_financas_lancamentos_ativos', 'idx_financas_orcamentos_periodo_ativo',
       'idx_financas_metas_ativas', 'idx_lugares_ativos'
     ) AND indexdef LIKE '%WHERE (NOT deleted)%'),
  'todas as tabelas devem ter indices parciais de registros ativos'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 13
   FROM pg_constraint
   WHERE conrelid IN (
     'public.saude_sono'::regclass, 'public.saude_hidratacao'::regclass,
     'public.saude_humor'::regclass, 'public.saude_medicamentos'::regclass,
     'public.saude_medicamentos_registros'::regclass, 'public.financas_categorias'::regclass,
     'public.financas_lancamentos'::regclass, 'public.financas_orcamentos'::regclass,
     'public.financas_metas_economia'::regclass, 'public.lugares'::regclass
   ) AND contype = 'f'),
  'FKs de usuario, medicamento e categoria devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 24
   FROM pg_constraint
   WHERE conrelid IN (
     'public.saude_sono'::regclass, 'public.saude_hidratacao'::regclass,
     'public.saude_humor'::regclass, 'public.saude_medicamentos'::regclass,
     'public.saude_medicamentos_registros'::regclass, 'public.financas_categorias'::regclass,
     'public.financas_lancamentos'::regclass, 'public.financas_orcamentos'::regclass,
     'public.financas_metas_economia'::regclass, 'public.lugares'::regclass
   ) AND contype = 'c'),
  'checks de dominio devem existir'
);

ROLLBACK;
