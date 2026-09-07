-- Exportação autenticada: agrega todos os registros públicos pertencentes ao
-- usuário, sem expor credenciais server-only das integrações Google.
CREATE OR REPLACE FUNCTION public.exportar_dados_usuario(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tabela record;
  registros jsonb;
  resultado jsonb := '{}'::jsonb;
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário obrigatório';
  END IF;

  FOR tabela IN
    SELECT c.relname AS nome
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND a.attname = 'user_id'
      AND NOT a.attisdropped
      AND c.relname <> 'integracoes_google'
    ORDER BY c.relname
  LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(registro)), ''[]''::jsonb)
         FROM public.%I AS registro
        WHERE registro.user_id = $1',
      tabela.nome
    )
    INTO registros
    USING target_user_id;

    resultado := resultado || jsonb_build_object(tabela.nome, registros);
  END LOOP;

  RETURN jsonb_build_object(
    'versao', 1,
    'gerado_em', now(),
    'registros', resultado,
    'arquivos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'bucket', objeto.bucket_id,
        'caminho', objeto.name,
        'criado_em', objeto.created_at,
        'atualizado_em', objeto.updated_at,
        'tamanho_bytes', COALESCE(NULLIF(objeto.metadata ->> 'size', '')::bigint, 0),
        'tipo', objeto.metadata ->> 'mimetype'
      ) ORDER BY objeto.bucket_id, objeto.name)
      FROM storage.objects AS objeto
      WHERE objeto.name LIKE target_user_id::text || '/%'
    ), '[]'::jsonb),
    'integracoes_google', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'servico', integracao.servico,
        'email_google', integracao.email_google,
        'conectado_em', integracao.created_at,
        'atualizado_em', integracao.updated_at
      ) ORDER BY integracao.servico)
      FROM public.integracoes_google AS integracao
      WHERE integracao.user_id = target_user_id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.exportar_dados_usuario(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exportar_dados_usuario(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.exportar_dados_usuario(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exportar_dados_usuario(uuid) TO service_role;
