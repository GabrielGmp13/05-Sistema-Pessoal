\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Revisao arquivados assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT attnotnull
          AND pg_get_expr(ad.adbin, ad.adrelid) = 'false'
   FROM pg_attribute a
   JOIN pg_attrdef ad
     ON ad.adrelid = a.attrelid
    AND ad.adnum = a.attnum
   WHERE a.attrelid = 'public.revisao_espacada'::regclass
     AND a.attname = 'arquivado'
     AND NOT a.attisdropped),
  'revisao_espacada.arquivado deve ser NOT NULL com default false'
);

SELECT pg_temp.assert_true(
  (SELECT indexdef LIKE '%(user_id, arquivado, proxima_revisao)%'
          AND indexdef LIKE '%WHERE (NOT deleted)%'
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname = 'idx_revisao_arquivados_ativos'),
  'fila ativa deve ter indice parcial por usuario, estado e data'
);

ROLLBACK;

\echo 'Revisao arquivados: todos os testes locais passaram.'
