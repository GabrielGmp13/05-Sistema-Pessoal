BEGIN;

CREATE TABLE public.idiomas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nivel_atual text,
  objetivo text,
  cor text,
  ativo boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT idiomas_nome_check CHECK (btrim(nome) <> ''),
  CONSTRAINT idiomas_cor_check CHECK (cor IS NULL OR cor ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE public.idiomas_vocabulario (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idioma_uuid text NOT NULL REFERENCES public.idiomas(uuid) ON DELETE CASCADE,
  termo text NOT NULL,
  traducao text NOT NULL,
  exemplo text,
  dominado boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT idiomas_vocabulario_termo_check CHECK (btrim(termo) <> ''),
  CONSTRAINT idiomas_vocabulario_traducao_check CHECK (btrim(traducao) <> '')
);

CREATE TABLE public.idiomas_praticas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idioma_uuid text NOT NULL REFERENCES public.idiomas(uuid) ON DELETE CASCADE,
  data date NOT NULL,
  tipo text NOT NULL,
  duracao_minutos integer NOT NULL,
  observacoes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT idiomas_praticas_tipo_check CHECK (
    tipo IN ('leitura', 'escuta', 'conversacao', 'escrita', 'aula', 'revisao', 'outro')
  ),
  CONSTRAINT idiomas_praticas_duracao_check CHECK (duracao_minutos > 0)
);

CREATE UNIQUE INDEX idx_idiomas_nome_ativo
  ON public.idiomas (user_id, lower(btrim(nome))) WHERE NOT deleted;
CREATE INDEX idx_idiomas_vocabulario_ativo
  ON public.idiomas_vocabulario (user_id, idioma_uuid, dominado, updated_at DESC) WHERE NOT deleted;
CREATE INDEX idx_idiomas_praticas_data_ativa
  ON public.idiomas_praticas (user_id, data DESC) WHERE NOT deleted;
CREATE INDEX idx_idiomas_praticas_idioma_ativa
  ON public.idiomas_praticas (user_id, idioma_uuid, data DESC) WHERE NOT deleted;

ALTER TABLE public.idiomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiomas_vocabulario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idiomas_praticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.idiomas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.idiomas_vocabulario FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.idiomas_praticas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.idiomas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idiomas_vocabulario TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idiomas_praticas TO authenticated;

COMMIT;
