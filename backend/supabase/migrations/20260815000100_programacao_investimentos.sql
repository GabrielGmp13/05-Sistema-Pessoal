BEGIN;

ALTER TABLE public.projetos
  ADD COLUMN repositorio_url text,
  ADD COLUMN linguagem_principal text,
  ADD COLUMN destaque boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT projetos_repositorio_url_check CHECK (
    repositorio_url IS NULL
    OR (btrim(repositorio_url) <> '' AND repositorio_url ~* '^https?://')
  ),
  ADD CONSTRAINT projetos_linguagem_principal_check CHECK (
    linguagem_principal IS NULL OR btrim(linguagem_principal) <> ''
  );

CREATE TABLE public.financas_investimentos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  tipo text NOT NULL,
  quantidade numeric(18,8) NOT NULL,
  preco_medio numeric(18,8) NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT financas_investimentos_ticker_check CHECK (btrim(ticker) <> ''),
  CONSTRAINT financas_investimentos_tipo_check CHECK (
    tipo IN ('acao', 'fii', 'etf', 'bdr', 'cripto', 'renda_fixa', 'outro')
  ),
  CONSTRAINT financas_investimentos_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT financas_investimentos_preco_medio_check CHECK (preco_medio >= 0)
);

CREATE INDEX idx_projetos_programacao_ativos
  ON public.projetos (user_id, destaque DESC, updated_at DESC)
  WHERE NOT deleted AND (repositorio_url IS NOT NULL OR linguagem_principal IS NOT NULL);

CREATE INDEX idx_financas_investimentos_ativos
  ON public.financas_investimentos (user_id, tipo, ticker)
  WHERE NOT deleted;

ALTER TABLE public.financas_investimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.financas_investimentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_investimentos TO authenticated;

COMMIT;
