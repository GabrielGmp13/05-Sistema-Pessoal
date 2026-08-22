\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Integracoes Google/midias: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(to_regclass('public.integracoes_google') IS NOT NULL, 'tabela server-only ausente');
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integracoes_google' AND column_name IN ('credenciais_cifradas', 'token_expira_em', 'scopes')),
  'colunas de credencial ausentes'
);
SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.integracoes_google'::regclass),
  'RLS da integração deve estar ativa'
);
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'integracoes_google'),
  'cliente não pode receber policy para tokens'
);
SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.integracoes_google', 'SELECT, INSERT, UPDATE, DELETE'),
  'GRANT CRUD explícito deve existir'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM pg_constraint WHERE conrelid = 'public.integracoes_google'::regclass AND contype = 'p'),
  'user_id deve ser PK'
);
SELECT pg_temp.assert_true(
  (SELECT confdeltype = 'c' FROM pg_constraint WHERE conrelid = 'public.integracoes_google'::regclass AND contype = 'f'),
  'FK do usuário deve usar cascade'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agenda' AND column_name IN ('google_calendar_event_id', 'google_calendar_synced_at')),
  'colunas de idempotência da Agenda ausentes'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 4 FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name = 'receitas' AND column_name = 'foto_path') OR (table_name = 'lugares' AND column_name = 'capa_path') OR (table_name = 'provas' AND column_name = 'arquivo_path') OR (table_name = 'simulados' AND column_name = 'arquivo_path'))),
  'paths privados por domínio ausentes'
);
SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'agenda_google_calendar_event_id_unique' AND indexdef LIKE '%WHERE (google_calendar_event_id IS NOT NULL)%'),
  'índice parcial de idempotência ausente'
);
SELECT pg_temp.assert_true(
  (SELECT NOT public FROM storage.buckets WHERE id = 'midias-pessoais'),
  'bucket deve ser privado'
);
SELECT pg_temp.assert_true(
  (SELECT file_size_limit = 15728640 FROM storage.buckets WHERE id = 'midias-pessoais'),
  'bucket deve limitar 15 MB'
);
SELECT pg_temp.assert_true(
  (SELECT allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[] FROM storage.buckets WHERE id = 'midias-pessoais'),
  'MIME types devem permanecer restritos'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 4 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'midias_pessoais_%_own'),
  'quatro policies do bucket são obrigatórias'
);
SELECT pg_temp.assert_true(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'midias_pessoais_%_own'
      AND (roles <> ARRAY['authenticated']::name[] OR COALESCE(qual, with_check) NOT LIKE '%storage.foldername(name)%auth.uid()%')
  ),
  'policies devem isolar primeira pasta por auth.uid()'
);

ROLLBACK;

\echo 'Integracoes Google/midias: todos os testes locais passaram.'
