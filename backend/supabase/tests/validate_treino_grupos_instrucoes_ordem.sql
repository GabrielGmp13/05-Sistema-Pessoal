\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF NOT has_function_privilege('authenticated', 'public.reordenar_exercicios_treino(text,text,text[])', 'EXECUTE')
     OR has_function_privilege('anon', 'public.reordenar_exercicios_treino(text,text,text[])', 'EXECUTE')
     OR (SELECT prosecdef FROM pg_proc WHERE oid = 'public.reordenar_exercicios_treino(text,text,text[])'::regprocedure)
  THEN RAISE EXCEPTION 'privilégios incorretos da função'; END IF;
END $$;
INSERT INTO auth.users(id) VALUES ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222') ON CONFLICT DO NOTHING;
INSERT INTO public.treinos(uuid, user_id, nome) VALUES
 ('ordem-treino-a', '11111111-1111-1111-1111-111111111111', 'A'),
 ('ordem-treino-b', '22222222-2222-2222-2222-222222222222', 'B');
INSERT INTO public.exercicios_forca(uuid, user_id, treino_uuid, nome, ordem) VALUES
 ('ordem-ex-a', '11111111-1111-1111-1111-111111111111', 'ordem-treino-a', 'A', 0),
 ('ordem-ex-b', '11111111-1111-1111-1111-111111111111', 'ordem-treino-a', 'B', 0),
 ('ordem-ex-c', '22222222-2222-2222-2222-222222222222', 'ordem-treino-b', 'C', 0);
INSERT INTO public.exercicios_cardio(uuid, user_id, treino_uuid, nome, ordem) VALUES
 ('ordem-cardio-a', '11111111-1111-1111-1111-111111111111', 'ordem-treino-a', 'A', 0),
 ('ordem-cardio-b', '11111111-1111-1111-1111-111111111111', 'ordem-treino-a', 'B', 0);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
SELECT public.reordenar_exercicios_treino('ordem-treino-a', 'forca', ARRAY['ordem-ex-b', 'ordem-ex-a']);
DO $$ BEGIN
  IF (SELECT ordem FROM public.exercicios_forca WHERE uuid = 'ordem-ex-b') <> 0
     OR (SELECT ordem FROM public.exercicios_forca WHERE uuid = 'ordem-ex-a') <> 1
  THEN RAISE EXCEPTION 'ordenação incorreta'; END IF;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'forca', ARRAY['ordem-ex-a', 'ordem-ex-c']);
    RAISE EXCEPTION 'aceitou vínculo cruzado';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-b', 'forca', ARRAY['ordem-ex-c']);
    RAISE EXCEPTION 'aceitou treino alheio';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'forca', ARRAY['ordem-ex-a', 'ordem-ex-a']);
    RAISE EXCEPTION 'aceitou duplicata';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  UPDATE public.exercicios_forca SET grupo_muscular = 'Pernas', instrucoes = 'Exemplo fictício' WHERE uuid = 'ordem-ex-a';
  BEGIN
    UPDATE public.exercicios_forca SET grupo_muscular = ' ' WHERE uuid = 'ordem-ex-a';
    RAISE EXCEPTION 'aceitou grupo vazio';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.reordenar_exercicios_treino('ordem-treino-a', 'cardio', ARRAY['ordem-cardio-b', 'ordem-cardio-a']);
DO $$ BEGIN
  IF (SELECT ordem FROM public.exercicios_cardio WHERE uuid = 'ordem-cardio-b') IS DISTINCT FROM 0
     OR (SELECT ordem FROM public.exercicios_cardio WHERE uuid = 'ordem-cardio-a') IS DISTINCT FROM 1
  THEN RAISE EXCEPTION 'ordenação cardio incorreta'; END IF;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'cardio', ARRAY['ordem-cardio-a']);
    RAISE EXCEPTION 'aceitou lista incompleta';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'cardio', ARRAY['ordem-cardio-a', NULL]);
    RAISE EXCEPTION 'aceitou item nulo';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'outro', ARRAY[]::text[]);
    RAISE EXCEPTION 'aceitou tipo desconhecido';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF (SELECT ordem FROM public.exercicios_cardio WHERE uuid = 'ordem-cardio-b') IS DISTINCT FROM 0
     OR (SELECT ordem FROM public.exercicios_cardio WHERE uuid = 'ordem-cardio-a') IS DISTINCT FROM 1
  THEN RAISE EXCEPTION 'falha alterou a ordem anterior'; END IF;
  BEGIN
    UPDATE public.exercicios_cardio SET instrucoes = repeat('x', 4001) WHERE uuid = 'ordem-cardio-a';
    RAISE EXCEPTION 'aceitou instruções acima do limite';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.exercicios_forca SET grupo_muscular = repeat('x', 81) WHERE uuid = 'ordem-ex-a';
    RAISE EXCEPTION 'aceitou grupo acima do limite';
  EXCEPTION WHEN check_violation THEN NULL; END;
  UPDATE public.exercicios_cardio SET deleted = true WHERE uuid = 'ordem-cardio-a';
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'cardio', ARRAY['ordem-cardio-a', 'ordem-cardio-b']);
    RAISE EXCEPTION 'aceitou exercício excluído';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$ BEGIN
  BEGIN
    PERFORM public.reordenar_exercicios_treino('ordem-treino-a', 'cardio', ARRAY['ordem-cardio-b']);
    RAISE EXCEPTION 'aceitou sessão sem identidade';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
\echo 'Treino: grupo opcional, instruções e reordenação isolada validados.'
