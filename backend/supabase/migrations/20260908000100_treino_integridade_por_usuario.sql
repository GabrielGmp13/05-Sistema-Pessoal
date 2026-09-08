BEGIN;

-- Impede que uma linha de um usuário aponte para dados de treino de outro.
-- O bloco falha de forma segura caso já exista alguma relação inconsistente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.treinos filho
    JOIN public.modulos_treino pai ON pai.uuid = filho.modulo_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.exercicios_forca filho
    JOIN public.treinos pai ON pai.uuid = filho.treino_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.exercicios_cardio filho
    JOIN public.treinos pai ON pai.uuid = filho.treino_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.sessoes_treino filho
    JOIN public.treinos pai ON pai.uuid = filho.treino_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.treinos_planejamento_semanal filho
    JOIN public.treinos pai ON pai.uuid = filho.treino_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.agenda filho
    JOIN public.treinos pai ON pai.uuid = filho.treino_uuid
    WHERE filho.user_id <> pai.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.execucoes_forca filho
    JOIN public.sessoes_treino sessao ON sessao.uuid = filho.sessao_uuid
    JOIN public.exercicios_forca exercicio ON exercicio.uuid = filho.exercicio_uuid
    WHERE filho.user_id <> sessao.user_id OR filho.user_id <> exercicio.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.execucoes_cardio filho
    JOIN public.sessoes_treino sessao ON sessao.uuid = filho.sessao_uuid
    JOIN public.exercicios_cardio exercicio ON exercicio.uuid = filho.exercicio_uuid
    WHERE filho.user_id <> sessao.user_id OR filho.user_id <> exercicio.user_id
  ) THEN
    RAISE EXCEPTION 'Existem vínculos de treino entre usuários diferentes; migração interrompida sem alterar dados.';
  END IF;
END;
$$;

ALTER TABLE public.modulos_treino ADD CONSTRAINT modulos_treino_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.treinos ADD CONSTRAINT treinos_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.exercicios_forca ADD CONSTRAINT exercicios_forca_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.exercicios_cardio ADD CONSTRAINT exercicios_cardio_user_uuid_key UNIQUE (user_id, uuid);
ALTER TABLE public.sessoes_treino ADD CONSTRAINT sessoes_treino_user_uuid_key UNIQUE (user_id, uuid);

ALTER TABLE public.treinos
  DROP CONSTRAINT treinos_modulo_uuid_fkey,
  ADD CONSTRAINT treinos_user_modulo_fkey
    FOREIGN KEY (user_id, modulo_uuid) REFERENCES public.modulos_treino(user_id, uuid);

ALTER TABLE public.exercicios_forca
  DROP CONSTRAINT exercicios_forca_treino_uuid_fkey,
  ADD CONSTRAINT exercicios_forca_user_treino_fkey
    FOREIGN KEY (user_id, treino_uuid) REFERENCES public.treinos(user_id, uuid);

ALTER TABLE public.exercicios_cardio
  DROP CONSTRAINT exercicios_cardio_treino_uuid_fkey,
  ADD CONSTRAINT exercicios_cardio_user_treino_fkey
    FOREIGN KEY (user_id, treino_uuid) REFERENCES public.treinos(user_id, uuid);

ALTER TABLE public.sessoes_treino
  DROP CONSTRAINT sessoes_treino_treino_uuid_fkey,
  ADD CONSTRAINT sessoes_treino_user_treino_fkey
    FOREIGN KEY (user_id, treino_uuid) REFERENCES public.treinos(user_id, uuid);

ALTER TABLE public.treinos_planejamento_semanal
  DROP CONSTRAINT treinos_planejamento_semanal_treino_uuid_fkey,
  ADD CONSTRAINT treinos_planejamento_user_treino_fkey
    FOREIGN KEY (user_id, treino_uuid) REFERENCES public.treinos(user_id, uuid) ON DELETE CASCADE;

ALTER TABLE public.agenda
  DROP CONSTRAINT agenda_treino_uuid_fkey,
  ADD CONSTRAINT agenda_user_treino_fkey
    FOREIGN KEY (user_id, treino_uuid) REFERENCES public.treinos(user_id, uuid);

ALTER TABLE public.execucoes_forca
  DROP CONSTRAINT execucoes_forca_sessao_uuid_fkey,
  DROP CONSTRAINT execucoes_forca_exercicio_uuid_fkey,
  ADD CONSTRAINT execucoes_forca_user_sessao_fkey
    FOREIGN KEY (user_id, sessao_uuid) REFERENCES public.sessoes_treino(user_id, uuid),
  ADD CONSTRAINT execucoes_forca_user_exercicio_fkey
    FOREIGN KEY (user_id, exercicio_uuid) REFERENCES public.exercicios_forca(user_id, uuid);

ALTER TABLE public.execucoes_cardio
  DROP CONSTRAINT execucoes_cardio_sessao_uuid_fkey,
  DROP CONSTRAINT execucoes_cardio_exercicio_uuid_fkey,
  ADD CONSTRAINT execucoes_cardio_user_sessao_fkey
    FOREIGN KEY (user_id, sessao_uuid) REFERENCES public.sessoes_treino(user_id, uuid),
  ADD CONSTRAINT execucoes_cardio_user_exercicio_fkey
    FOREIGN KEY (user_id, exercicio_uuid) REFERENCES public.exercicios_cardio(user_id, uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modulos_treino TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercicios_forca TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercicios_cardio TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessoes_treino TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execucoes_forca TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execucoes_cardio TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos_planejamento_semanal TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda TO authenticated;

COMMIT;
