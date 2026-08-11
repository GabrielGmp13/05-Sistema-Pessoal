BEGIN;

ALTER TABLE public.agenda
  ADD COLUMN tipo text NOT NULL DEFAULT 'geral',
  ADD COLUMN hora_inicio time without time zone,
  ADD COLUMN duracao_minutos integer,
  ADD COLUMN descricao text,
  ADD COLUMN materia_uuid text,
  ADD COLUMN conteudo_uuid text,
  ADD COLUMN concluido boolean NOT NULL DEFAULT false;

UPDATE public.agenda
SET tipo = 'treino'
WHERE treino_uuid IS NOT NULL;

UPDATE public.agenda
SET titulo = 'Compromisso'
WHERE titulo IS NULL OR btrim(titulo) = '';

ALTER TABLE public.agenda
  ALTER COLUMN titulo SET NOT NULL,
  ADD CONSTRAINT agenda_tipo_check
    CHECK (tipo IN ('geral', 'estudo', 'treino')),
  ADD CONSTRAINT agenda_titulo_check
    CHECK (btrim(titulo) <> ''),
  ADD CONSTRAINT agenda_duracao_minutos_check
    CHECK (duracao_minutos IS NULL OR duracao_minutos > 0),
  ADD CONSTRAINT agenda_estudo_materia_check
    CHECK (tipo <> 'estudo' OR materia_uuid IS NOT NULL),
  ADD CONSTRAINT agenda_treino_vinculo_check
    CHECK (tipo <> 'treino' OR treino_uuid IS NOT NULL),
  ADD CONSTRAINT agenda_conteudo_materia_check
    CHECK (conteudo_uuid IS NULL OR materia_uuid IS NOT NULL),
  ADD CONSTRAINT agenda_materia_uuid_fkey
    FOREIGN KEY (materia_uuid) REFERENCES public.materias(uuid),
  ADD CONSTRAINT agenda_conteudo_uuid_fkey
    FOREIGN KEY (conteudo_uuid) REFERENCES public.conteudos(uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda TO authenticated;

COMMIT;
