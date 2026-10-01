\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok boolean, mensagem text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', mensagem; END IF; END $$;

INSERT INTO auth.users(id) VALUES
 ('33333333-3333-3333-3333-333333333333'),
 ('44444444-4444-4444-4444-444444444444') ON CONFLICT DO NOTHING;
INSERT INTO public.materias(uuid,user_id,nome,tipo,mostra_escola,mostra_enem,area_enem) VALUES
 ('v23-matematica','33333333-3333-3333-3333-333333333333','Matemática','academica',true,true,'matematica'),
 ('v23-alheia','44444444-4444-4444-4444-444444444444','Matemática','academica',false,true,'matematica');

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated','public.topicos_estudo','SELECT')
  AND has_table_privilege('authenticated','public.topicos_materias','INSERT')
  AND has_table_privilege('authenticated','public.revisoes_tentativas','SELECT')
  AND NOT has_table_privilege('anon','public.topicos_estudo','SELECT'),
  'GRANTs dos tópicos incorretos');
SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.topicos_estudo'::regclass)
  AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.topicos_materias'::regclass)
  AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.revisoes_tentativas'::regclass),
  'RLS ausente');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',true);
SELECT public.criar_topico_estudo_v23('v23-matematica','Funções',false,true);
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.topicos_estudo WHERE nome='Funções'), 'RPC não criou tópico');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.topicos_materias WHERE mostra_enem AND NOT mostra_escola AND NOT escopo_ambiguo), 'RPC não preservou escopo');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.conteudos WHERE topico_uuid IN (SELECT uuid FROM public.topicos_estudo WHERE nome='Funções')), 'RPC não criou subtópico inicial');

DO $$ BEGIN
 BEGIN PERFORM public.criar_topico_estudo_v23('v23-alheia','Invasão',false,true); RAISE EXCEPTION 'criou tópico em matéria alheia'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'materia_nao_encontrada' THEN RAISE; END IF; END;
END $$;

INSERT INTO public.revisao_espacada(
  uuid,user_id,pergunta,resposta,modulo,referencia_uuid,materia_uuid,conteudo_uuid,
  ef,repeticoes,intervalo_dias,proxima_revisao,arquivado,deleted
) SELECT
  'v23-revisao','33333333-3333-3333-3333-333333333333','Funções','Resposta','estudos',c.uuid,
  'v23-matematica',c.uuid,2.5,0,1,CURRENT_DATE,false,false
FROM public.conteudos c WHERE c.user_id='33333333-3333-3333-3333-333333333333' LIMIT 1;
SELECT public.avaliar_revisao_v23('v23-revisao',3);
SELECT pg_temp.assert_true((SELECT repeticoes=1 FROM public.revisao_espacada WHERE uuid='v23-revisao'), 'qualidade difícil não contou lembrança');
SELECT pg_temp.assert_true((SELECT count(*)=1 AND min(resultado)='dificil' FROM public.revisoes_tentativas WHERE revisao_uuid='v23-revisao'), 'tentativa não foi registrada');
DO $$ DECLARE v_linhas integer; BEGIN
 UPDATE public.revisoes_tentativas SET resultado='facil' WHERE revisao_uuid='v23-revisao';
 GET DIAGNOSTICS v_linhas = ROW_COUNT;
 IF v_linhas <> 0 THEN RAISE EXCEPTION 'histórico foi alterado'; END IF;
 DELETE FROM public.revisoes_tentativas WHERE revisao_uuid='v23-revisao';
 GET DIAGNOSTICS v_linhas = ROW_COUNT;
 IF v_linhas <> 0 THEN RAISE EXCEPTION 'histórico foi apagado'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-4444-444444444444',true);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.topicos_estudo), 'RLS vazou tópicos');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.revisoes_tentativas), 'RLS vazou histórico');
RESET ROLE;

SELECT pg_temp.assert_true(
  has_function_privilege('authenticated','public.avaliar_revisao_v23(text,integer)','EXECUTE')
  AND NOT has_function_privilege('anon','public.avaliar_revisao_v23(text,integer)','EXECUTE')
  AND NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.avaliar_revisao_v23(text,integer)'::regprocedure),
  'segurança da avaliação incorreta');
SELECT pg_temp.assert_true(
  has_table_privilege('authenticated','public.revisoes_tentativas','SELECT')
  AND has_table_privilege('authenticated','public.revisoes_tentativas','INSERT')
  AND has_table_privilege('authenticated','public.revisoes_tentativas','UPDATE')
  AND has_table_privilege('authenticated','public.revisoes_tentativas','DELETE')
  AND (SELECT count(*)=2 FROM pg_policies WHERE schemaname='public'
       AND tablename='revisoes_tentativas' AND permissive='RESTRICTIVE'
       AND cmd IN ('UPDATE','DELETE')),
  'grants e políticas restritivas do histórico estão incorretos');
ROLLBACK;
\echo 'V2.3: tópicos, escopos, subtópicos, RLS e histórico imutável aprovados.'
