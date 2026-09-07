-- Chamados de suporte autenticados, histórico auditável e prints privados.
CREATE TABLE public.chamados_suporte (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocolo text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('bug', 'sugestao')),
  titulo text NOT NULL CHECK (char_length(titulo) BETWEEN 5 AND 120),
  modulo text,
  descricao text NOT NULL CHECK (char_length(descricao) BETWEEN 10 AND 4000),
  esperado text CHECK (esperado IS NULL OR char_length(esperado) <= 2000),
  passos text CHECK (passos IS NULL OR char_length(passos) <= 2000),
  ambiente text CHECK (ambiente IS NULL OR char_length(ambiente) <= 300),
  tema text CHECK (tema IS NULL OR char_length(tema) <= 50),
  versao text CHECK (versao IS NULL OR char_length(versao) <= 30),
  status text NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'em_analise', 'resolvido', 'fechado')),
  resposta text CHECK (resposta IS NULL OR char_length(resposta) <= 4000),
  respondido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.chamados_suporte_historico (
  uuid text PRIMARY KEY,
  chamado_suporte_uuid text NOT NULL REFERENCES public.chamados_suporte(uuid) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('recebido', 'em_analise', 'resolvido', 'fechado')),
  mensagem text CHECK (mensagem IS NULL OR char_length(mensagem) <= 4000),
  origem text NOT NULL CHECK (origem IN ('sistema', 'administracao')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.chamados_suporte_anexos (
  uuid text PRIMARY KEY,
  chamado_suporte_uuid text NOT NULL REFERENCES public.chamados_suporte(uuid) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  nome_original text NOT NULL CHECK (char_length(nome_original) BETWEEN 1 AND 180),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  tamanho_bytes integer NOT NULL CHECK (tamanho_bytes BETWEEN 1 AND 2097152),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false
);

CREATE INDEX chamados_suporte_usuario_data_idx
  ON public.chamados_suporte (user_id, created_at DESC) WHERE deleted = false;
CREATE INDEX chamados_suporte_historico_chamado_idx
  ON public.chamados_suporte_historico (chamado_suporte_uuid, created_at);
CREATE INDEX chamados_suporte_anexos_chamado_idx
  ON public.chamados_suporte_anexos (chamado_suporte_uuid, created_at);

CREATE OR REPLACE FUNCTION public.registrar_historico_chamado_suporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.resposta IS DISTINCT FROM OLD.resposta THEN
    INSERT INTO public.chamados_suporte_historico (
      uuid, chamado_suporte_uuid, user_id, status, mensagem, origem
    ) VALUES (
      gen_random_uuid()::text, NEW.uuid, NEW.user_id, NEW.status,
      CASE WHEN NEW.resposta IS DISTINCT FROM OLD.resposta THEN NEW.resposta ELSE NULL END,
      'administracao'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chamados_suporte_registrar_historico
BEFORE UPDATE ON public.chamados_suporte
FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_chamado_suporte();

ALTER TABLE public.chamados_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_suporte_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_suporte_anexos ENABLE ROW LEVEL SECURITY;

-- Usuários podem apenas ler seus próprios chamados. Criação e mudanças passam
-- pela API autenticada com service_role, impedindo alteração de status/resposta.
CREATE POLICY chamados_suporte_select_proprio ON public.chamados_suporte
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY chamados_suporte_historico_select_proprio ON public.chamados_suporte_historico
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY chamados_suporte_anexos_select_proprio ON public.chamados_suporte_anexos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'suporte-anexos', 'suporte-anexos', false, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Nenhuma policy em storage.objects: anexos passam somente pela API server-side.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte_historico TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte_anexos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte_historico TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados_suporte_anexos TO service_role;
REVOKE ALL ON FUNCTION public.registrar_historico_chamado_suporte() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_historico_chamado_suporte() TO service_role;
