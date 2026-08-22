BEGIN;

CREATE OR REPLACE FUNCTION public.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT condition THEN RAISE EXCEPTION 'ASSERTION FAILED: %', message; END IF;
END;
$$;

SELECT public.assert_true(
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'capa_path' AND data_type = 'text'),
  'videos.capa_path deve existir'
);

SELECT public.assert_true(
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'artigos' AND column_name IN ('capa_url', 'capa_path')) = 2,
  'artigos deve ter capa_url e capa_path'
);

SELECT public.assert_true(
  (SELECT allowed_mime_types FROM storage.buckets WHERE id = 'capas') = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
  'bucket capas deve aceitar apenas JPG, PNG e WebP'
);

SELECT public.assert_true(
  (SELECT file_size_limit FROM storage.buckets WHERE id = 'capas') = 3145728,
  'bucket capas deve manter limite de 3 MB'
);

ROLLBACK;
