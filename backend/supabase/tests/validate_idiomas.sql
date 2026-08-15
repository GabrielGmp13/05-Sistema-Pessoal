\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Idiomas assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_class
   WHERE oid IN (
     'public.idiomas'::regclass,
     'public.idiomas_vocabulario'::regclass,
     'public.idiomas_praticas'::regclass
   )),
  'as tres tabelas devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_class
   WHERE oid IN (
     'public.idiomas'::regclass,
     'public.idiomas_vocabulario'::regclass,
     'public.idiomas_praticas'::regclass
   ) AND relrowsecurity),
  'RLS deve estar habilitada nas tres tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('idiomas', 'idiomas_vocabulario', 'idiomas_praticas')
     AND policyname = 'user_own_data'
     AND roles = ARRAY['authenticated']::name[]
     AND cmd = 'ALL'
     AND qual IS NOT NULL
     AND with_check IS NOT NULL),
  'cada tabela deve ter policy completa para authenticated'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.idiomas', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.idiomas_vocabulario', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.idiomas_praticas', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve ter CRUD nas tres tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 5
   FROM pg_constraint
   WHERE conrelid IN (
     'public.idiomas'::regclass,
     'public.idiomas_vocabulario'::regclass,
     'public.idiomas_praticas'::regclass
   )
     AND contype = 'f'
     AND confdeltype = 'c'),
  'as cinco FKs devem usar ON DELETE CASCADE'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 6
   FROM pg_constraint
   WHERE conrelid IN (
     'public.idiomas'::regclass,
     'public.idiomas_vocabulario'::regclass,
     'public.idiomas_praticas'::regclass
   ) AND contype = 'c'),
  'checks de nome, cor, vocabulario, tipo e duracao devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 4
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN (
       'idx_idiomas_nome_ativo',
       'idx_idiomas_vocabulario_ativo',
       'idx_idiomas_praticas_data_ativa',
       'idx_idiomas_praticas_idioma_ativa'
     )
     AND indexdef LIKE '%WHERE (NOT deleted)%'),
  'os quatro indices devem ignorar soft deletes'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname = 'idiomas_praticas_tipo_check') LIKE '%conversacao%'
  AND (SELECT pg_get_constraintdef(oid)
       FROM pg_constraint
       WHERE conname = 'idiomas_praticas_duracao_check') LIKE '%duracao_minutos > 0%',
  'tipo e duracao da pratica devem ter dominio protegido'
);

ROLLBACK;
