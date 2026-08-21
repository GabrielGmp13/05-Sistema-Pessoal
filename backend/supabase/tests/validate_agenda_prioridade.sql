\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Agenda prioridade assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT is_nullable = 'NO' AND column_default = '''normal''::text'
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'agenda'
     AND column_name = 'prioridade'),
  'agenda.prioridade deve ser obrigatoria e usar normal como default'
);

SELECT pg_temp.assert_true(
  (SELECT pg_get_constraintdef(oid) =
     'CHECK ((prioridade = ANY (ARRAY[''baixa''::text, ''normal''::text, ''alta''::text])))'
   FROM pg_constraint
   WHERE conrelid = 'public.agenda'::regclass
     AND conname = 'agenda_prioridade_check'),
  'agenda.prioridade deve aceitar somente baixa, normal e alta'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.agenda', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve manter CRUD em agenda'
);

SELECT pg_temp.assert_true(
  (SELECT relrowsecurity
   FROM pg_class
   WHERE oid = 'public.agenda'::regclass),
  'RLS de agenda deve permanecer habilitada'
);

INSERT INTO auth.users (id)
VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agenda (uuid, user_id, data, titulo)
VALUES (
  'agenda-prioridade-default',
  '11111111-1111-1111-1111-111111111111',
  DATE '2026-08-21',
  'Prioridade padrão'
);

SELECT pg_temp.assert_true(
  (SELECT prioridade = 'normal'
   FROM public.agenda
   WHERE uuid = 'agenda-prioridade-default'),
  'evento sem prioridade explicita deve receber normal'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.agenda (uuid, user_id, data, titulo, prioridade)
    VALUES (
      'agenda-prioridade-invalida',
      '11111111-1111-1111-1111-111111111111',
      DATE '2026-08-21',
      'Prioridade inválida',
      'urgente'
    );
    RAISE EXCEPTION 'prioridade fora da escala foi aceita';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END;
$$;

ROLLBACK;

\echo 'Agenda prioridade: todos os testes locais passaram.'
