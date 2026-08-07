-- 20260807000300_baseline_storage.sql
-- Baseline dos buckets e policies de Storage pertencentes à aplicação.
--
-- Fonte factual:
--   snapshots/2026-08-07-production/critical_storage_metadata.json
--   SHA-256 df6afc19ec0ae181a5239a4a2794dec8b7b2e85fccea3e957fd31f2ff70d3370
--
-- Não inclui timestamps, owner, arquivos ou linhas de storage.objects.
-- As policies são reproduzidas sem hardening, inclusive TO public e
-- WITH CHECK ausente onde esse é o estado remoto capturado.

BEGIN;

INSERT INTO "storage"."buckets" (
  "id",
  "name",
  "public",
  "file_size_limit",
  "allowed_mime_types",
  "avif_autodetection",
  "type"
)
VALUES
  ('capas', 'capas', false, 3145728, NULL, false, 'STANDARD'),
  (
    'documentos',
    'documentos',
    false,
    52428800,
    ARRAY[
      'application/pdf',
      'application/epub+zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/json'
    ],
    false,
    'STANDARD'
  ),
  (
    'exercicios',
    'exercicios',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    false,
    'STANDARD'
  ),
  ('redacoes', 'redacoes', false, 10485760, NULL, false, 'STANDARD'),
  (
    'shape',
    'shape',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp'],
    false,
    'STANDARD'
  );

CREATE POLICY "capas_delete"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((bucket_id = 'capas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "capas_insert"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'capas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "capas_select"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'capas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "capas_update"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((bucket_id = 'capas'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "docs_delete"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((bucket_id = 'documentos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "docs_insert"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'documentos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "docs_select"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'documentos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "docs_update"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((bucket_id = 'documentos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "redacoes_isolamento_usuario"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((bucket_id = 'redacoes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
  WITH CHECK ((bucket_id = 'redacoes'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "shape_delete"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((bucket_id = 'shape'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "shape_insert"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'shape'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "shape_select"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'shape'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "shape_update"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((bucket_id = 'shape'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

CREATE POLICY "user_own_files_exercicios"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((bucket_id = 'exercicios'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

COMMIT;
