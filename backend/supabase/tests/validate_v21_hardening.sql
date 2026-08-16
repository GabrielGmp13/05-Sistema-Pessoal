\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'v2.1 hardening assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT column_default = '''academica''::text'
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'materias' AND column_name = 'tipo'),
  'materias.tipo deve usar academica como default'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
   FROM pg_constraint
   WHERE conname = 'materias_user_id_fkey'),
  'materias.user_id deve apagar em cascata'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid) LIKE '%olimpiada%'
      AND pg_get_constraintdef(oid) LIKE '%concurso%'
   FROM pg_constraint
   WHERE conname = 'materias_tipo_check'),
  'materias.tipo deve ter o dominio completo documentado'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname IN ('user_own_files_exercicios', 'redacoes_isolamento_usuario')
     AND roles = ARRAY['authenticated']::name[]
     AND cmd = 'ALL'
     AND qual IS NOT NULL
     AND with_check IS NOT NULL),
  'exercicios e redacoes devem ter policies completas para authenticated'
);

ROLLBACK;
