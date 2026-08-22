-- Separa as credenciais Google por finalidade sem duplicar refresh tokens.
-- A conexão legada é preservada como Calendar; YouTube deve ser conectado
-- explicitamente com a conta desejada após o deploy.

ALTER TABLE public.integracoes_google
  ADD COLUMN servico text;

UPDATE public.integracoes_google
SET servico = 'calendar'
WHERE servico IS NULL;

ALTER TABLE public.integracoes_google
  ALTER COLUMN servico SET NOT NULL,
  ADD CONSTRAINT integracoes_google_servico_check
    CHECK (servico IN ('youtube', 'calendar'));

ALTER TABLE public.integracoes_google
  DROP CONSTRAINT integracoes_google_pkey,
  ADD CONSTRAINT integracoes_google_pkey PRIMARY KEY (user_id, servico);

COMMENT ON COLUMN public.integracoes_google.servico IS
  'Finalidade OAuth isolada: youtube ou calendar.';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.integracoes_google
  TO authenticated, service_role;
