BEGIN;

CREATE TABLE public.saude_sono (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  horas_dormidas numeric(4,2) NOT NULL,
  horario_dormir time without time zone,
  horario_acordar time without time zone,
  qualidade smallint NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT saude_sono_horas_check CHECK (horas_dormidas > 0 AND horas_dormidas <= 24),
  CONSTRAINT saude_sono_qualidade_check CHECK (qualidade BETWEEN 1 AND 5)
);

CREATE TABLE public.saude_hidratacao (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  copos integer NOT NULL DEFAULT 0,
  meta_copos integer NOT NULL DEFAULT 8,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT saude_hidratacao_copos_check CHECK (copos >= 0),
  CONSTRAINT saude_hidratacao_meta_check CHECK (meta_copos > 0)
);

CREATE TABLE public.saude_humor (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  humor smallint NOT NULL,
  energia smallint NOT NULL,
  observacoes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT saude_humor_humor_check CHECK (humor BETWEEN 1 AND 5),
  CONSTRAINT saude_humor_energia_check CHECK (energia BETWEEN 1 AND 5)
);

CREATE TABLE public.saude_medicamentos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  dosagem text,
  horario time without time zone,
  ativo boolean NOT NULL DEFAULT true,
  estoque integer,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT saude_medicamentos_nome_check CHECK (btrim(nome) <> ''),
  CONSTRAINT saude_medicamentos_estoque_check CHECK (estoque IS NULL OR estoque >= 0)
);

CREATE TABLE public.saude_medicamentos_registros (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicamento_uuid text NOT NULL REFERENCES public.saude_medicamentos(uuid),
  data date NOT NULL,
  tomado boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.financas_categorias (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL,
  cor text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT financas_categorias_nome_check CHECK (btrim(nome) <> ''),
  CONSTRAINT financas_categorias_tipo_check CHECK (tipo IN ('entrada', 'saida'))
);

CREATE TABLE public.financas_lancamentos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_uuid text NOT NULL REFERENCES public.financas_categorias(uuid),
  tipo text NOT NULL,
  valor numeric(12,2) NOT NULL,
  data date NOT NULL,
  descricao text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT financas_lancamentos_tipo_check CHECK (tipo IN ('entrada', 'saida')),
  CONSTRAINT financas_lancamentos_valor_check CHECK (valor > 0)
);

CREATE TABLE public.financas_orcamentos (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_uuid text NOT NULL REFERENCES public.financas_categorias(uuid),
  mes smallint NOT NULL,
  ano integer NOT NULL,
  valor_limite numeric(12,2) NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT financas_orcamentos_mes_check CHECK (mes BETWEEN 1 AND 12),
  CONSTRAINT financas_orcamentos_ano_check CHECK (ano BETWEEN 2000 AND 2100),
  CONSTRAINT financas_orcamentos_valor_check CHECK (valor_limite > 0)
);

CREATE TABLE public.financas_metas_economia (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  valor_alvo numeric(12,2) NOT NULL,
  valor_atual numeric(12,2) NOT NULL DEFAULT 0,
  data_alvo date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT financas_metas_titulo_check CHECK (btrim(titulo) <> ''),
  CONSTRAINT financas_metas_alvo_check CHECK (valor_alvo > 0),
  CONSTRAINT financas_metas_atual_check CHECK (valor_atual >= 0)
);

CREATE TABLE public.lugares (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text,
  cidade text,
  pais text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  data_inicio date,
  data_fim date,
  custo numeric(12,2),
  nota numeric(3,1),
  favorito boolean NOT NULL DEFAULT false,
  texto text,
  capa_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT lugares_nome_check CHECK (btrim(nome) <> ''),
  CONSTRAINT lugares_latitude_check CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT lugares_longitude_check CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT lugares_datas_check CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio),
  CONSTRAINT lugares_custo_check CHECK (custo IS NULL OR custo >= 0),
  CONSTRAINT lugares_nota_check CHECK (nota IS NULL OR nota BETWEEN 0 AND 10)
);

CREATE UNIQUE INDEX idx_saude_sono_data_ativa
  ON public.saude_sono (user_id, data) WHERE NOT deleted;
CREATE UNIQUE INDEX idx_saude_hidratacao_data_ativa
  ON public.saude_hidratacao (user_id, data) WHERE NOT deleted;
CREATE UNIQUE INDEX idx_saude_humor_data_ativa
  ON public.saude_humor (user_id, data) WHERE NOT deleted;
CREATE INDEX idx_saude_medicamentos_ativos
  ON public.saude_medicamentos (user_id, ativo, horario) WHERE NOT deleted;
CREATE UNIQUE INDEX idx_saude_medicamentos_registros_data_ativa
  ON public.saude_medicamentos_registros (user_id, medicamento_uuid, data) WHERE NOT deleted;
CREATE INDEX idx_financas_categorias_ativas
  ON public.financas_categorias (user_id, tipo, nome) WHERE NOT deleted;
CREATE INDEX idx_financas_lancamentos_ativos
  ON public.financas_lancamentos (user_id, data DESC, tipo) WHERE NOT deleted;
CREATE UNIQUE INDEX idx_financas_orcamentos_periodo_ativo
  ON public.financas_orcamentos (user_id, categoria_uuid, ano, mes) WHERE NOT deleted;
CREATE INDEX idx_financas_metas_ativas
  ON public.financas_metas_economia (user_id, data_alvo, updated_at DESC) WHERE NOT deleted;
CREATE INDEX idx_lugares_ativos
  ON public.lugares (user_id, favorito DESC, updated_at DESC) WHERE NOT deleted;

ALTER TABLE public.saude_sono ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_hidratacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_humor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_medicamentos_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financas_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financas_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financas_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financas_metas_economia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lugares ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.saude_sono FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.saude_hidratacao FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.saude_humor FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.saude_medicamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.saude_medicamentos_registros FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.financas_categorias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.financas_lancamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.financas_orcamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.financas_metas_economia FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_own_data ON public.lugares FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saude_sono TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saude_hidratacao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saude_humor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saude_medicamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saude_medicamentos_registros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_lancamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_orcamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_metas_economia TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lugares TO authenticated;

COMMIT;
