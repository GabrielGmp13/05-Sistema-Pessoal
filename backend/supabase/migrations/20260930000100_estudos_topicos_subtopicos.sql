BEGIN;

-- V2.3: adiciona a camada de tópicos sem reescrever os conteúdos históricos.
-- Os conteúdos acadêmicos existentes passam a ser subtópicos de compatibilidade.
CREATE TABLE public.topicos_estudo (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 1 AND 200),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, uuid)
);

CREATE TABLE public.topicos_materias (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_uuid text NOT NULL,
  materia_uuid text NOT NULL,
  mostra_escola boolean NOT NULL DEFAULT false,
  mostra_enem boolean NOT NULL DEFAULT false,
  escopo_origem text NOT NULL DEFAULT 'manual'
    CHECK (escopo_origem IN ('manual', 'inferido_materia')),
  escopo_ambiguo boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT topicos_materias_topico_user_fkey
    FOREIGN KEY (user_id, topico_uuid)
    REFERENCES public.topicos_estudo(user_id, uuid) ON DELETE CASCADE,
  CONSTRAINT topicos_materias_materia_user_fkey
    FOREIGN KEY (user_id, materia_uuid)
    REFERENCES public.materias(user_id, uuid) ON DELETE CASCADE,
  CONSTRAINT topicos_materias_escopo_check
    CHECK (mostra_escola OR mostra_enem)
);

CREATE UNIQUE INDEX topicos_materias_ativo_unique
  ON public.topicos_materias(user_id, topico_uuid, materia_uuid)
  WHERE NOT deleted;
CREATE INDEX idx_topicos_materias_materia_ativos
  ON public.topicos_materias(user_id, materia_uuid)
  WHERE NOT deleted;

ALTER TABLE public.conteudos ADD COLUMN topico_uuid text;
ALTER TABLE public.conteudos
  ADD CONSTRAINT conteudos_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.revisao_espacada
  ADD CONSTRAINT revisao_espacada_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.conteudos
  ADD CONSTRAINT conteudos_topico_uuid_fkey
  FOREIGN KEY (user_id, topico_uuid)
  REFERENCES public.topicos_estudo(user_id, uuid) ON DELETE SET NULL (topico_uuid);
CREATE INDEX idx_conteudos_topico_ativos
  ON public.conteudos(user_id, topico_uuid)
  WHERE NOT deleted AND topico_uuid IS NOT NULL;

-- Apenas conteúdos ligados a matérias acadêmicas recebem tópico na migração.
-- Cursos e áreas antigas continuam usando o fluxo existente até decisão própria.
INSERT INTO public.topicos_estudo (uuid, user_id, nome, updated_at, deleted)
SELECT DISTINCT c.uuid, c.user_id, c.nome, c.updated_at, c.deleted
FROM public.conteudos c
JOIN public.conteudos_materias cm
  ON cm.conteudo_uuid = c.uuid AND cm.user_id = c.user_id AND NOT cm.deleted
JOIN public.materias m
  ON m.uuid = cm.materia_uuid AND m.user_id = cm.user_id AND NOT m.deleted
WHERE m.tipo = 'academica' AND (m.mostra_escola OR m.mostra_enem)
ON CONFLICT (uuid) DO NOTHING;

UPDATE public.conteudos c
SET topico_uuid = c.uuid
WHERE c.topico_uuid IS NULL
  AND EXISTS (
    SELECT 1 FROM public.topicos_estudo t
    WHERE t.uuid = c.uuid AND t.user_id = c.user_id
  );

-- O escopo herdado é auditável. Matérias compartilhadas são ambíguas porque
-- o schema anterior não dizia se cada conteúdo valia para um ou ambos contextos.
INSERT INTO public.topicos_materias (
  uuid, user_id, topico_uuid, materia_uuid,
  mostra_escola, mostra_enem, escopo_origem, escopo_ambiguo,
  updated_at, deleted
)
SELECT
  cm.uuid,
  cm.user_id,
  cm.conteudo_uuid,
  cm.materia_uuid,
  m.mostra_escola,
  m.mostra_enem,
  'inferido_materia',
  m.mostra_escola AND m.mostra_enem,
  cm.updated_at,
  false
FROM public.conteudos_materias cm
JOIN public.materias m
  ON m.uuid = cm.materia_uuid AND m.user_id = cm.user_id AND NOT m.deleted
JOIN public.topicos_estudo t
  ON t.uuid = cm.conteudo_uuid AND t.user_id = cm.user_id
WHERE NOT cm.deleted AND m.tipo = 'academica' AND (m.mostra_escola OR m.mostra_enem)
ON CONFLICT DO NOTHING;

-- Histórico novo e imutável. Não há backfill: repeticoes é sequência SM-2,
-- não contagem histórica, portanto convertê-la fabricaria tentativas.
CREATE TABLE public.revisoes_tentativas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revisao_uuid text NOT NULL,
  conteudo_uuid text,
  qualidade smallint NOT NULL CHECK (qualidade BETWEEN 0 AND 5),
  resultado text NOT NULL CHECK (resultado IN ('falhou', 'dificil', 'bom', 'facil')),
  respondida_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revisoes_tentativas_revisao_user_fkey
    FOREIGN KEY (user_id, revisao_uuid)
    REFERENCES public.revisao_espacada(user_id, uuid) ON DELETE RESTRICT,
  CONSTRAINT revisoes_tentativas_conteudo_user_fkey
    FOREIGN KEY (user_id, conteudo_uuid)
    REFERENCES public.conteudos(user_id, uuid) ON DELETE SET NULL (conteudo_uuid)
);
CREATE INDEX idx_revisoes_tentativas_conteudo
  ON public.revisoes_tentativas(user_id, conteudo_uuid, respondida_em DESC)
  WHERE conteudo_uuid IS NOT NULL;

