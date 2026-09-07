\set ON_ERROR_STOP on
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'suporte assertion failed: %', message; END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chamados_suporte') THEN
    RAISE EXCEPTION 'Tabela chamados_suporte ausente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'suporte-anexos' AND public = false AND file_size_limit = 2097152) THEN
    RAISE EXCEPTION 'Bucket privado suporte-anexos ausente ou incorreto';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'suporte%') THEN
    RAISE EXCEPTION 'Storage de suporte não deve aceitar acesso direto do cliente';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('chamados_suporte', 'chamados_suporte_historico', 'chamados_suporte_anexos')) <> 3 THEN
    RAISE EXCEPTION 'RLS de suporte deve conter somente as três policies de leitura própria';
  END IF;
END $$;

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.chamados_suporte (uuid, user_id, protocolo, tipo, titulo, descricao) VALUES
  ('chamado-a', '11111111-1111-1111-1111-111111111111', 'SP-TESTE-A', 'bug', 'Chamado do A', 'Descrição do usuário A'),
  ('chamado-b', '22222222-2222-2222-2222-222222222222', 'SP-TESTE-B', 'sugestao', 'Chamado do B', 'Descrição do usuário B');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 AND min(uuid) = 'chamado-a' FROM public.chamados_suporte),
  'usuário A deve ler apenas o próprio chamado'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.chamados_suporte (uuid, user_id, protocolo, tipo, titulo, descricao)
    VALUES ('direto', auth.uid(), 'SP-DIRETO', 'bug', 'Inserção direta', 'Isto deveria ser bloqueado');
    RAISE EXCEPTION 'suporte assertion failed: cliente conseguiu inserir diretamente';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

UPDATE public.chamados_suporte
SET status = 'em_analise', resposta = 'Resposta de teste'
WHERE uuid = 'chamado-a';
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1
     AND min(status) = 'em_analise'
     AND min(origem) = 'administracao'
     AND min(mensagem) = 'Resposta de teste'
   FROM public.chamados_suporte_historico
   WHERE chamado_suporte_uuid = 'chamado-a'),
  'mudança administrativa deve criar histórico automaticamente'
);

ROLLBACK;
