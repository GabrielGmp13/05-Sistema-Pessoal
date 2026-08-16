BEGIN;

-- DEC-040 definiu academica como o tipo compartilhado por Escola/ENEM.
UPDATE public.materias
SET tipo = 'academica',
    mostra_escola = CASE WHEN tipo = 'escola' THEN true ELSE mostra_escola END,
    mostra_enem = CASE WHEN tipo = 'enem' THEN true ELSE mostra_enem END,
    updated_at = now()
WHERE tipo IN ('escola', 'enem');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.materias
    WHERE tipo NOT IN ('academica', 'olimpiada', 'vestibular', 'concurso', 'curso', 'outro')
  ) THEN
    RAISE EXCEPTION 'materias.tipo possui valor fora do dominio documentado';
  END IF;
END;
$$;

ALTER TABLE public.materias
  ALTER COLUMN tipo SET DEFAULT 'academica',
  DROP CONSTRAINT IF EXISTS materias_tipo_check,
  ADD CONSTRAINT materias_tipo_check CHECK (
    tipo IN ('academica', 'olimpiada', 'vestibular', 'concurso', 'curso', 'outro')
  ),
  DROP CONSTRAINT IF EXISTS materias_user_id_fkey,
  ADD CONSTRAINT materias_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS user_own_files_exercicios ON storage.objects;
CREATE POLICY user_own_files_exercicios
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'exercicios'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'exercicios'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS redacoes_isolamento_usuario ON storage.objects;
CREATE POLICY redacoes_isolamento_usuario
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'redacoes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'redacoes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
