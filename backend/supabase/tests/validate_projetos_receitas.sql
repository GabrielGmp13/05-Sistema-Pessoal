\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Projetos/Receitas assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  to_regclass('public.projetos') IS NOT NULL
  AND to_regclass('public.projetos_tarefas') IS NOT NULL
  AND to_regclass('public.receitas') IS NOT NULL,
  'as três tabelas devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_class
   WHERE oid IN ('public.projetos'::regclass, 'public.projetos_tarefas'::regclass, 'public.receitas'::regclass)
     AND relrowsecurity),
  'RLS deve estar habilitada nas três tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('projetos', 'projetos_tarefas', 'receitas')
     AND policyname = 'user_own_data'
     AND roles = ARRAY['authenticated']::name[]
     AND cmd = 'ALL'
     AND with_check IS NOT NULL),
  'cada tabela deve ter policy completa para authenticated'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.projetos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.projetos_tarefas', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.receitas', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve ter CRUD nas três tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_projetos_ativos', 'idx_projetos_tarefas_ativas', 'idx_receitas_ativas')
     AND indexdef LIKE '%WHERE (NOT deleted)%'),
  'as três tabelas devem ter índices parciais de registros ativos'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 4
   FROM pg_constraint
   WHERE conrelid IN ('public.projetos'::regclass, 'public.projetos_tarefas'::regclass, 'public.receitas'::regclass)
     AND contype = 'f'),
  'FKs de usuário e projeto devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 11
   FROM pg_constraint
   WHERE conrelid IN ('public.projetos'::regclass, 'public.projetos_tarefas'::regclass, 'public.receitas'::regclass)
     AND contype = 'c'),
  'checks de domínio devem existir'
);

ROLLBACK;
