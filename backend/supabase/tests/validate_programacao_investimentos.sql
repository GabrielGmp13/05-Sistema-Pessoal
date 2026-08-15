\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Programacao/investimentos assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  to_regclass('public.financas_investimentos') IS NOT NULL,
  'a tabela de investimentos deve existir'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'projetos'
     AND column_name IN ('repositorio_url', 'linguagem_principal', 'destaque')),
  'projetos deve ter os tres metadados de programacao'
);

SELECT pg_temp.assert_true(
  (SELECT is_nullable = 'NO' AND column_default = 'false'
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'projetos'
     AND column_name = 'destaque'),
  'destaque deve ser booleano obrigatorio com default false'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 6
   FROM pg_constraint
   WHERE conname IN (
     'projetos_repositorio_url_check',
     'projetos_linguagem_principal_check',
     'financas_investimentos_ticker_check',
     'financas_investimentos_tipo_check',
     'financas_investimentos_quantidade_check',
     'financas_investimentos_preco_medio_check'
   )),
  'os seis checks do lote devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT relrowsecurity
   FROM pg_class
   WHERE oid = 'public.financas_investimentos'::regclass),
  'investimentos deve ter RLS habilitada'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 1
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'financas_investimentos'
     AND policyname = 'user_own_data'
     AND roles = ARRAY['authenticated']::name[]
     AND cmd = 'ALL'
     AND qual IS NOT NULL
     AND with_check IS NOT NULL),
  'investimentos deve ter policy completa para authenticated'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.projetos', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.financas_investimentos', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve ter CRUD em projetos e investimentos'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_projetos_programacao_ativos', 'idx_financas_investimentos_ativos')),
  'os dois indices do lote devem existir'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname = 'financas_investimentos_tipo_check') LIKE '%renda_fixa%'
  AND (SELECT pg_get_constraintdef(oid)
       FROM pg_constraint
       WHERE conname = 'projetos_repositorio_url_check') LIKE '%https?://%',
  'dominios de tipo e URL devem estar protegidos'
);

ROLLBACK;
