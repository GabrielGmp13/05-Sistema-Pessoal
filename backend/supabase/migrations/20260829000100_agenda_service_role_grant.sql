-- A sincronização bilateral do Google Calendar usa API Routes com service_role.
-- BYPASSRLS não substitui o privilégio SQL explícito da tabela.

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.agenda
  TO service_role;
