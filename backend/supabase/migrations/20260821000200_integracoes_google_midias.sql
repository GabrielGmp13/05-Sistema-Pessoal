-- Base server-only de OAuth Google, idempotência Calendar e uploads restantes.
-- Incremental: não altera baselines aplicadas nem remove dados existentes.

CREATE TABLE public.integracoes_google (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credenciais_cifradas text NOT NULL,
  token_expira_em timestamptz,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  email_google text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integracoes_google ENABLE ROW LEVEL SECURITY;

-- GRANT explícito segue a convenção do projeto. A ausência intencional de
-- policies mantém todo acesso via Data API bloqueado para authenticated;
-- somente o service role das API Routes pode operar esta tabela.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integracoes_google TO authenticated;

ALTER TABLE public.agenda
  ADD COLUMN google_calendar_event_id text,
  ADD COLUMN google_calendar_synced_at timestamptz;

CREATE UNIQUE INDEX agenda_google_calendar_event_id_unique
  ON public.agenda (user_id, google_calendar_event_id)
  WHERE google_calendar_event_id IS NOT NULL;

ALTER TABLE public.receitas ADD COLUMN foto_path text;
ALTER TABLE public.lugares ADD COLUMN capa_path text;
ALTER TABLE public.provas ADD COLUMN arquivo_path text;
ALTER TABLE public.simulados ADD COLUMN arquivo_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'midias-pessoais',
  'midias-pessoais',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "midias_pessoais_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'midias-pessoais'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "midias_pessoais_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'midias-pessoais'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "midias_pessoais_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'midias-pessoais'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'midias-pessoais'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "midias_pessoais_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'midias-pessoais'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
