BEGIN;

ALTER TABLE public.agenda
  ADD COLUMN prioridade text NOT NULL DEFAULT 'normal',
  ADD CONSTRAINT agenda_prioridade_check
    CHECK (prioridade IN ('baixa', 'normal', 'alta'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda TO authenticated;

COMMIT;
