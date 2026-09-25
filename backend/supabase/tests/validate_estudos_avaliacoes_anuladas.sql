\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok boolean, mensagem text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', mensagem; END IF; END $$;

INSERT INTO auth.users(id) VALUES
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222') ON CONFLICT DO NOTHING;
INSERT INTO public.materias(uuid, user_id, nome, tipo) VALUES
 ('notas-materia-a','11111111-1111-1111-1111-111111111111','A','academica'),
 ('notas-materia-b','22222222-2222-2222-2222-222222222222','B','academica');
SELECT pg_temp.assert_true(
 has_table_privilege('authenticated','public.lancamentos_nota','SELECT')
 AND has_table_privilege('authenticated','public.lancamentos_nota','INSERT')
 AND has_table_privilege('authenticated','public.lancamentos_nota','UPDATE')
 AND has_table_privilege('authenticated','public.lancamentos_nota','DELETE')
 AND NOT has_table_privilege('anon','public.lancamentos_nota','SELECT')
 AND NOT has_table_privilege('authenticated','public.lancamentos_nota','TRUNCATE'), 'GRANT de notas incorreto');
SELECT pg_temp.assert_true((SELECT relrowsecurity FROM pg_class WHERE oid='public.lancamentos_nota'::regclass), 'RLS ausente');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
SELECT pg_temp.assert_true(public.media_ponderada_materia('notas-materia-a')->'percentual'='null'::jsonb, 'sem notas virou zero');
INSERT INTO public.lancamentos_nota(uuid,user_id,materia_uuid,titulo,nota,nota_maxima,peso) VALUES
 ('nota-a','11111111-1111-1111-1111-111111111111','notas-materia-a','Prova',8,10,2),
 ('nota-b','11111111-1111-1111-1111-111111111111','notas-materia-a','Lista',50,100,1),
 ('nota-pendente','11111111-1111-1111-1111-111111111111','notas-materia-a','Pendente',NULL,10,10),
 ('nota-removida','11111111-1111-1111-1111-111111111111','notas-materia-a','Removida',0,10,100);
UPDATE public.lancamentos_nota SET deleted=true WHERE uuid='nota-removida';
-- (80%*2 + 50%*1)/3 = 70%; pendências e removidas não entram no denominador.
SELECT pg_temp.assert_true((public.media_ponderada_materia('notas-materia-a')->>'percentual')::numeric=70, 'média ponderada incorreta');
SELECT pg_temp.assert_true((public.media_ponderada_materia('notas-materia-a')->>'avaliadas')::integer=2
 AND (public.media_ponderada_materia('notas-materia-a')->>'pendentes')::integer=1
 AND (public.media_ponderada_materia('notas-materia-a')->>'peso_avaliado')::numeric=3, 'denominador incluiu pendências/removidas');
UPDATE public.lancamentos_nota SET nota=0 WHERE uuid='nota-b';
SELECT pg_temp.assert_true(round((public.media_ponderada_materia('notas-materia-a')->>'percentual')::numeric,3)=53.333
 AND (public.media_ponderada_materia('notas-materia-a')->>'avaliadas')::integer=2, 'nota zero tratada como pendência');
UPDATE public.lancamentos_nota SET nota=50 WHERE uuid='nota-b';
DO $$ BEGIN
 BEGIN UPDATE public.lancamentos_nota SET nota=11 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou nota acima da máxima'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET nota=-1 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou nota negativa'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET nota='NaN' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou nota NaN'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET nota_maxima=0 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou máxima zero'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET nota_maxima=7 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou diminuir máxima abaixo da nota'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET nota_maxima='NaN' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou máxima NaN'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET peso=0 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou peso zero'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET peso=-1 WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou peso negativo'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET peso='NaN' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou peso NaN'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET titulo=' ' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou título vazio'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET materia_uuid='notas-materia-b' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou matéria alheia'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN UPDATE public.lancamentos_nota SET user_id='22222222-2222-2222-2222-222222222222' WHERE uuid='nota-a'; RAISE EXCEPTION 'aceitou troca de dono'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.simulados(uuid,user_id,data,total_questoes,total_acertos) VALUES
 ('simulado-anuladas','11111111-1111-1111-1111-111111111111',CURRENT_DATE,10,6);
