-- SOMENTE LOCAL: não aplicar em produção sem precheck, dry-run e autorização específica.
-- As tentativas legadas permanecem em provas_tentativas; nenhum histórico é apagado.
BEGIN;

ALTER TABLE public.provas
  ADD CONSTRAINT provas_user_uuid_key UNIQUE (user_id, uuid),
  ADD COLUMN enem_ano smallint,
  ADD COLUMN enem_aplicacao text,
  ADD COLUMN enem_caderno text,
  ADD COLUMN enem_lingua text,
  ADD CONSTRAINT provas_enem_ano_check CHECK (enem_ano IS NULL OR enem_ano BETWEEN 1998 AND 2200),
  ADD CONSTRAINT provas_enem_aplicacao_check CHECK (enem_aplicacao IS NULL OR char_length(btrim(enem_aplicacao)) BETWEEN 1 AND 80),
  ADD CONSTRAINT provas_enem_caderno_check CHECK (enem_caderno IS NULL OR char_length(btrim(enem_caderno)) BETWEEN 1 AND 80),
  ADD CONSTRAINT provas_enem_lingua_check CHECK (enem_lingua IS NULL OR enem_lingua IN ('ingles', 'espanhol')),
  ADD CONSTRAINT provas_enem_identidade_check CHECK (
    tipo IN ('enem_dia1', 'enem_dia2') OR
    (enem_ano IS NULL AND enem_aplicacao IS NULL AND enem_caderno IS NULL AND enem_lingua IS NULL)
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provas TO authenticated;

ALTER TABLE public.redacoes
  ADD CONSTRAINT redacoes_user_uuid_key UNIQUE (user_id, uuid),
  ADD COLUMN nota_oficial numeric(5,1),
  ADD CONSTRAINT redacoes_nota_oficial_check CHECK (nota_oficial IS NULL OR nota_oficial BETWEEN 0 AND 1000);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;

CREATE TABLE public.enem_tentativas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prova_uuid text NOT NULL,
  numero integer NOT NULL CHECK (numero > 0),
  estado text NOT NULL DEFAULT 'em_andamento' CHECK (estado IN ('em_andamento', 'finalizada', 'catalogada')),
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  prazo_em timestamptz NOT NULL,
  finalizada_em timestamptz,
  catalogada_em timestamptz,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(respostas) = 'object'),
  redacao_uuid text,
  versao integer NOT NULL DEFAULT 1 CHECK (versao > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  FOREIGN KEY (user_id, prova_uuid) REFERENCES public.provas(user_id, uuid) ON DELETE CASCADE,
  FOREIGN KEY (user_id, redacao_uuid) REFERENCES public.redacoes(user_id, uuid) ON DELETE SET NULL (redacao_uuid),
  UNIQUE (user_id, prova_uuid, numero),
  CHECK (finalizada_em IS NULL OR finalizada_em >= iniciada_em),
  CHECK ((estado = 'em_andamento' AND finalizada_em IS NULL AND catalogada_em IS NULL)
      OR (estado = 'finalizada' AND finalizada_em IS NOT NULL AND catalogada_em IS NULL)
      OR (estado = 'catalogada' AND finalizada_em IS NOT NULL AND catalogada_em IS NOT NULL))
);
ALTER TABLE public.enem_tentativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.enem_tentativas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- CRUD concedido conforme convenção, mas DELETE direto não deve apagar histórico.
-- Cascades de exclusão da conta são ações de integridade executadas pelo banco.
CREATE POLICY enem_historico_sem_exclusao ON public.enem_tentativas AS RESTRICTIVE
  FOR DELETE TO authenticated USING (false);
REVOKE ALL ON public.enem_tentativas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enem_tentativas TO authenticated;
CREATE UNIQUE INDEX idx_enem_tentativa_aberta ON public.enem_tentativas(user_id, prova_uuid)
  WHERE estado = 'em_andamento' AND NOT deleted;

