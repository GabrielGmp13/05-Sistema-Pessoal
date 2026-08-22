-- Corrige o privilégio SQL do cofre Google usado exclusivamente por API Routes.
-- BYPASSRLS não substitui GRANT de tabela; nenhum acesso de cliente é ampliado.

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.integracoes_google
  TO service_role;
