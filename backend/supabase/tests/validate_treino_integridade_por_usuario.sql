\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.modulos_treino (uuid, user_id, nome) VALUES
  ('modulo-a', '11111111-1111-1111-1111-111111111111', 'Módulo A'),
  ('modulo-b', '22222222-2222-2222-2222-222222222222', 'Módulo B');

INSERT INTO public.treinos (uuid, user_id, modulo_uuid, nome) VALUES
  ('treino-a', '11111111-1111-1111-1111-111111111111', 'modulo-a', 'Treino A'),
  ('treino-b', '22222222-2222-2222-2222-222222222222', 'modulo-b', 'Treino B');

INSERT INTO public.exercicios_forca (uuid, user_id, treino_uuid, nome) VALUES
  ('exercicio-a', '11111111-1111-1111-1111-111111111111', 'treino-a', 'Exercício A');

INSERT INTO public.sessoes_treino (uuid, user_id, treino_uuid, data_inicio) VALUES
  ('sessao-a', '11111111-1111-1111-1111-111111111111', 'treino-a', NOW());

DO $$
BEGIN
  BEGIN
    INSERT INTO public.treinos (uuid, user_id, modulo_uuid, nome)
    VALUES ('treino-cruzado', '11111111-1111-1111-1111-111111111111', 'modulo-b', 'Inválido');
    RAISE EXCEPTION 'teste falhou: treino aceitou módulo de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.exercicios_forca (uuid, user_id, treino_uuid, nome)
    VALUES ('exercicio-cruzado', '11111111-1111-1111-1111-111111111111', 'treino-b', 'Inválido');
    RAISE EXCEPTION 'teste falhou: exercício aceitou treino de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.sessoes_treino (uuid, user_id, treino_uuid, data_inicio)
    VALUES ('sessao-cruzada', '11111111-1111-1111-1111-111111111111', 'treino-b', NOW());
    RAISE EXCEPTION 'teste falhou: sessão aceitou treino de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.treinos_planejamento_semanal (uuid, user_id, treino_uuid, dia_semana)
    VALUES ('planejamento-cruzado', '11111111-1111-1111-1111-111111111111', 'treino-b', 1);
    RAISE EXCEPTION 'teste falhou: planejamento aceitou treino de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.agenda (uuid, user_id, titulo, data, treino_uuid)
    VALUES ('agenda-cruzada', '11111111-1111-1111-1111-111111111111', 'Inválido', CURRENT_DATE, 'treino-b');
    RAISE EXCEPTION 'teste falhou: agenda aceitou treino de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.execucoes_forca (uuid, user_id, sessao_uuid, exercicio_uuid)
    VALUES ('execucao-cruzada', '22222222-2222-2222-2222-222222222222', 'sessao-a', 'exercicio-a');
    RAISE EXCEPTION 'teste falhou: execução aceitou sessão e exercício de outro usuário';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END;
$$;

ROLLBACK;
\echo 'Treino: vínculos entre usuários diferentes foram rejeitados.'
