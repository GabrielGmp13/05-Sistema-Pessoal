\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Agenda v2 assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*) = 7
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'agenda'
     AND column_name IN (
       'tipo', 'hora_inicio', 'duracao_minutos', 'descricao',
       'materia_uuid', 'conteudo_uuid', 'concluido'
     )),
  'agenda deve conter as sete colunas da v2'
);

SELECT pg_temp.assert_true(
  (SELECT is_nullable = 'NO'
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'agenda'
     AND column_name = 'titulo'),
  'agenda.titulo deve ser obrigatorio'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 6
   FROM pg_constraint
   WHERE conrelid = 'public.agenda'::regclass
     AND conname IN (
       'agenda_tipo_check',
       'agenda_titulo_check',
       'agenda_duracao_minutos_check',
       'agenda_estudo_materia_check',
       'agenda_treino_vinculo_check',
       'agenda_conteudo_materia_check'
     )),
  'agenda deve conter as seis constraints de consistencia da v2'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM pg_constraint
   WHERE conrelid = 'public.agenda'::regclass
     AND contype = 'f'
     AND conname IN ('agenda_materia_uuid_fkey', 'agenda_conteudo_uuid_fkey')),
  'agenda deve referenciar materias e conteudos'
);

SELECT pg_temp.assert_true(
  (SELECT relrowsecurity
   FROM pg_class
   WHERE oid = 'public.agenda'::regclass),
  'RLS de agenda deve permanecer habilitada'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.agenda', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve manter CRUD em agenda'
);

ROLLBACK;
