-- Somente leitura. Confere histórico, função, RLS e permissões após I05.
DO $$
DECLARE
  v_tabela TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20260917000100') THEN
    RAISE EXCEPTION 'Histórico I05 ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.reordenar_lista_biblioteca(text,text,text,text[],text[])'::regprocedure
      AND NOT prosecdef
      AND coalesce(proconfig, ARRAY[]::text[]) @> ARRAY['search_path=""']
  ) THEN
    RAISE EXCEPTION 'Função I05 não é invoker com search_path seguro';
  END IF;

  IF has_function_privilege('anon', 'public.reordenar_lista_biblioteca(text,text,text,text[],text[])', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.reordenar_lista_biblioteca(text,text,text,text[],text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'Privilégio EXECUTE da função I05 divergente';
  END IF;

  FOREACH v_tabela IN ARRAY ARRAY['elenco', 'trilha_sonora', 'openings_endings'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = ('public.' || v_tabela)::regclass AND relrowsecurity) THEN
      RAISE EXCEPTION 'RLS ausente em %', v_tabela;
    END IF;
    IF NOT has_table_privilege('authenticated', 'public.' || v_tabela, 'SELECT, INSERT, UPDATE, DELETE') THEN
      RAISE EXCEPTION 'CRUD authenticated ausente em %', v_tabela;
    END IF;
  END LOOP;

  RAISE NOTICE 'postcheck_i05_biblioteca_reordenacao_ok';
END $$;