ALTER TABLE public.topicos_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topicos_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisoes_tentativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.topicos_estudo FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.topicos_materias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.revisoes_tentativas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY revisao_tentativa_imatutavel ON public.revisoes_tentativas AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY revisao_tentativa_sem_exclusao ON public.revisoes_tentativas AS RESTRICTIVE
  FOR DELETE TO authenticated USING (false);

REVOKE ALL ON public.topicos_estudo FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.topicos_materias FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.revisoes_tentativas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topicos_estudo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topicos_materias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revisoes_tentativas TO authenticated;

-- Atualiza o card e grava a tentativa na mesma transação. A semântica atual
-- confirma 0-2 = falhou, 3 = difícil mas lembrou, 4 = bom e 5 = fácil.
CREATE OR REPLACE FUNCTION public.avaliar_revisao_v23(
  p_revisao_uuid text,
  p_qualidade integer
) RETURNS SETOF public.revisao_espacada
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_card public.revisao_espacada%ROWTYPE;
  v_ef numeric;
  v_repeticoes integer;
  v_intervalo integer;
  v_resultado text;
BEGIN
  IF auth.uid() IS NULL OR p_qualidade < 0 OR p_qualidade > 5 THEN
    RAISE EXCEPTION 'avaliacao_invalida';
  END IF;

  SELECT * INTO v_card
  FROM public.revisao_espacada
  WHERE uuid = p_revisao_uuid AND user_id = auth.uid() AND NOT deleted
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'revisao_nao_encontrada'; END IF;

  v_ef := greatest(1.3, v_card.ef + (0.1 - (5 - p_qualidade) * (0.08 + (5 - p_qualidade) * 0.02)));
  IF p_qualidade < 3 THEN
    v_repeticoes := 0;
    v_intervalo := 1;
    v_resultado := 'falhou';
  ELSE
    v_repeticoes := v_card.repeticoes + 1;
    v_intervalo := CASE
      WHEN v_repeticoes = 1 THEN 1
      WHEN v_repeticoes = 2 THEN 6
      ELSE round(v_card.intervalo_dias * v_ef)::integer
    END;
    v_resultado := CASE p_qualidade WHEN 3 THEN 'dificil' WHEN 4 THEN 'bom' ELSE 'facil' END;
  END IF;

  UPDATE public.revisao_espacada
  SET ef = round(v_ef, 2), repeticoes = v_repeticoes,
      intervalo_dias = v_intervalo,
      proxima_revisao = ((now() AT TIME ZONE 'America/Recife')::date + v_intervalo),
      updated_at = now()
  WHERE uuid = v_card.uuid AND user_id = auth.uid();

  INSERT INTO public.revisoes_tentativas (
    uuid, user_id, revisao_uuid, conteudo_uuid, qualidade, resultado
  ) VALUES (
    gen_random_uuid()::text, auth.uid(), v_card.uuid, v_card.conteudo_uuid,
    p_qualidade, v_resultado
  );

  RETURN QUERY SELECT * FROM public.revisao_espacada
    WHERE uuid = v_card.uuid AND user_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.avaliar_revisao_v23(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.avaliar_revisao_v23(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.criar_topico_estudo_v23(
  p_materia_uuid text,
  p_nome text,
  p_mostra_escola boolean,
  p_mostra_enem boolean
) RETURNS public.topicos_estudo
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_materia public.materias%ROWTYPE;
  v_topico public.topicos_estudo%ROWTYPE;
  v_topico_uuid text := gen_random_uuid()::text;
  v_conteudo_uuid text := gen_random_uuid()::text;
BEGIN
  IF auth.uid() IS NULL OR char_length(btrim(p_nome)) NOT BETWEEN 1 AND 200
     OR NOT (p_mostra_escola OR p_mostra_enem) THEN
    RAISE EXCEPTION 'topico_invalido';
  END IF;

  SELECT * INTO v_materia FROM public.materias
  WHERE uuid = p_materia_uuid AND user_id = auth.uid() AND NOT deleted
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'materia_nao_encontrada'; END IF;

  INSERT INTO public.topicos_estudo (uuid, user_id, nome)
  VALUES (v_topico_uuid, auth.uid(), btrim(p_nome))
  RETURNING * INTO v_topico;

  INSERT INTO public.topicos_materias (
    uuid, user_id, topico_uuid, materia_uuid,
    mostra_escola, mostra_enem, escopo_origem, escopo_ambiguo
  ) VALUES (
    gen_random_uuid()::text, auth.uid(), v_topico_uuid, v_materia.uuid,
    p_mostra_escola, p_mostra_enem, 'manual', false
  );

  -- Subtópico inicial de compatibilidade. O nome igual é tratado pela UI sem
  -- duplicação visual e pode ser reorganizado depois pelo usuário.
  INSERT INTO public.conteudos (
    uuid, user_id, nome, teoria_vista, dominado_manual, topico_uuid
  ) VALUES (
    v_conteudo_uuid, auth.uid(), btrim(p_nome), false, false, v_topico_uuid
  );
  INSERT INTO public.conteudos_materias (
    uuid, user_id, conteudo_uuid, materia_uuid
  ) VALUES (
    gen_random_uuid()::text, auth.uid(), v_conteudo_uuid, v_materia.uuid
  );

  RETURN v_topico;
END;
$$;
REVOKE ALL ON FUNCTION public.criar_topico_estudo_v23(text, text, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_topico_estudo_v23(text, text, boolean, boolean) TO authenticated;

COMMIT;
