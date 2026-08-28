-- Fecha fluxos levantados na homologacao sem alterar as fontes de verdade
-- existentes: tentativas ENEM, flashcards academicos, planejamento semanal e
-- identificacao interna de resultados do Google Places.

ALTER TABLE public.revisao_espacada
  ADD COLUMN materia_uuid TEXT REFERENCES public.materias(uuid) ON DELETE SET NULL,
  ADD COLUMN conteudo_uuid TEXT REFERENCES public.conteudos(uuid) ON DELETE SET NULL;

CREATE INDEX idx_revisao_espacada_materia_ativa
  ON public.revisao_espacada (user_id, materia_uuid, proxima_revisao)
  WHERE NOT deleted AND NOT arquivado AND materia_uuid IS NOT NULL;

CREATE INDEX idx_revisao_espacada_conteudo_ativo
  ON public.revisao_espacada (user_id, conteudo_uuid, proxima_revisao)
  WHERE NOT deleted AND NOT arquivado AND conteudo_uuid IS NOT NULL;

ALTER TABLE public.lugares
  ADD COLUMN endereco TEXT,
  ADD COLUMN google_place_id TEXT;

CREATE TABLE public.provas_tentativas (
  uuid TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prova_uuid TEXT NOT NULL REFERENCES public.provas(uuid) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero > 0),
  resultado JSONB NOT NULL CHECK (jsonb_typeof(resultado) = 'object'),
  finalizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, prova_uuid, numero)
);

ALTER TABLE public.provas_tentativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.provas_tentativas
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provas_tentativas TO authenticated;

CREATE INDEX idx_provas_tentativas_prova_ativas
  ON public.provas_tentativas (user_id, prova_uuid, numero DESC)
  WHERE NOT deleted;

CREATE TABLE public.treinos_planejamento_semanal (
  uuid TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treino_uuid TEXT NOT NULL REFERENCES public.treinos(uuid) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.treinos_planejamento_semanal ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_data ON public.treinos_planejamento_semanal
  FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos_planejamento_semanal TO authenticated;

CREATE UNIQUE INDEX idx_treinos_planejamento_usuario_dia_ativo
  ON public.treinos_planejamento_semanal (user_id, dia_semana)
  WHERE NOT deleted;

CREATE INDEX idx_treinos_planejamento_treino_ativo
  ON public.treinos_planejamento_semanal (user_id, treino_uuid)
  WHERE NOT deleted;
