ALTER TABLE public.redacoes
  ADD COLUMN tempo_execucao_minutos INTEGER;

ALTER TABLE public.redacoes
  ADD CONSTRAINT redacoes_tempo_execucao_minutos_check
  CHECK (tempo_execucao_minutos IS NULL OR tempo_execucao_minutos >= 0);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;