CREATE FUNCTION public.enem_respostas_validas(p_respostas jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT jsonb_typeof(p_respostas) = 'object' AND NOT EXISTS (
    SELECT 1 FROM jsonb_each(p_respostas) r
    WHERE r.key !~ '^(?:[1-9]|[1-8][0-9]|90)$'
       OR jsonb_typeof(r.value) <> 'string'
       OR r.value #>> '{}' NOT IN ('A','B','C','D','E')
  )
$$;
REVOKE ALL ON FUNCTION public.enem_respostas_validas(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enem_respostas_validas(jsonb) TO authenticated;
ALTER TABLE public.enem_tentativas ADD CONSTRAINT enem_respostas_check
  CHECK (public.enem_respostas_validas(respostas));

CREATE FUNCTION public.enem_tentativa_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE p_tipo text; p_tempo integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT tipo, tempo_minutos INTO p_tipo, p_tempo FROM public.provas
      WHERE uuid = NEW.prova_uuid AND user_id = NEW.user_id AND NOT deleted FOR UPDATE;
    IF p_tipo NOT IN ('enem_dia1','enem_dia2') OR p_tempo IS NULL OR p_tempo <= 0 THEN
      RAISE EXCEPTION 'Prova ENEM ou duração inválida' USING ERRCODE = '23514';
    END IF;
    IF NEW.estado <> 'em_andamento' OR NEW.respostas <> '{}'::jsonb OR NEW.deleted THEN
      RAISE EXCEPTION 'Tentativa deve começar vazia' USING ERRCODE = '23514';
    END IF;
    NEW.iniciada_em := now(); NEW.prazo_em := NEW.iniciada_em + make_interval(mins => p_tempo);
    SELECT coalesce(max(numero),0)+1 INTO NEW.numero FROM public.enem_tentativas
      WHERE user_id=NEW.user_id AND prova_uuid=NEW.prova_uuid;
    NEW.versao := 1;
  ELSE
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.prova_uuid IS DISTINCT FROM OLD.prova_uuid
       OR NEW.numero IS DISTINCT FROM OLD.numero OR NEW.iniciada_em IS DISTINCT FROM OLD.iniciada_em
       OR NEW.prazo_em IS DISTINCT FROM OLD.prazo_em OR NEW.uuid IS DISTINCT FROM OLD.uuid
       OR NEW.deleted IS DISTINCT FROM OLD.deleted THEN
      RAISE EXCEPTION 'Identidade da tentativa é imutável' USING ERRCODE = '23514';
    END IF;
    IF OLD.estado <> 'em_andamento' AND NEW.respostas IS DISTINCT FROM OLD.respostas THEN
      RAISE EXCEPTION 'Respostas encerradas são imutáveis' USING ERRCODE = '23514';
    END IF;
    IF OLD.finalizada_em IS NOT NULL AND NEW.finalizada_em IS DISTINCT FROM OLD.finalizada_em THEN
      RAISE EXCEPTION 'Data de finalização é imutável' USING ERRCODE = '23514';
    END IF;
    IF now() >= OLD.prazo_em AND NEW.respostas IS DISTINCT FROM OLD.respostas THEN
      RAISE EXCEPTION 'Prazo da tentativa esgotado' USING ERRCODE = '23514';
    END IF;
    IF OLD.estado = 'catalogada' OR (OLD.estado = 'finalizada' AND NEW.estado <> 'catalogada')
       OR (OLD.estado = 'em_andamento' AND NEW.estado = 'catalogada') THEN
      RAISE EXCEPTION 'Transição de tentativa inválida' USING ERRCODE = '23514';
    END IF;
    IF NEW.estado = 'finalizada' AND OLD.estado = 'em_andamento' THEN NEW.finalizada_em := now(); END IF;
    IF NEW.estado = 'catalogada' AND OLD.estado = 'finalizada' THEN NEW.catalogada_em := now(); END IF;
    NEW.versao := OLD.versao + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enem_tentativa_guard() FROM PUBLIC, anon;
CREATE TRIGGER enem_tentativa_guard BEFORE INSERT OR UPDATE ON public.enem_tentativas
  FOR EACH ROW EXECUTE FUNCTION public.enem_tentativa_guard();

CREATE FUNCTION public.iniciar_tentativa_enem(p_prova_uuid text, p_uuid text)
RETURNS public.enem_tentativas LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE dono uuid := auth.uid(); proxima integer; criada public.enem_tentativas;
BEGIN
  IF dono IS NULL OR p_uuid IS NULL OR length(p_uuid) > 100 THEN
    RAISE EXCEPTION 'Identidade inválida' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM public.provas WHERE uuid = p_prova_uuid AND user_id = dono AND NOT deleted FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prova indisponível' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.enem_tentativas WHERE user_id=dono AND prova_uuid=p_prova_uuid AND estado='em_andamento') THEN
    RAISE EXCEPTION 'Já existe tentativa em andamento' USING ERRCODE = '23505'; END IF;
  SELECT coalesce(max(numero), 0) + 1 INTO proxima FROM public.enem_tentativas WHERE user_id=dono AND prova_uuid=p_prova_uuid;
  INSERT INTO public.enem_tentativas(uuid,user_id,prova_uuid,numero,prazo_em)
    VALUES (p_uuid,dono,p_prova_uuid,proxima,now()) RETURNING * INTO criada;
  RETURN criada;
END;
$$;
REVOKE ALL ON FUNCTION public.iniciar_tentativa_enem(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.iniciar_tentativa_enem(text,text) TO authenticated;

CREATE FUNCTION public.salvar_tentativa_enem(p_uuid text, p_versao integer, p_respostas jsonb, p_finalizar boolean DEFAULT false)
RETURNS public.enem_tentativas LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE atual public.enem_tentativas; gravada public.enem_tentativas;
BEGIN
  SELECT * INTO atual FROM public.enem_tentativas WHERE uuid=p_uuid AND user_id=auth.uid() AND NOT deleted FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tentativa indisponível' USING ERRCODE='42501'; END IF;
  IF atual.versao <> p_versao THEN RAISE EXCEPTION 'Tentativa alterada em outra aba; recarregue' USING ERRCODE='40001'; END IF;
  IF atual.estado <> 'em_andamento' THEN RAISE EXCEPTION 'Tentativa encerrada' USING ERRCODE='23514'; END IF;
  IF NOT public.enem_respostas_validas(p_respostas) THEN RAISE EXCEPTION 'Respostas inválidas' USING ERRCODE='23514'; END IF;
  IF now() >= atual.prazo_em AND p_respostas IS DISTINCT FROM atual.respostas THEN
    RAISE EXCEPTION 'Prazo esgotado; respostas não foram alteradas' USING ERRCODE='23514'; END IF;
  UPDATE public.enem_tentativas SET respostas=p_respostas,
      estado=CASE WHEN p_finalizar OR now() >= atual.prazo_em THEN 'finalizada' ELSE 'em_andamento' END
    WHERE uuid=p_uuid AND user_id=auth.uid() RETURNING * INTO gravada;
  RETURN gravada;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_tentativa_enem(text,integer,jsonb,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_tentativa_enem(text,integer,jsonb,boolean) TO authenticated;

CREATE TABLE public.redacoes_versoes (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redacao_uuid text NOT NULL,
  numero integer NOT NULL CHECK (numero > 0),
  texto text,
  imagem_path text,
  criada_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  FOREIGN KEY (user_id, redacao_uuid) REFERENCES public.redacoes(user_id, uuid) ON DELETE CASCADE,
  UNIQUE (user_id, redacao_uuid, numero),
  UNIQUE (user_id, redacao_uuid, uuid),
  CHECK (texto IS NOT NULL OR imagem_path IS NOT NULL)
);
ALTER TABLE public.redacoes_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.redacoes_versoes FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY redacao_versao_imatutavel ON public.redacoes_versoes AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY redacao_versao_sem_exclusao ON public.redacoes_versoes AS RESTRICTIVE
  FOR DELETE TO authenticated USING (false);
REVOKE ALL ON public.redacoes_versoes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes_versoes TO authenticated;

CREATE TABLE public.redacoes_avaliacoes (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redacao_uuid text NOT NULL,
  versao_uuid text,
  avaliador text NOT NULL CHECK (char_length(btrim(avaliador)) BETWEEN 1 AND 120),
  origem text NOT NULL CHECK (char_length(btrim(origem)) BETWEEN 1 AND 120),
  data_avaliacao date NOT NULL,
  nota numeric(5,1) NOT NULL CHECK (nota BETWEEN 0 AND 1000),
  competencia_1 numeric(5,1) CHECK (competencia_1 BETWEEN 0 AND 200),
  competencia_2 numeric(5,1) CHECK (competencia_2 BETWEEN 0 AND 200),
  competencia_3 numeric(5,1) CHECK (competencia_3 BETWEEN 0 AND 200),
  competencia_4 numeric(5,1) CHECK (competencia_4 BETWEEN 0 AND 200),
  competencia_5 numeric(5,1) CHECK (competencia_5 BETWEEN 0 AND 200),
  comentario text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  FOREIGN KEY (user_id, redacao_uuid) REFERENCES public.redacoes(user_id, uuid) ON DELETE CASCADE,
  FOREIGN KEY (user_id, redacao_uuid, versao_uuid)
    REFERENCES public.redacoes_versoes(user_id, redacao_uuid, uuid) ON DELETE SET NULL (versao_uuid)
);
ALTER TABLE public.redacoes_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.redacoes_avaliacoes FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
REVOKE ALL ON public.redacoes_avaliacoes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes_avaliacoes TO authenticated;
CREATE INDEX idx_redacoes_avaliacoes_ativas ON public.redacoes_avaliacoes(user_id,redacao_uuid,data_avaliacao DESC) WHERE NOT deleted;

COMMIT;
