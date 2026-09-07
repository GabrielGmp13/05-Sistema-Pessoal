\set ON_ERROR_STOP on
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'exportacao assertion failed: %', message; END IF;
END;
$$;

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agenda (uuid, user_id, titulo, data) VALUES
  ('exportacao-a', '11111111-1111-1111-1111-111111111111', 'Evento do A', CURRENT_DATE),
  ('exportacao-b', '22222222-2222-2222-2222-222222222222', 'Evento do B', CURRENT_DATE);

INSERT INTO public.integracoes_google (
  user_id, servico, email_google, credenciais_cifradas
) VALUES (
  '11111111-1111-1111-1111-111111111111', 'calendar', 'a@example.test',
  'segredo-cifrado'
);

SELECT pg_temp.assert_true(
  jsonb_array_length(public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111') #> '{registros,agenda}') = 1,
  'exportação deve conter somente a agenda do usuário alvo'
);
SELECT pg_temp.assert_true(
  public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111')::text NOT LIKE '%Evento do B%',
  'exportação não pode misturar dados de outro usuário'
);
SELECT pg_temp.assert_true(
  public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111')::text NOT LIKE '%segredo-cifrado%',
  'exportação não pode incluir tokens Google'
);
SELECT pg_temp.assert_true(
  public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111') #>> '{integracoes_google,0,email_google}' = 'a@example.test',
  'exportação deve informar a conta Google sem credenciais'
);

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.exportar_dados_usuario('11111111-1111-1111-1111-111111111111');
    RAISE EXCEPTION 'exportacao assertion failed: authenticated executou função administrativa';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

ROLLBACK;
