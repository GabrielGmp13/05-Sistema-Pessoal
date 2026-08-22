\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Biblioteca playlists: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  to_regclass('public.videos_playlists') IS NOT NULL
  AND to_regclass('public.videos_playlist_itens') IS NOT NULL,
  'tabelas ausentes'
);

SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.videos_playlists'::regclass)
  AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.videos_playlist_itens'::regclass),
  'RLS deve estar ativa nas duas tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('videos_playlists', 'videos_playlist_itens')
     AND policyname = 'user_own_data'
     AND cmd = 'ALL'
     AND roles = ARRAY['authenticated']::name[]
     AND qual = '(auth.uid() = user_id)'
     AND with_check = '(auth.uid() = user_id)'),
  'policies devem isolar leitura e escrita por user_id'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.videos_playlists', 'SELECT,INSERT,UPDATE,DELETE')
  AND has_table_privilege('authenticated', 'public.videos_playlist_itens', 'SELECT,INSERT,UPDATE,DELETE')
  AND has_table_privilege('service_role', 'public.videos_playlists', 'SELECT,INSERT,UPDATE,DELETE')
  AND has_table_privilege('service_role', 'public.videos_playlist_itens', 'SELECT,INSERT,UPDATE,DELETE'),
  'authenticated e service_role devem possuir CRUD explícito'
);

SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.videos_playlists'::regclass AND conname = 'videos_playlists_user_youtube_unique')
  AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.videos_playlist_itens'::regclass AND conname = 'videos_playlist_itens_playlist_video_unique'),
  'unicidades de deduplicação ausentes'
);

SELECT pg_temp.assert_true(
  (SELECT confdeltype = 'c' AND cardinality(conkey) = 2
   FROM pg_constraint
   WHERE conrelid = 'public.videos_playlist_itens'::regclass
     AND conname = 'videos_playlist_itens_playlist_owner_fkey')
  AND (SELECT confdeltype = 'c' AND cardinality(conkey) = 2
       FROM pg_constraint
       WHERE conrelid = 'public.videos_playlist_itens'::regclass
         AND conname = 'videos_playlist_itens_video_owner_fkey'),
  'vínculos devem confirmar user_id e usar ON DELETE CASCADE'
);

SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.videos_playlists'::regclass AND conname = 'videos_playlists_user_uuid_unique')
  AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.videos'::regclass AND conname = 'videos_user_uuid_unique'),
  'chaves compostas de posse necessárias às FKs estão ausentes'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_videos_playlists_user_updated', 'idx_videos_playlist_itens_playlist_ordem')),
  'índices operacionais ausentes'
);

ROLLBACK;

\echo 'Biblioteca playlists: todos os testes locais passaram.'
