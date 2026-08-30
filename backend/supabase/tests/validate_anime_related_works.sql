\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Anime related works assertion failed: %', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(
  (SELECT count(*) = 20
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'animes_temporadas'
     AND column_name = ANY (ARRAY[
       'nome_original','nome_traduzido','capa_url','sinopse','ano_lancamento','ano_termino',
       'duracao_minutos','anilist_id','mal_id','link_anilist','link_mal','formato','tipo_relacao',
       'diretor','roteirista','produtores','estudio','character_designer','animador_chefe','compositor'
     ])),
  'animes_temporadas deve preservar identidade e equipe da obra externa'
);

SELECT pg_temp.assert_true(
  (SELECT count(*) = 3
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'animes'
     AND column_name = ANY (ARRAY['ano_obra_inicio','ano_obra_fim','duracao_obra_minutos'])),
  'animes deve preservar valores base usados nos cálculos derivados'
);

SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.animes_temporadas', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.filmes', 'SELECT, INSERT, UPDATE, DELETE')
  AND has_table_privilege('authenticated', 'public.animes', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated deve manter CRUD nas tabelas alteradas'
);

SELECT pg_temp.assert_true(
  to_regclass('public.idx_animes_temporadas_anilist') IS NOT NULL
  AND to_regclass('public.idx_filmes_complementos_anilist') IS NOT NULL,
  'índices únicos parciais das obras externas devem existir'
);

ROLLBACK;

\echo 'Anime related works: todos os testes locais passaram.'
