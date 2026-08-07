-- 20260807000200_baseline_rls_guard.sql
-- Reproduz o guard RLS customizado confirmado no remoto.
--
-- Fonte factual:
--   snapshots/2026-08-07-production/critical_public_security_metadata.json
--   SHA-256 4c7a8209653ee8364de284540b1b33989d121bad879a7e0a305b7f5ff4201451
--
-- A ACL remota da função é NULL. Por isso esta migration não adiciona GRANT
-- ou REVOKE explícito sobre a função.

BEGIN;

CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    VOLATILE
    PARALLEL UNSAFE
    SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

ALTER EVENT TRIGGER "ensure_rls" ENABLE;
ALTER EVENT TRIGGER "ensure_rls" OWNER TO "postgres";

COMMIT;
