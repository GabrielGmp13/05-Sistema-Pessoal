-- CAPTURA CRÍTICA MÍNIMA — SOMENTE LEITURA
--
-- Execute os dois blocos separadamente no SQL Editor do Supabase.
-- Cada bloco retorna uma única célula JSON. Copie o JSON completo, sem editar.
--
-- Estas consultas leem apenas catálogos e configuração. Não leem dados das
-- tabelas da aplicação, usuários de auth ou objetos armazenados.

-- BLOCO 1/2 — devolver como critical_storage_metadata.json
-- Captura a configuração literal completa dos cinco buckets, removendo apenas
-- campos de ownership, e a definição literal das policies de storage.objects.
SELECT jsonb_build_object(
  'captured_at', CURRENT_TIMESTAMP,
  'buckets', COALESCE(
    (
      SELECT jsonb_agg(
        to_jsonb(b) - ARRAY['owner', 'owner_id']
        ORDER BY b.id
      )
      FROM storage.buckets AS b
      WHERE b.id IN ('documentos', 'capas', 'shape', 'exercicios', 'redacoes')
    ),
    '[]'::jsonb
  ),
  'bucket_count', (
    SELECT count(*)
    FROM storage.buckets AS b
    WHERE b.id IN ('documentos', 'capas', 'shape', 'exercicios', 'redacoes')
  ),
  'policies', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'schema', p.schemaname,
          'table', p.tablename,
          'name', p.policyname,
          'permissive', p.permissive,
          'roles', p.roles,
          'command', p.cmd,
          'using', p.qual,
          'with_check', p.with_check
        )
        ORDER BY p.policyname
      )
      FROM pg_catalog.pg_policies AS p
      WHERE p.schemaname = 'storage'
        AND p.tablename = 'objects'
    ),
    '[]'::jsonb
  ),
  'policy_count', (
    SELECT count(*)
    FROM pg_catalog.pg_policies AS p
    WHERE p.schemaname = 'storage'
      AND p.tablename = 'objects'
  )
) AS critical_storage_metadata;

-- BLOCO 2/2 — devolver como critical_public_security_metadata.json
-- Captura o que o dump public não demonstra integralmente: ACL e metadados de
-- catálogo da função, event trigger ensure_rls e confirmação compacta de
-- ordinary triggers, sequences, views, tipos e funções adicionais em public.
SELECT jsonb_build_object(
  'captured_at', CURRENT_TIMESTAMP,
  'rls_auto_enable', (
    SELECT jsonb_build_object(
      'identity', p.oid::regprocedure::text,
      'definition', pg_get_functiondef(p.oid),
      'owner', pg_get_userbyid(p.proowner),
      'raw_acl', p.proacl::text,
      'language', l.lanname,
      'security_definer', p.prosecdef,
      'leakproof', p.proleakproof,
      'volatility', CASE p.provolatile
        WHEN 'i' THEN 'immutable'
        WHEN 's' THEN 'stable'
        WHEN 'v' THEN 'volatile'
      END,
      'parallel_safety', CASE p.proparallel
        WHEN 's' THEN 'safe'
        WHEN 'r' THEN 'restricted'
        WHEN 'u' THEN 'unsafe'
      END,
      'runtime_config', p.proconfig,
      'comment', obj_description(p.oid, 'pg_proc')
    )
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang
    WHERE p.oid = 'public.rls_auto_enable()'::regprocedure
  ),
  'ensure_rls', (
    SELECT jsonb_build_object(
      'name', e.evtname,
      'event', e.evtevent,
      'enabled_code', e.evtenabled,
      'enabled_meaning', CASE e.evtenabled
        WHEN 'O' THEN 'origin'
        WHEN 'D' THEN 'disabled'
        WHEN 'R' THEN 'replica'
        WHEN 'A' THEN 'always'
      END,
      'command_tags', e.evttags,
      'function_identity', e.evtfoid::regprocedure::text,
      'owner', pg_get_userbyid(e.evtowner),
      'comment', obj_description(e.oid, 'pg_event_trigger')
    )
    FROM pg_catalog.pg_event_trigger AS e
    WHERE e.evtname = 'ensure_rls'
  ),
  'ordinary_triggers', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table', format('%I.%I', n.nspname, rel.relname),
          'name', trg.tgname,
          'enabled_code', trg.tgenabled,
          'definition', pg_get_triggerdef(trg.oid, true)
        )
        ORDER BY rel.relname, trg.tgname
      )
      FROM pg_catalog.pg_trigger AS trg
      JOIN pg_catalog.pg_class AS rel ON rel.oid = trg.tgrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = rel.relnamespace
      WHERE n.nspname = 'public'
        AND NOT trg.tgisinternal
    ),
    '[]'::jsonb
  ),
  'sequences', COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.sequence_name)
      FROM information_schema.sequences AS s
      WHERE s.sequence_schema = 'public'
    ),
    '[]'::jsonb
  ),
  'views_and_foreign_tables', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', format('%I.%I', n.nspname, c.relname),
          'kind', c.relkind,
          'owner', pg_get_userbyid(c.relowner),
          'view_definition', CASE
            WHEN c.relkind IN ('v', 'm') THEN pg_get_viewdef(c.oid, true)
            ELSE NULL
          END,
          'foreign_options', ft.ftoptions
        )
        ORDER BY c.relname
      )
      FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
      LEFT JOIN pg_catalog.pg_foreign_table AS ft ON ft.ftrelid = c.oid
      WHERE n.nspname = 'public'
        AND c.relkind IN ('v', 'm', 'f')
    ),
    '[]'::jsonb
  ),
  'domains_and_enums', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', format('%I.%I', n.nspname, t.typname),
          'kind', t.typtype,
          'owner', pg_get_userbyid(t.typowner),
          'domain_base_type', CASE
            WHEN t.typtype = 'd' THEN format_type(t.typbasetype, t.typtypmod)
            ELSE NULL
          END,
          'domain_not_null', CASE WHEN t.typtype = 'd' THEN t.typnotnull END,
          'domain_default', CASE
            WHEN t.typtype = 'd' THEN pg_get_expr(t.typdefaultbin, 0)
            ELSE NULL
          END,
          'domain_constraints', COALESCE(
            (
              SELECT jsonb_agg(pg_get_constraintdef(con.oid, true) ORDER BY con.conname)
              FROM pg_catalog.pg_constraint AS con
              WHERE con.contypid = t.oid
            ),
            '[]'::jsonb
          ),
          'enum_labels', COALESCE(
            (
              SELECT jsonb_agg(en.enumlabel ORDER BY en.enumsortorder)
              FROM pg_catalog.pg_enum AS en
              WHERE en.enumtypid = t.oid
            ),
            '[]'::jsonb
          )
        )
        ORDER BY t.typname
      )
      FROM pg_catalog.pg_type AS t
      JOIN pg_catalog.pg_namespace AS n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype IN ('d', 'e')
    ),
    '[]'::jsonb
  ),
  'other_public_functions', COALESCE(
    (
      SELECT jsonb_agg(
        p.oid::regprocedure::text
        ORDER BY p.oid::regprocedure::text
      )
      FROM pg_catalog.pg_proc AS p
      JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.oid <> 'public.rls_auto_enable()'::regprocedure
    ),
    '[]'::jsonb
  )
) AS critical_public_security_metadata;
