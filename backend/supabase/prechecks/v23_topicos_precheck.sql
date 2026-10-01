-- Somente leitura. Não exibe nomes, UUIDs, respostas ou outros dados pessoais.
-- Confere o pré-estado e resume quantos vínculos terão escopo inferido.
DO $$
DECLARE
  v_conteudos_academicos bigint;
  v_vinculos_escola bigint;
  v_vinculos_enem bigint;
  v_vinculos_ambiguos bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '20260917000300'
  ) THEN
    RAISE EXCEPTION 'Migration acadêmica esperada ausente; interromper e reconciliar';
  END IF;
  IF EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = '20260930000100'
  ) OR to_regclass('public.topicos_estudo') IS NOT NULL THEN
    RAISE EXCEPTION 'V2.3 já aplicada ou parcialmente presente; não repetir';
  END IF;

  SELECT count(DISTINCT c.uuid),
         count(*) FILTER (WHERE m.mostra_escola),
         count(*) FILTER (WHERE m.mostra_enem),
         count(*) FILTER (WHERE m.mostra_escola AND m.mostra_enem)
  INTO v_conteudos_academicos, v_vinculos_escola, v_vinculos_enem, v_vinculos_ambiguos
  FROM public.conteudos c
  JOIN public.conteudos_materias cm ON cm.conteudo_uuid=c.uuid AND cm.user_id=c.user_id AND NOT cm.deleted
  JOIN public.materias m ON m.uuid=cm.materia_uuid AND m.user_id=cm.user_id AND NOT m.deleted
  WHERE NOT c.deleted AND m.tipo='academica' AND (m.mostra_escola OR m.mostra_enem);

  RAISE NOTICE 'v23_precheck_ok conteudos=% vinculos_escola=% vinculos_enem=% ambiguos=%',
    v_conteudos_academicos, v_vinculos_escola, v_vinculos_enem, v_vinculos_ambiguos;
END $$;
