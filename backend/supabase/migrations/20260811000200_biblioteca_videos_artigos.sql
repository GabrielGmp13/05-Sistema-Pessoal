BEGIN;

CREATE TABLE public.videos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  url text NOT NULL,
  youtube_id text,
  canal text,
  duracao_segundos integer,
  capa_url text,
  assistido boolean NOT NULL DEFAULT false,
  favorito boolean NOT NULL DEFAULT false,
  nota numeric(3,1),
  comentario text,
  updated_at timestamp with time zone DEFAULT now(),
  deleted boolean DEFAULT false,
  CONSTRAINT videos_titulo_check CHECK (btrim(titulo) <> ''),
  CONSTRAINT videos_url_check CHECK (btrim(url) <> ''),
  CONSTRAINT videos_duracao_segundos_check
    CHECK (duracao_segundos IS NULL OR duracao_segundos > 0),
  CONSTRAINT videos_nota_check
    CHECK (nota IS NULL OR nota BETWEEN 0 AND 10)
);

CREATE TABLE public.artigos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  url text NOT NULL,
  autor text,
  site_origem text,
  data_leitura date,
  tempo_leitura_minutos integer,
  favorito boolean NOT NULL DEFAULT false,
  comentario text,
  updated_at timestamp with time zone DEFAULT now(),
  deleted boolean DEFAULT false,
  CONSTRAINT artigos_titulo_check CHECK (btrim(titulo) <> ''),
  CONSTRAINT artigos_url_check CHECK (btrim(url) <> ''),
  CONSTRAINT artigos_tempo_leitura_minutos_check
    CHECK (tempo_leitura_minutos IS NULL OR tempo_leitura_minutos > 0)
);

CREATE INDEX idx_videos_ativos
  ON public.videos USING btree (user_id)
  WHERE NOT deleted;

CREATE INDEX idx_artigos_ativos
  ON public.artigos USING btree (user_id)
  WHERE NOT deleted;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.videos
  USING (auth.uid() = user_id);

CREATE POLICY user_own_data ON public.artigos
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artigos TO authenticated;

COMMIT;
