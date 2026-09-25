\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.ok(cond boolean, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF cond IS DISTINCT FROM true THEN RAISE EXCEPTION '%', msg; END IF; END $$;
INSERT INTO auth.users(id) VALUES
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222') ON CONFLICT DO NOTHING;
INSERT INTO public.provas(uuid,user_id,tipo,data,tempo_minutos,enem_ano,enem_aplicacao)
VALUES ('enem-modelo-a','11111111-1111-1111-1111-111111111111','enem_dia1',CURRENT_DATE,330,2025,'regular'),
       ('enem-modelo-b','22222222-2222-2222-2222-222222222222','enem_dia2',CURRENT_DATE,300,2025,'regular');
INSERT INTO public.redacoes(uuid,user_id,tema,data,texto)
VALUES ('redacao-modelo-a','11111111-1111-1111-1111-111111111111','Tema',CURRENT_DATE,'Original'),
       ('redacao-modelo-b','22222222-2222-2222-2222-222222222222','Tema',CURRENT_DATE,'Outro');
SELECT pg_temp.ok(
 has_table_privilege('authenticated','public.enem_tentativas','SELECT,INSERT,UPDATE,DELETE')
 AND has_table_privilege('authenticated','public.redacoes_versoes','SELECT,INSERT,UPDATE,DELETE')
 AND has_table_privilege('authenticated','public.redacoes_avaliacoes','SELECT,INSERT,UPDATE,DELETE')
 AND NOT has_table_privilege('anon','public.enem_tentativas','SELECT'), 'GRANT das novas tabelas');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
SELECT public.iniciar_tentativa_enem('enem-modelo-a','tentativa-modelo-1');
SELECT pg_temp.ok((SELECT prazo_em=iniciada_em+interval '330 minutes' AND versao=1
 FROM public.enem_tentativas WHERE uuid='tentativa-modelo-1'), 'prazo/versão inicial');
DO $$ BEGIN
 BEGIN PERFORM public.iniciar_tentativa_enem('enem-modelo-a','tentativa-modelo-duplicada');
   RAISE EXCEPTION 'aceitou duas tentativas abertas'; EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN PERFORM public.iniciar_tentativa_enem('enem-modelo-b','tentativa-alheia');
   RAISE EXCEPTION 'aceitou prova alheia'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.salvar_tentativa_enem('tentativa-modelo-1',1,'{"1":"A","90":"E"}'::jsonb,false);
SELECT pg_temp.ok((SELECT versao=2 AND respostas->>'90'='E' FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-1'), 'rascunho persistido');
DO $$ BEGIN
 BEGIN PERFORM public.salvar_tentativa_enem('tentativa-modelo-1',1,'{"1":"B"}'::jsonb,false);
   RAISE EXCEPTION 'aceitou edição obsoleta'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.salvar_tentativa_enem('tentativa-modelo-1',2,'{"91":"A"}'::jsonb,false);
   RAISE EXCEPTION 'aceitou questão 91'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.salvar_tentativa_enem('tentativa-modelo-1',2,'{"1":"A","90":"E"}'::jsonb,true);
SELECT pg_temp.ok((SELECT estado='finalizada' AND finalizada_em IS NOT NULL FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-1'), 'finalização');
DO $$ BEGIN
 BEGIN UPDATE public.enem_tentativas SET respostas='{"1":"B"}' WHERE uuid='tentativa-modelo-1';
   RAISE EXCEPTION 'alterou resposta finalizada'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DELETE FROM public.enem_tentativas WHERE uuid='tentativa-modelo-1';
SELECT pg_temp.ok((SELECT count(*)=1 FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-1'), 'apagou histórico');
INSERT INTO public.redacoes_versoes(uuid,user_id,redacao_uuid,numero,texto)
VALUES ('versao-modelo-1','11111111-1111-1111-1111-111111111111','redacao-modelo-a',1,'Original');
UPDATE public.redacoes_versoes SET texto='Adulterada' WHERE uuid='versao-modelo-1';
DELETE FROM public.redacoes_versoes WHERE uuid='versao-modelo-1';
SELECT pg_temp.ok((SELECT texto='Original' FROM public.redacoes_versoes
 WHERE uuid='versao-modelo-1'), 'versão não permaneceu imutável');
INSERT INTO public.redacoes_avaliacoes(uuid,user_id,redacao_uuid,versao_uuid,avaliador,origem,data_avaliacao,nota,competencia_1)
VALUES ('avaliacao-modelo-1','11111111-1111-1111-1111-111111111111','redacao-modelo-a','versao-modelo-1','Professor','escola',CURRENT_DATE,800,160),
       ('avaliacao-modelo-2','11111111-1111-1111-1111-111111111111','redacao-modelo-a','versao-modelo-1','Professor 2','cursinho',CURRENT_DATE,900,NULL);
UPDATE public.redacoes SET nota_oficial=750 WHERE uuid='redacao-modelo-a';
SELECT pg_temp.ok((SELECT avg(nota)=850 FROM public.redacoes_avaliacoes WHERE redacao_uuid='redacao-modelo-a')
 AND (SELECT nota_oficial=750 FROM public.redacoes WHERE uuid='redacao-modelo-a'), 'média pessoal separada da nota oficial');
DO $$ BEGIN
 BEGIN UPDATE public.redacoes_avaliacoes SET competencia_1=201 WHERE uuid='avaliacao-modelo-1';
  RAISE EXCEPTION 'aceitou competência acima de 200'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN INSERT INTO public.redacoes_avaliacoes(uuid,user_id,redacao_uuid,versao_uuid,avaliador,origem,data_avaliacao,nota)
  VALUES ('avaliacao-cruzada','11111111-1111-1111-1111-111111111111','redacao-modelo-a',
   'versao-modelo-b','X','Y',CURRENT_DATE,1);
  RAISE EXCEPTION 'aceitou versão alheia'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;
UPDATE public.enem_tentativas SET estado='catalogada', redacao_uuid='redacao-modelo-a' WHERE uuid='tentativa-modelo-1';
SELECT pg_temp.ok((SELECT catalogada_em IS NOT NULL AND redacao_uuid='redacao-modelo-a'
 FROM public.enem_tentativas WHERE uuid='tentativa-modelo-1'), 'vínculo posterior à finalização');
SELECT public.iniciar_tentativa_enem('enem-modelo-a','tentativa-modelo-2');
SELECT pg_temp.ok((SELECT numero=2 AND respostas='{}'::jsonb FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-2'), 'refazer preserva tentativa anterior');
SELECT set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',true);
SELECT pg_temp.ok((SELECT count(*)=0 FROM public.enem_tentativas) AND
 (SELECT count(*)=0 FROM public.redacoes_versoes) AND
 (SELECT count(*)=0 FROM public.redacoes_avaliacoes), 'isolamento entre contas');
UPDATE public.enem_tentativas SET respostas='{"2":"A"}' WHERE uuid='tentativa-modelo-2';
SELECT pg_temp.ok((SELECT respostas='{}'::jsonb FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-2' AND user_id='11111111-1111-1111-1111-111111111111') IS NULL,
 'segunda conta não enxerga tentativa alheia');
RESET ROLE;
SELECT pg_temp.ok((SELECT respostas='{}'::jsonb FROM public.enem_tentativas
 WHERE uuid='tentativa-modelo-2'), 'segunda conta não alterou rascunho');
DELETE FROM auth.users WHERE id='11111111-1111-1111-1111-111111111111';
SELECT pg_temp.ok((SELECT count(*)=0 FROM public.enem_tentativas),
 'exclusão da conta deve continuar removendo dados em cascata');
ROLLBACK;
