\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Biblioteca links assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  to_regclass('public.videos') IS NOT NULL,
  'tabela videos deve existir'
);

SELECT pg_temp.assert_true(
  to_regclass('public.artigos') IS NOT NULL,
  'tabela artigos deve existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 7
   FROM pg_constraint
   WHERE conrelid IN ('public.videos'::regclass, 'public.artigos'::regclass)
     AND contype = 'c'),
  'videos e artigos devem conter sete checks de consistencia'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_constraint
   WHERE conrelid IN ('public.videos'::regclass, 'public.artigos'::regclass)
     AND contype = 'f'),
  'videos e artigos devem referenciar auth.users'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_class
   WHERE oid IN ('public.videos'::regclass, 'public.artigos'::regclass)
     AND relrowsecurity),
  'RLS deve estar habilitada nas duas tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('videos', 'artigos')
     AND policyname = 'user_own_data'),
  'as duas tabelas devem ter policy user_own_data'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.videos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.artigos', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve ter CRUD nas duas tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_videos_ativos', 'idx_artigos_ativos')
     AND indexdef LIKE '%WHERE (NOT deleted)%'),
  'as duas tabelas devem ter indices parciais de registros ativos'
);

ROLLBACK;
