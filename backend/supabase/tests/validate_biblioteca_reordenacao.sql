\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id) VALUES ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222') ON CONFLICT DO NOTHING;
INSERT INTO public.filmes(uuid,user_id,titulo) VALUES ('ordem-filme-a','11111111-1111-1111-1111-111111111111','Teste'), ('ordem-filme-b','22222222-2222-2222-2222-222222222222','Outro');
INSERT INTO public.elenco(uuid,user_id,tipo_obra,obra_uuid,ator,ordem) VALUES
 ('elenco-a','11111111-1111-1111-1111-111111111111','filme','ordem-filme-a','A',0),
 ('elenco-b','11111111-1111-1111-1111-111111111111','filme','ordem-filme-a','B',1),
 ('elenco-c','22222222-2222-2222-2222-222222222222','filme','ordem-filme-b','C',0);
INSERT INTO public.trilha_sonora(uuid,user_id,tipo_obra,obra_uuid,nome,ordem) VALUES
 ('trilha-a','11111111-1111-1111-1111-111111111111','filme','ordem-filme-a','A',0),
 ('trilha-b','11111111-1111-1111-1111-111111111111','filme','ordem-filme-a','B',1);
INSERT INTO public.animes(uuid,user_id,nome_original) VALUES ('ordem-anime-a','11111111-1111-1111-1111-111111111111','Teste');
INSERT INTO public.openings_endings(uuid,user_id,anime_uuid,tipo,nome,ordem) VALUES
 ('musica-a','11111111-1111-1111-1111-111111111111','ordem-anime-a','opening','A',0),
 ('musica-b','11111111-1111-1111-1111-111111111111','ordem-anime-a','ending','B',1);
DO $$ BEGIN
 IF has_function_privilege('anon','public.reordenar_lista_biblioteca(text,text,text,text[],text[])','EXECUTE')
 OR (SELECT prosecdef FROM pg_proc WHERE oid = 'public.reordenar_lista_biblioteca(text,text,text,text[],text[])'::regprocedure)
 THEN RAISE EXCEPTION 'permissão inválida'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',true);
SELECT public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-b','elenco-a'],ARRAY['elenco-a','elenco-b']);
SELECT public.reordenar_lista_biblioteca('trilha_sonora','filme','ordem-filme-a',ARRAY['trilha-b','trilha-a'],ARRAY['trilha-a','trilha-b']);
SELECT public.reordenar_lista_biblioteca('openings_endings','anime','ordem-anime-a',ARRAY['musica-b','musica-a'],ARRAY['musica-a','musica-b']);
DO $$ BEGIN
 IF (SELECT ordem FROM public.trilha_sonora WHERE uuid = 'trilha-b') IS DISTINCT FROM 0
 OR (SELECT ordem FROM public.openings_endings WHERE uuid = 'musica-b') IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'ordem de músicas inválida'; END IF;
 IF (SELECT ordem FROM public.elenco WHERE uuid = 'elenco-b') IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'não moveu'; END IF;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-a','elenco-b'],ARRAY['elenco-a','elenco-b']);
   RAISE EXCEPTION 'aceitou versão antiga';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-a','elenco-c'],ARRAY['elenco-b','elenco-a']);
   RAISE EXCEPTION 'aceitou outra conta';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-b',ARRAY['elenco-c'],ARRAY['elenco-c']);
   RAISE EXCEPTION 'aceitou obra alheia';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-a','elenco-a'],ARRAY['elenco-b','elenco-a']);
   RAISE EXCEPTION 'aceitou duplicata';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('qualquer','filme','ordem-filme-a',ARRAY[]::text[],ARRAY[]::text[]);
   RAISE EXCEPTION 'aceitou tabela arbitrária';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 IF (SELECT ordem FROM public.elenco WHERE uuid = 'elenco-b') IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'falha alterou dados'; END IF;
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-a',NULL],ARRAY['elenco-b','elenco-a']);
   RAISE EXCEPTION 'aceitou nulo';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 UPDATE public.elenco SET deleted = true WHERE uuid = 'elenco-a';
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY['elenco-a','elenco-b'],ARRAY['elenco-b','elenco-a']);
   RAISE EXCEPTION 'aceitou removido';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
 BEGIN
   PERFORM public.reordenar_lista_biblioteca('elenco','filme','ordem-filme-a',ARRAY[]::text[],ARRAY[]::text[]);
   RAISE EXCEPTION 'aceitou sessão ausente';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
\echo 'Biblioteca: reordenação atômica, concorrência e isolamento validados.'
