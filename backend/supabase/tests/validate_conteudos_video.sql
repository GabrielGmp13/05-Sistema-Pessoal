\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Conteudos video assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT NOT attnotnull
   FROM pg_attribute
   WHERE attrelid = 'public.conteudos'::regclass
     AND attname = 'video_uuid'
     AND NOT attisdropped),
  'conteudos.video_uuid deve existir e aceitar NULL'
);

SELECT pg_temp.assert_true(
  (SELECT confrelid = 'public.videos'::regclass
          AND confdeltype = 'a'
   FROM pg_constraint
   WHERE conrelid = 'public.conteudos'::regclass
     AND conname = 'conteudos_video_uuid_fkey'
     AND contype = 'f'),
  'conteudos.video_uuid deve referenciar videos.uuid sem delete em cascata'
);

SELECT pg_temp.assert_true(
  (SELECT indexdef LIKE '%(video_uuid)%'
          AND indexdef LIKE '%WHERE ((NOT deleted) AND (video_uuid IS NOT NULL))%'
   FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname = 'idx_conteudos_video_ativos'),
  'conteudos deve ter indice parcial para videos ativos'
);

ROLLBACK;

\echo 'Conteudos video: todos os testes locais passaram.'
