\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'redacoes tempo assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT data_type = 'integer' AND is_nullable = 'YES'
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'redacoes'
     AND column_name = 'tempo_execucao_minutos'),
  'redacoes.tempo_execucao_minutos deve ser inteiro opcional'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid) LIKE '%tempo_execucao_minutos >= 0%'
   FROM pg_constraint
   WHERE conrelid = 'public.redacoes'::regclass
     AND conname = 'redacoes_tempo_execucao_minutos_check'),
  'o tempo de execucao deve rejeitar valores negativos'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.redacoes', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve manter CRUD em redacoes'
);

ROLLBACK;
