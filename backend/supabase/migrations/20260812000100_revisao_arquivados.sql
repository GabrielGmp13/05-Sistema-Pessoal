BEGIN;

ALTER TABLE public.revisao_espacada
  ADD COLUMN arquivado boolean NOT NULL DEFAULT false;

CREATE INDEX idx_revisao_arquivados_ativos
  ON public.revisao_espacada USING btree (user_id, arquivado, proxima_revisao)
  WHERE NOT deleted;

COMMENT ON COLUMN public.revisao_espacada.arquivado IS
  'Suspende o card das filas de revisão sem apagar progresso ou vínculos.';

COMMIT;