SELECT pg_temp.assert_true((SELECT total_anuladas=0 FROM public.simulados WHERE uuid='simulado-anuladas'), 'default altera simulado antigo');
UPDATE public.simulados SET total_anuladas=2 WHERE uuid='simulado-anuladas';
SELECT pg_temp.assert_true((SELECT total_questoes-total_anuladas-total_acertos=2 FROM public.simulados WHERE uuid='simulado-anuladas'), 'erros incluem anuladas');
DO $$ BEGIN
 BEGIN UPDATE public.simulados SET total_anuladas=5 WHERE uuid='simulado-anuladas'; RAISE EXCEPTION 'aceitou acertos acima das válidas'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.simulados SET total_anuladas=-1 WHERE uuid='simulado-anuladas'; RAISE EXCEPTION 'aceitou anuladas negativas'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.simulados SET total_questoes=-1 WHERE uuid='simulado-anuladas'; RAISE EXCEPTION 'aceitou total negativo'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.simulados SET total_acertos=-1 WHERE uuid='simulado-anuladas'; RAISE EXCEPTION 'aceitou acertos negativos'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE public.simulados SET total_anuladas=10,total_acertos=0 WHERE uuid='simulado-anuladas';
SELECT pg_temp.assert_true((SELECT 100.0*total_acertos/nullif(total_questoes-total_anuladas,0) IS NULL FROM public.simulados WHERE uuid='simulado-anuladas'), 'todas anuladas viraram desempenho zero');
UPDATE public.materias SET deleted=true WHERE uuid='notas-materia-a';
DO $$ BEGIN
 BEGIN PERFORM public.media_ponderada_materia('notas-materia-a'); RAISE EXCEPTION 'agregou matéria removida'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.materias SET deleted=false WHERE uuid='notas-materia-a';
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 BEGIN PERFORM public.media_ponderada_materia('notas-materia-a'); RAISE EXCEPTION 'agregou sem identidade'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.lancamentos_nota), 'segunda conta leu notas');
UPDATE public.lancamentos_nota SET nota=1 WHERE uuid='nota-a';
DELETE FROM public.lancamentos_nota WHERE uuid='nota-b';
DO $$ BEGIN
 BEGIN PERFORM public.media_ponderada_materia('notas-materia-a'); RAISE EXCEPTION 'agregou notas de outra conta'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.lancamentos_nota(uuid,user_id,materia_uuid,titulo,nota_maxima)
  VALUES ('nota-cruzada','11111111-1111-1111-1111-111111111111','notas-materia-a','X',10);
  RAISE EXCEPTION 'aceitou insert alheio';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT pg_temp.assert_true(has_function_privilege('authenticated','public.media_ponderada_materia(text)','EXECUTE')
 AND NOT has_function_privilege('anon','public.media_ponderada_materia(text)','EXECUTE')
 AND NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.media_ponderada_materia(text)'::regprocedure), 'segurança da média incorreta');
SELECT pg_temp.assert_true((SELECT nota=8 FROM public.lancamentos_nota WHERE uuid='nota-a'), 'outra conta alterou nota');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.lancamentos_nota WHERE uuid='nota-b'), 'outra conta apagou nota');
SET LOCAL ROLE service_role;
SELECT pg_temp.assert_true(jsonb_array_length(public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111')->'registros'->'lancamentos_nota')=4, 'exportação omitiu notas próprias');
SELECT pg_temp.assert_true(jsonb_array_length(public.exportar_dados_usuario('22222222-2222-2222-2222-222222222222')->'registros'->'lancamentos_nota')=0, 'exportação vazou notas');
ROLLBACK;
\echo 'Avaliações/anuladas: limites, média, RLS, FK própria e exportação aprovados.'
