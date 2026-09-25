BEGIN;

-- Alvos exclusivamente da lista permitida; nunca executar identificador do cliente.
CREATE FUNCTION public.reordenar_lista_biblioteca(
  p_lista TEXT, p_tipo_obra TEXT, p_obra_uuid TEXT,
  p_ordem TEXT[], p_esperada TEXT[]
) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_pai TEXT;
  v_tabela TEXT;
  v_filtro TEXT;
  v_uuid TEXT;
  v_atual TEXT[];
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501'; END IF;
  IF p_tipo_obra IS NULL OR p_tipo_obra NOT IN ('filme', 'serie', 'anime')
    OR p_lista IS NULL OR p_lista NOT IN ('elenco', 'trilha_sonora', 'openings_endings')
    OR (p_lista = 'openings_endings' AND p_tipo_obra <> 'anime')
    OR (p_lista = 'trilha_sonora' AND p_tipo_obra = 'anime')
    OR p_ordem IS NULL OR p_esperada IS NULL
    OR array_position(p_ordem, NULL) IS NOT NULL
    OR cardinality(p_ordem) <> (SELECT count(DISTINCT x) FROM unnest(p_ordem) x)
  THEN RAISE EXCEPTION 'Lista inválida' USING ERRCODE = '22023'; END IF;
  v_pai := CASE p_tipo_obra WHEN 'filme' THEN 'filmes' WHEN 'serie' THEN 'series' ELSE 'animes' END;
  v_tabela := CASE p_lista WHEN 'elenco' THEN 'elenco' WHEN 'trilha_sonora' THEN 'trilha_sonora' ELSE 'openings_endings' END;
  EXECUTE format('SELECT uuid FROM public.%I WHERE uuid = $1 AND user_id = $2 AND NOT deleted FOR UPDATE', v_pai)
    INTO v_uuid USING p_obra_uuid, v_user;
  IF v_uuid IS NULL THEN RAISE EXCEPTION 'Obra indisponível' USING ERRCODE = '42501'; END IF;
  v_filtro := CASE WHEN p_lista = 'openings_endings' THEN 'anime_uuid = $1' ELSE 'obra_uuid = $1 AND tipo_obra = $3' END;
  EXECUTE format('SELECT coalesce(array_agg(uuid ORDER BY ordem NULLS LAST, uuid), ARRAY[]::text[]) FROM public.%I WHERE %s AND user_id = $2 AND NOT deleted', v_tabela, v_filtro)
    INTO v_atual USING p_obra_uuid, v_user, p_tipo_obra;
  IF v_atual IS DISTINCT FROM p_esperada OR cardinality(v_atual) <> cardinality(p_ordem)
     OR NOT (v_atual @> p_ordem AND p_ordem @> v_atual)
  THEN RAISE EXCEPTION 'A lista mudou; recarregue antes de mover' USING ERRCODE = '22023'; END IF;
  EXECUTE format('UPDATE public.%I SET ordem = array_position($4, uuid) - 1, updated_at = now() WHERE %s AND user_id = $2 AND NOT deleted AND uuid = ANY($4)', v_tabela, v_filtro)
    USING p_obra_uuid, v_user, p_tipo_obra, p_ordem;
END;
$$;

REVOKE ALL ON FUNCTION public.reordenar_lista_biblioteca(TEXT,TEXT,TEXT,TEXT[],TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reordenar_lista_biblioteca(TEXT,TEXT,TEXT,TEXT[],TEXT[]) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elenco, public.trilha_sonora, public.openings_endings TO authenticated;
COMMIT;
