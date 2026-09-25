-- SOMENTE LOCAL: não aplicar em produção sem precheck e autorização específica.
-- Não converte provas.nota nem inventa escala para avaliações históricas.
BEGIN;

ALTER TABLE public.materias
  ADD CONSTRAINT materias_user_uuid_key UNIQUE (user_id, uuid);

CREATE TABLE public.lancamentos_nota (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_uuid text NOT NULL,
  titulo text NOT NULL,
  data date,
  nota numeric(10,3),
  nota_maxima numeric(10,3) NOT NULL,
  peso numeric(10,3) NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT lancamentos_nota_user_materia_fkey
    FOREIGN KEY (user_id, materia_uuid) REFERENCES public.materias(user_id, uuid) ON DELETE CASCADE,
  CONSTRAINT lancamentos_nota_titulo_check CHECK (char_length(btrim(titulo)) BETWEEN 1 AND 200),
  CONSTRAINT lancamentos_nota_maxima_check CHECK (nota_maxima > 0 AND nota_maxima <> 'NaN'::numeric),
  CONSTRAINT lancamentos_nota_peso_check CHECK (peso > 0 AND peso <> 'NaN'::numeric),
  CONSTRAINT lancamentos_nota_valor_check CHECK (nota IS NULL OR (nota >= 0 AND nota <= nota_maxima))
);

ALTER TABLE public.lancamentos_nota ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.lancamentos_nota FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Remove eventuais privilégios de defaults locais: o contrato é somente CRUD.
REVOKE ALL ON public.lancamentos_nota FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_nota TO authenticated;
CREATE INDEX idx_lancamentos_nota_materia_ativos
  ON public.lancamentos_nota (user_id, materia_uuid, data DESC) WHERE NOT deleted;

CREATE FUNCTION public.media_ponderada_materia(p_materia_uuid text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  dono uuid := auth.uid();
  resultado jsonb;
BEGIN
  IF dono IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.materias WHERE uuid=p_materia_uuid AND user_id=dono AND NOT deleted
  ) THEN RAISE EXCEPTION 'Matéria indisponível para esta conta' USING ERRCODE='42501'; END IF;
  SELECT jsonb_build_object(
    'percentual', 100 * sum(nota/nota_maxima*peso) FILTER (WHERE nota IS NOT NULL)
      / nullif(sum(peso) FILTER (WHERE nota IS NOT NULL), 0),
    'avaliadas', count(*) FILTER (WHERE nota IS NOT NULL),
    'pendentes', count(*) FILTER (WHERE nota IS NULL),
    'peso_avaliado', coalesce(sum(peso) FILTER (WHERE nota IS NOT NULL), 0)
  ) INTO resultado
  FROM public.lancamentos_nota
  WHERE user_id=dono AND materia_uuid=p_materia_uuid AND NOT deleted;
  RETURN resultado;
END;
$$;
REVOKE ALL ON FUNCTION public.media_ponderada_materia(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.media_ponderada_materia(text) TO authenticated;

ALTER TABLE public.simulados
  ADD COLUMN total_anuladas integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT simulados_totais_check CHECK (
    total_questoes >= 0
    AND total_anuladas >= 0 AND total_anuladas <= total_questoes
    AND total_acertos >= 0 AND total_acertos <= total_questoes - total_anuladas
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulados TO authenticated;

-- Exportação existente enumera tabelas por user_id e inclui a nova tabela.
-- Anuladas não contam como erro/acerto; zero questões válidas não é desempenho zero.
COMMIT;
