-- Capas privadas para as oito categorias da Biblioteca e MIME types explícitos.
ALTER TABLE public.videos
  ADD COLUMN capa_path text;

ALTER TABLE public.artigos
  ADD COLUMN capa_url text,
  ADD COLUMN capa_path text;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'capas';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artigos TO authenticated;
