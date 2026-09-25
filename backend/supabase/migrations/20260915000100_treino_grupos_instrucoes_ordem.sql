BEGIN;

ALTER TABLE public.exercicios_forca
  ADD COLUMN grupo_muscular TEXT,
  ADD COLUMN instrucoes TEXT,
  ADD CONSTRAINT exercicios_forca_grupo_muscular_valido CHECK
    (grupo_muscular IS NULL OR (length(btrim(grupo_muscular)) BETWEEN 1 AND 80)),
  ADD CONSTRAINT exercicios_forca_instrucoes_limite CHECK
    (instrucoes IS NULL OR length(instrucoes) <= 4000);

ALTER TABLE public.exercicios_cardio
  ADD COLUMN instrucoes TEXT,
  ADD CONSTRAINT exercicios_cardio_instrucoes_limite CHECK
    (instrucoes IS NULL OR length(instrucoes) <= 4000);

COMMENT ON COLUMN public.exercicios_forca.grupo_muscular IS
  'Grupo principal informado pelo titular, opcional. Não inferir por nome nem preencher retrospectivamente.';

-- Uma única transação reordena toda a lista, inclusive ordens legadas repetidas.
-- Invoker mantém RLS e não recebe user_id controlado pelo cliente.
CREATE FUNCTION public.reordenar_exercicios_treino(
  p_treino_uuid TEXT, p_tipo TEXT, p_ordem TEXT[]
) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_usuario UUID := auth.uid();
  v_quantidade INTEGER;
BEGIN
  IF v_usuario IS NULL THEN RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501'; END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN ('forca', 'cardio') OR p_ordem IS NULL
     OR array_position(p_ordem, NULL) IS NOT NULL
     OR cardinality(p_ordem) <> (SELECT count(DISTINCT x) FROM unnest(p_ordem) AS x)
  THEN RAISE EXCEPTION 'Ordem inválida' USING ERRCODE = '22023'; END IF;

  PERFORM 1 FROM public.treinos
  WHERE uuid = p_treino_uuid AND user_id = v_usuario AND NOT deleted FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Treino indisponível' USING ERRCODE = '42501'; END IF;

  IF p_tipo = 'forca' THEN
    SELECT count(*) INTO v_quantidade FROM public.exercicios_forca
      WHERE treino_uuid = p_treino_uuid AND user_id = v_usuario AND NOT deleted;
    IF v_quantidade <> cardinality(p_ordem) OR EXISTS (
      SELECT 1 FROM unnest(p_ordem) AS item(uuid)
      WHERE NOT EXISTS (SELECT 1 FROM public.exercicios_forca e
        WHERE e.uuid = item.uuid AND e.treino_uuid = p_treino_uuid AND e.user_id = v_usuario AND NOT e.deleted)
    ) THEN RAISE EXCEPTION 'Recarregue a lista antes de reordenar' USING ERRCODE = '22023'; END IF;
    UPDATE public.exercicios_forca SET ordem = array_position(p_ordem, uuid) - 1, updated_at = now()
      WHERE treino_uuid = p_treino_uuid AND user_id = v_usuario AND NOT deleted;
  ELSE
    SELECT count(*) INTO v_quantidade FROM public.exercicios_cardio
      WHERE treino_uuid = p_treino_uuid AND user_id = v_usuario AND NOT deleted;
    IF v_quantidade <> cardinality(p_ordem) OR EXISTS (
      SELECT 1 FROM unnest(p_ordem) AS item(uuid)
      WHERE NOT EXISTS (SELECT 1 FROM public.exercicios_cardio e
        WHERE e.uuid = item.uuid AND e.treino_uuid = p_treino_uuid AND e.user_id = v_usuario AND NOT e.deleted)
    ) THEN RAISE EXCEPTION 'Recarregue a lista antes de reordenar' USING ERRCODE = '22023'; END IF;
    UPDATE public.exercicios_cardio SET ordem = array_position(p_ordem, uuid) - 1, updated_at = now()
      WHERE treino_uuid = p_treino_uuid AND user_id = v_usuario AND NOT deleted;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reordenar_exercicios_treino(TEXT, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reordenar_exercicios_treino(TEXT, TEXT, TEXT[]) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercicios_forca, public.exercicios_cardio TO authenticated;

COMMIT;
