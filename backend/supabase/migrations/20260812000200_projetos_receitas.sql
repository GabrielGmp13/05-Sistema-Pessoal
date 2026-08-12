BEGIN;

CREATE TABLE public.projetos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  data_prazo date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT projetos_nome_check CHECK (btrim(nome) <> ''),
  CONSTRAINT projetos_status_check CHECK (status IN ('ativo', 'pausado', 'concluido'))
);

CREATE TABLE public.projetos_tarefas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projeto_uuid text NOT NULL REFERENCES public.projetos(uuid),
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'a_fazer',
  ordem integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT projetos_tarefas_titulo_check CHECK (btrim(titulo) <> ''),
  CONSTRAINT projetos_tarefas_status_check CHECK (status IN ('a_fazer', 'fazendo', 'feito')),
  CONSTRAINT projetos_tarefas_ordem_check CHECK (ordem >= 0)
);

CREATE TABLE public.receitas (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  ingredientes text NOT NULL,
  modo_preparo text NOT NULL,
  tempo_preparo_minutos integer,
  porcoes integer,
  categoria text,
  nota numeric(3,1),
  favorito boolean NOT NULL DEFAULT false,
  fez boolean NOT NULL DEFAULT false,
  foto_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT receitas_titulo_check CHECK (btrim(titulo) <> ''),
  CONSTRAINT receitas_ingredientes_check CHECK (btrim(ingredientes) <> ''),
  CONSTRAINT receitas_modo_preparo_check CHECK (btrim(modo_preparo) <> ''),
  CONSTRAINT receitas_tempo_preparo_check CHECK (tempo_preparo_minutos IS NULL OR tempo_preparo_minutos > 0),
  CONSTRAINT receitas_porcoes_check CHECK (porcoes IS NULL OR porcoes > 0),
  CONSTRAINT receitas_nota_check CHECK (nota IS NULL OR nota BETWEEN 0 AND 10)
);

CREATE INDEX idx_projetos_ativos
  ON public.projetos USING btree (user_id, status, updated_at DESC)
  WHERE NOT deleted;

CREATE INDEX idx_projetos_tarefas_ativas
  ON public.projetos_tarefas USING btree (user_id, projeto_uuid, status, ordem)
  WHERE NOT deleted;

CREATE INDEX idx_receitas_ativas
  ON public.receitas USING btree (user_id, favorito DESC, updated_at DESC)
  WHERE NOT deleted;

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.projetos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_own_data ON public.projetos_tarefas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_own_data ON public.receitas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos_tarefas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;

COMMIT;
