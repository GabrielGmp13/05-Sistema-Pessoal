ALTER TABLE public.redacoes
  ALTER COLUMN nota TYPE NUMERIC(5,1);

ALTER TABLE public.redacoes
  ADD CONSTRAINT redacoes_nota_range
  CHECK (nota IS NULL OR nota BETWEEN 0 AND 1000);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;
