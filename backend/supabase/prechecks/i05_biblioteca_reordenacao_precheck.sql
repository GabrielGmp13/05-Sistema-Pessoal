-- Somente leitura. Confere o alvo antes da migration isolada de I05.
DO $$
DECLARE
  v_tabela TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20260917000100')
     OR to_regprocedure('public.reordenar_lista_biblioteca(text,text,text,text[],text[])') IS NOT NULL THEN
    RAISE EXCEPTION 'I05 já parece aplicada; interromper para reconciliação';
  END IF;

  IF (SELECT count(*) FROM supabase_migrations.schema_migrations
      WHERE version IN ('20260917000200', '20260917000300')) <> 2 THEN
    RAISE EXCEPTION 'Histórico acadêmico esperado não está completo; confirmar o alvo';
  END IF;

  FOREACH v_tabela IN ARRAY ARRAY['filmes', 'series', 'animes', 'elenco', 'trilha_sonora', 'openings_endings'] LOOP
    IF to_regclass('public.' || v_tabela) IS NULL THEN
      RAISE EXCEPTION 'Tabela pública esperada ausente: %', v_tabela;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('elenco', 'uuid'), ('elenco', 'user_id'), ('elenco', 'tipo_obra'), ('elenco', 'obra_uuid'), ('elenco', 'ordem'), ('elenco', 'deleted'),
      ('trilha_sonora', 'uuid'), ('trilha_sonora', 'user_id'), ('trilha_sonora', 'tipo_obra'), ('trilha_sonora', 'obra_uuid'), ('trilha_sonora', 'ordem'), ('trilha_sonora', 'deleted'),
      ('openings_endings', 'uuid'), ('openings_endings', 'user_id'), ('openings_endings', 'anime_uuid'), ('openings_endings', 'ordem'), ('openings_endings', 'deleted')
    ) AS esperadas(tabela, coluna)
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = esperadas.tabela AND c.column_name = esperadas.coluna
    )
  ) THEN
    RAISE EXCEPTION 'Contrato de colunas da Biblioteca diverge; não aplicar I05';
  END IF;

  RAISE NOTICE 'precheck_i05_biblioteca_reordenacao_ok';
END $$;
