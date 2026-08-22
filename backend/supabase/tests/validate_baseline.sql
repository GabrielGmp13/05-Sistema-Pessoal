\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'STOP 3 assertion failed: %', message;
  END IF;
END;
$$;

-- Estrutura do schema public.
SELECT pg_temp.assert_true(
  (SELECT count(*) = 63
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'),
  'public deve conter exatamente 63 tabelas'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 63
   FROM pg_constraint c
   JOIN pg_namespace n ON n.oid = c.connamespace
   WHERE n.nspname = 'public' AND c.contype = 'p'),
  'public deve conter exatamente 63 PKs'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 120
   FROM pg_constraint c
   JOIN pg_namespace n ON n.oid = c.connamespace
   WHERE n.nspname = 'public' AND c.contype = 'f'),
  'public deve conter exatamente 120 FKs'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 79
   FROM pg_constraint c
   JOIN pg_namespace n ON n.oid = c.connamespace
   WHERE n.nspname = 'public' AND c.contype = 'c'),
  'public deve conter exatamente 79 checks'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 65
   FROM pg_index i
   JOIN pg_class t ON t.oid = i.indrelid
   JOIN pg_namespace n ON n.oid = t.relnamespace
   LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
   WHERE n.nspname = 'public'
     AND t.relkind = 'r'
     AND con.oid IS NULL),
  'public deve conter exatamente 65 indices explicitos'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 63
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relrowsecurity),
  'as 63 tabelas public devem ter RLS habilitada'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 46
   FROM pg_policies
   WHERE schemaname = 'public'
     AND policyname = 'user_own_data'
     AND cmd = 'ALL'
     AND roles = ARRAY['public']::name[]
     AND qual = '(auth.uid() = user_id)'
     AND with_check IS NULL),
  'as 46 policies historicas user_own_data devem preservar definicao equivalente'
);

