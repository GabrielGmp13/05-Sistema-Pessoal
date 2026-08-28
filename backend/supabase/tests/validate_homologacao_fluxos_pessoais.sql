\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'homologacao assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'revisao_espacada' AND column_name = 'materia_uuid')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'revisao_espacada' AND column_name = 'conteudo_uuid'),
  'revisao deve aceitar vinculo academico explicito'
);

SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lugares' AND column_name = 'endereco')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lugares' AND column_name = 'google_place_id'),
  'lugares deve persistir endereco e Place ID sem expor coordenadas na UI'
);

SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.provas_tentativas'::regclass)
  AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.treinos_planejamento_semanal'::regclass),
  'novas tabelas devem manter RLS ativa'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.provas_tentativas', 'SELECT,INSERT,UPDATE,DELETE')
  AND has_table_privilege('authenticated', 'public.treinos_planejamento_semanal', 'SELECT,INSERT,UPDATE,DELETE'),
  'authenticated deve receber somente CRUD necessario'
);

SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.provas_tentativas'::regclass AND contype = 'c')
  AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.treinos_planejamento_semanal'::regclass AND contype = 'c'),
  'tentativa e dia da semana devem ter checks'
);

SELECT pg_temp.assert_true(
  NOT has_table_privilege('anon', 'public.provas_tentativas', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.treinos_planejamento_semanal', 'SELECT'),
  'anon nao deve acessar os novos dados'
);

ROLLBACK;

\echo 'Fluxos de homologacao: teste concluido.'
