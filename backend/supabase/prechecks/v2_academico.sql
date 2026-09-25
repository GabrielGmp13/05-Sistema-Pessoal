-- Somente leitura; nunca executa migrations nem exibe dados pessoais.
-- Uma única instrução é exigida por db query (prepared statement).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20260915000100') THEN
    RAISE EXCEPTION 'Histórico de Treino esperado não encontrado; conferir alvo e schema';
  END IF;
  IF EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version IN ('20260917000200','20260917000300')) THEN
    RAISE EXCEPTION 'Um dos alvos já está aplicado; conferir estado antes de preparar novo lote';
  END IF;
  IF to_regclass('public.lancamentos_nota') IS NOT NULL OR to_regclass('public.enem_tentativas') IS NOT NULL
     OR to_regclass('public.redacoes_versoes') IS NOT NULL OR to_regclass('public.redacoes_avaliacoes') IS NOT NULL THEN
    RAISE EXCEPTION 'Objetos novos já existem sem histórico esperado; interromper e reconciliar';
  END IF;
  IF EXISTS (SELECT 1 FROM public.simulados WHERE total_questoes < 0 OR total_acertos < 0 OR total_acertos > total_questoes) THEN
    RAISE EXCEPTION 'Há totais de simulados incompatíveis; nenhuma correção automática autorizada';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND
      ((table_name='simulados' AND column_name='total_anuladas') OR
       (table_name='provas' AND column_name IN ('enem_ano','enem_aplicacao','enem_caderno','enem_lingua')) OR
       (table_name='redacoes' AND column_name='nota_oficial'))) THEN
    RAISE EXCEPTION 'Colunas novas já existem; interromper e reconciliar';
  END IF;
  RAISE NOTICE 'precheck_v2_academico_ok';
END $$;
