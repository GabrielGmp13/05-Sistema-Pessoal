\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'redacoes nota assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT data_type = 'numeric' AND numeric_precision = 5 AND numeric_scale = 1
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'redacoes' AND column_name = 'nota'),
  'redacoes.nota deve aceitar a pontuacao maxima 1000.0'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid) LIKE '%1000%'
   FROM pg_constraint
   WHERE conrelid = 'public.redacoes'::regclass AND conname = 'redacoes_nota_range'),
  'redacoes.nota deve ficar limitada a 0-1000'
);

SELECT pg_temp.assert_true(
  1000.0::numeric(5,1) = 1000.0,
  'a nota maxima do ENEM deve caber no tipo'
);

ROLLBACK;