-- Defaults e constraints reconciliados pelo hardening v2.1.
SELECT pg_temp.assert_true(
  (SELECT pg_get_expr(d.adbin, d.adrelid) = '''academica''::text'
   FROM pg_attribute a
   JOIN pg_class t ON t.oid = a.attrelid
   JOIN pg_namespace n ON n.oid = t.relnamespace
   JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
   WHERE n.nspname = 'public'
     AND t.relname = 'materias'
     AND a.attname = 'tipo'),
  'materias.tipo deve ter DEFAULT academica'
);

SELECT pg_temp.assert_true(
  (SELECT confdeltype = 'c'
   FROM pg_constraint
   WHERE conname = 'materias_user_id_fkey'
     AND conrelid = 'public.materias'::regclass),
  'materias_user_id_fkey deve usar ON DELETE CASCADE'
);

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'materias_tipo_check'
      AND conrelid = 'public.materias'::regclass
  ),
  'materias_tipo_check deve existir'
);

-- Grants explícitos da baseline.
SELECT pg_temp.assert_true(
  has_schema_privilege('authenticated', 'public', 'USAGE'),
  'authenticated deve ter USAGE no schema public'
);

SELECT pg_temp.assert_true(
  (SELECT bool_and(
     has_table_privilege('authenticated', c.oid, 'SELECT')
     AND has_table_privilege('authenticated', c.oid, 'INSERT')
     AND has_table_privilege('authenticated', c.oid, 'UPDATE')
     AND has_table_privilege('authenticated', c.oid, 'DELETE')
     AND has_table_privilege('authenticated', c.oid, 'TRUNCATE')
     AND has_table_privilege('authenticated', c.oid, 'REFERENCES')
     AND has_table_privilege('authenticated', c.oid, 'TRIGGER')
   )
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname NOT IN ('projetos', 'projetos_tarefas', 'receitas')),
  'authenticated deve preservar GRANT ALL nas tabelas historicas'
);

-- Metadados do guard de RLS.
SELECT pg_temp.assert_true(
  (SELECT r.rolname = 'postgres'
          AND p.prosecdef
          AND p.provolatile = 'v'
          AND NOT p.proleakproof
          AND p.proparallel = 'u'
          AND p.proconfig = ARRAY['search_path=pg_catalog']::text[]
          AND p.proacl IS NULL
          AND l.lanname = 'plpgsql'
   FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   JOIN pg_roles r ON r.oid = p.proowner
   JOIN pg_language l ON l.oid = p.prolang
   WHERE n.nspname = 'public'
     AND p.proname = 'rls_auto_enable'
     AND p.pronargs = 0),
  'rls_auto_enable deve preservar owner, ACL, linguagem e seguranca'
);

SELECT pg_temp.assert_true(
  (SELECT evtevent = 'ddl_command_end'
          AND evtenabled = 'O'
          AND cardinality(evttags) = 3
          AND evttags @> ARRAY['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO']::text[]
          AND evtfoid = 'public.rls_auto_enable()'::regprocedure
   FROM pg_event_trigger
   WHERE evtname = 'ensure_rls'),
  'ensure_rls deve existir, estar ativo e preservar as tres tags'
);

-- Objetos public cuja ausência foi confirmada na captura remota.
SELECT pg_temp.assert_true(
  NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('S', 'v', 'm', 'f')
  ),
  'public nao deve conter sequences, views ou foreign tables'
);

SELECT pg_temp.assert_true(
  NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype IN ('d', 'e')
  ),
  'public nao deve conter domains ou enums'
);

SELECT pg_temp.assert_true(
  NOT EXISTS (
    SELECT 1
    FROM pg_trigger tr
    JOIN pg_class c ON c.oid = tr.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT tr.tgisinternal
  ),
  'public nao deve conter ordinary triggers'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 1
   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'),
  'rls_auto_enable deve ser a unica funcao public'
);

-- Comportamento do event trigger: criação descartável em public habilita RLS.
CREATE TABLE public.__stop3_guard_test (id bigint PRIMARY KEY);
SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.__stop3_guard_test'::regclass),
  'ensure_rls deve habilitar RLS automaticamente'
);
DROP TABLE public.__stop3_guard_test;

-- Isolamento RLS comportamental sem dados reais.
CREATE TABLE public.__stop3_rls_test (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL,
  payload text NOT NULL
);
CREATE POLICY user_own_data ON public.__stop3_rls_test
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.__stop3_rls_test TO authenticated;
GRANT SELECT ON public.__stop3_rls_test TO anon;

INSERT INTO public.__stop3_rls_test (id, user_id, payload) VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'usuario-a'),
  (2, '22222222-2222-2222-2222-222222222222', 'usuario-b');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 AND min(payload) = 'usuario-a'
   FROM public.__stop3_rls_test),
  'usuario A nao deve acessar a linha do usuario B'
);
RESET ROLE;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0 FROM public.__stop3_rls_test),
  'anonimo nao deve acessar linhas privadas'
);
RESET ROLE;

-- Inventário literal dos buckets, desconsiderando timestamps locais.
SELECT pg_temp.assert_true(
  NOT EXISTS (
    (SELECT id, name, type::text, public, file_size_limit::bigint,
            allowed_mime_types, avif_autodetection
     FROM storage.buckets)
    EXCEPT
    (VALUES
      ('capas', 'capas', 'STANDARD', false, 3145728::bigint, ARRAY['image/jpeg','image/png','image/webp']::text[], false),
      ('documentos', 'documentos', 'STANDARD', false, 52428800::bigint,
       ARRAY['application/pdf','application/epub+zip','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','application/json']::text[], false),
      ('exercicios', 'exercicios', 'STANDARD', false, 5242880::bigint,
       ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[], false),
      ('redacoes', 'redacoes', 'STANDARD', false, 10485760::bigint, NULL::text[], false),
      ('shape', 'shape', 'STANDARD', false, 10485760::bigint,
       ARRAY['image/jpeg','image/png','image/webp']::text[], false)
    )
  )
  AND (SELECT count(*) = 5 FROM storage.buckets),
  'os cinco buckets devem preservar a configuracao remota, exceto timestamps'
);

-- Definições literais das 14 policies de storage.objects.
SELECT pg_temp.assert_true(
  (SELECT count(*) = 14
   FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'),
  'storage.objects deve conter exatamente 14 policies'
);

-- A comparação exata usa a representação normalizada exposta por pg_policies.
WITH expected(name, command, roles, using_expr, check_expr) AS (
  VALUES
    ('capas_delete','DELETE',ARRAY['authenticated']::name[], '((bucket_id = ''capas''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('capas_insert','INSERT',ARRAY['authenticated']::name[], NULL,'((bucket_id = ''capas''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))'),
    ('capas_select','SELECT',ARRAY['authenticated']::name[], '((bucket_id = ''capas''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('capas_update','UPDATE',ARRAY['authenticated']::name[], '((bucket_id = ''capas''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('docs_delete','DELETE',ARRAY['authenticated']::name[], '((bucket_id = ''documentos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('docs_insert','INSERT',ARRAY['authenticated']::name[], NULL,'((bucket_id = ''documentos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))'),
    ('docs_select','SELECT',ARRAY['authenticated']::name[], '((bucket_id = ''documentos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('docs_update','UPDATE',ARRAY['authenticated']::name[], '((bucket_id = ''documentos''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('redacoes_isolamento_usuario','ALL',ARRAY['authenticated']::name[], '((bucket_id = ''redacoes''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))','((bucket_id = ''redacoes''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))'),
    ('shape_delete','DELETE',ARRAY['authenticated']::name[], '((bucket_id = ''shape''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('shape_insert','INSERT',ARRAY['authenticated']::name[], NULL,'((bucket_id = ''shape''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))'),
    ('shape_select','SELECT',ARRAY['authenticated']::name[], '((bucket_id = ''shape''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('shape_update','UPDATE',ARRAY['authenticated']::name[], '((bucket_id = ''shape''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))',NULL),
    ('user_own_files_exercicios','ALL',ARRAY['authenticated']::name[], '((bucket_id = ''exercicios''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))','((bucket_id = ''exercicios''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))')
), actual AS (
  SELECT policyname, cmd, roles, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
)
SELECT pg_temp.assert_true(
  NOT EXISTS ((SELECT * FROM actual) EXCEPT (SELECT * FROM expected))
  AND NOT EXISTS ((SELECT * FROM expected) EXCEPT (SELECT * FROM actual)),
  'as 14 policies de storage.objects devem ser literalmente equivalentes'
);

-- Isolamento real de primeira pasta para redacoes e exercicios.
INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES
  ('redacoes', '22222222-2222-2222-2222-222222222222/stop3-b.txt', '22222222-2222-2222-2222-222222222222'),
  ('exercicios', '22222222-2222-2222-2222-222222222222/stop3-b.txt', '22222222-2222-2222-2222-222222222222');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES
  ('redacoes', '11111111-1111-1111-1111-111111111111/stop3-a.txt', '11111111-1111-1111-1111-111111111111'),
  ('exercicios', '11111111-1111-1111-1111-111111111111/stop3-a.txt', '11111111-1111-1111-1111-111111111111');

SELECT pg_temp.assert_true(
  (SELECT count(*) = 2
   FROM storage.objects
   WHERE bucket_id IN ('redacoes', 'exercicios')
     AND name LIKE '%/stop3-_.txt'),
  'usuario A deve enxergar apenas seus dois objetos de teste'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner_id)
    VALUES ('redacoes', '22222222-2222-2222-2222-222222222222/stop3-forbidden.txt',
            '11111111-1111-1111-1111-111111111111');
    RAISE EXCEPTION 'STOP 3 assertion failed: redacoes aceitou primeira pasta de outro usuario';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner_id)
    VALUES ('exercicios', '22222222-2222-2222-2222-222222222222/stop3-forbidden.txt',
            '11111111-1111-1111-1111-111111111111');
    RAISE EXCEPTION 'STOP 3 assertion failed: exercicios aceitou primeira pasta de outro usuario';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 0
   FROM storage.objects
   WHERE bucket_id IN ('redacoes', 'exercicios')
     AND name LIKE '%/stop3-_.txt'),
  'anonimo nao deve enxergar objetos privados de redacoes ou exercicios'
);
RESET ROLE;

ROLLBACK;

\echo 'STOP 3: todos os testes locais passaram.'
