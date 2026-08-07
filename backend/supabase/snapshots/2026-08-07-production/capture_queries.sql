-- CAPTURA SOMENTE LEITURA — Supabase de produção
--
-- Execute cada bloco separadamente no SQL Editor e exporte apenas o grid de
-- resultado para o arquivo indicado. Estas consultas leem exclusivamente
-- catálogos e configuração; não leem linhas das tabelas da aplicação, usuários
-- de auth nem objetos armazenados.
--
-- Não altere estas consultas para incluir dados de negócio.

-- RESULTADO: capture_context.csv
SELECT
  CURRENT_TIMESTAMP AS captured_at,
  current_database() AS database_name,
  current_user AS executed_by,
  current_setting('server_version') AS server_version,
  current_setting('server_version_num') AS server_version_num;

-- RESULTADO: public_objects.csv
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  c.relkind AS object_kind,
  pg_get_userbyid(c.relowner) AS owner,
  c.relpersistence AS persistence,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
ORDER BY c.relkind, c.relname;

-- RESULTADO: public_columns.csv
SELECT
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_schema,
  c.udt_name,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.datetime_precision,
  c.is_nullable,
  c.column_default,
  c.is_identity,
  c.identity_generation,
  c.is_generated,
  c.generation_expression,
  c.collation_schema,
  c.collation_name
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- RESULTADO: public_constraints.csv
SELECT
  n.nspname AS schema_name,
  rel.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.condeferrable AS deferrable,
  con.condeferred AS initially_deferred,
  con.convalidated AS validated,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
ORDER BY rel.relname, con.conname;

-- RESULTADO: public_indexes.csv
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  tablespace,
  indexdef AS definition
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- RESULTADO: public_triggers.csv
SELECT
  n.nspname AS schema_name,
  rel.relname AS table_name,
  trg.tgname AS trigger_name,
  trg.tgenabled AS enabled_state,
  pg_get_triggerdef(trg.oid, true) AS definition
FROM pg_catalog.pg_trigger AS trg
JOIN pg_catalog.pg_class AS rel ON rel.oid = trg.tgrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND NOT trg.tgisinternal
ORDER BY rel.relname, trg.tgname;

-- RESULTADO: public_policies.csv
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RESULTADO: public_table_grants.csv
SELECT
  grantor,
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable,
  with_hierarchy
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- RESULTADO: public_schema_acl.csv
SELECT
  n.nspname AS schema_name,
  pg_get_userbyid(n.nspowner) AS owner,
  n.nspacl::text AS raw_acl
FROM pg_catalog.pg_namespace AS n
WHERE n.nspname = 'public';

-- RESULTADO: public_relation_acls.csv
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  c.relkind AS relation_kind,
  pg_get_userbyid(c.relowner) AS owner,
  c.relacl::text AS raw_acl
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
ORDER BY c.relkind, c.relname;

-- RESULTADO: public_default_acls.csv
SELECT
  pg_get_userbyid(d.defaclrole) AS owner,
  COALESCE(n.nspname, '*') AS schema_name,
  d.defaclobjtype AS object_type,
  d.defaclacl::text AS raw_acl
FROM pg_catalog.pg_default_acl AS d
LEFT JOIN pg_catalog.pg_namespace AS n ON n.oid = d.defaclnamespace
WHERE n.nspname = 'public' OR d.defaclnamespace = 0
ORDER BY owner, schema_name, object_type;

-- RESULTADO: public_routine_grants.csv
SELECT
  grantor,
  grantee,
  routine_schema,
  routine_name,
  specific_name,
  privilege_type,
  is_grantable
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
ORDER BY routine_name, grantee, privilege_type;

-- RESULTADO: public_functions.csv
SELECT
  p.oid::regprocedure::text AS identity,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS result_type,
  l.lanname AS language,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proleakproof AS leakproof,
  p.provolatile AS volatility,
  p.proparallel AS parallel_safety,
  p.proconfig AS runtime_config,
  p.proacl::text AS raw_acl,
  obj_description(p.oid, 'pg_proc') AS comment
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.proname, identity_arguments;

-- RESULTADO: rls_auto_enable_definition.sql
SELECT pg_get_functiondef('public.rls_auto_enable()'::regprocedure) AS definition;

-- RESULTADO: event_triggers.csv
SELECT
  e.evtname AS event_trigger_name,
  e.evtevent AS event,
  e.evtenabled AS enabled_state,
  e.evttags AS command_tags,
  e.evtfoid::regprocedure::text AS function_identity,
  pg_get_userbyid(e.evtowner) AS owner,
  obj_description(e.oid, 'pg_event_trigger') AS comment
FROM pg_catalog.pg_event_trigger AS e
ORDER BY e.evtname;

-- RESULTADO: extensions.csv
SELECT
  e.extname AS extension_name,
  e.extversion AS extension_version,
  n.nspname AS installed_schema,
  pg_get_userbyid(e.extowner) AS owner,
  e.extrelocatable AS relocatable
FROM pg_catalog.pg_extension AS e
JOIN pg_catalog.pg_namespace AS n ON n.oid = e.extnamespace
ORDER BY e.extname;

-- RESULTADO: public_sequences.csv
SELECT
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment,
  cycle_option
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- RESULTADO: public_types.csv
SELECT
  n.nspname AS schema_name,
  t.typname AS type_name,
  t.typtype AS type_kind,
  t.typcategory AS type_category,
  pg_get_userbyid(t.typowner) AS owner,
  t.typnotnull AS domain_not_null,
  pg_get_expr(t.typdefaultbin, 0) AS domain_default,
  e.enumsortorder AS enum_sort_order,
  e.enumlabel AS enum_label
FROM pg_catalog.pg_type AS t
JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
LEFT JOIN pg_catalog.pg_enum AS e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
  AND t.typtype IN ('d', 'e')
ORDER BY t.typname, e.enumsortorder;

-- RESULTADO: public_comments.csv
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  a.attnum AS column_position,
  a.attname AS column_name,
  d.description
FROM pg_catalog.pg_description AS d
JOIN pg_catalog.pg_class AS c ON c.oid = d.objoid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attribute AS a
  ON a.attrelid = c.oid
 AND a.attnum = d.objsubid
WHERE n.nspname = 'public'
ORDER BY c.relname, a.attnum;

-- RESULTADO: storage_buckets.csv
-- Remove campos de ownership e timestamps para evitar registrar identificadores
-- pessoais; conserva automaticamente outros metadados de configuração que a
-- versão atual do Storage possa possuir.
SELECT
  b.id,
  b.name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  b.created_at,
  b.updated_at,
  to_jsonb(b)
    - ARRAY['owner', 'owner_id'] AS configuration_without_ownership
FROM storage.buckets AS b
ORDER BY b.id;

-- RESULTADO: storage_policies.csv
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- RESULTADO: storage_relation_acl.csv
SELECT
  n.nspname AS schema_name,
  c.relname AS relation_name,
  pg_get_userbyid(c.relowner) AS owner,
  c.relacl::text AS raw_acl
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage'
  AND c.relname IN ('buckets', 'objects')
ORDER BY c.relname;

-- RESULTADO: object_counts.csv
SELECT 'public_tables' AS metric, count(*)::bigint AS value
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
UNION ALL
SELECT 'public_rls_enabled', count(*)::bigint
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
UNION ALL
SELECT 'public_policies', count(*)::bigint
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 'public_functions', count(*)::bigint
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
UNION ALL
SELECT 'storage_buckets', count(*)::bigint
FROM storage.buckets
UNION ALL
SELECT 'storage_object_policies', count(*)::bigint
FROM pg_catalog.pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY metric;
