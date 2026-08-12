BEGIN;

ALTER TABLE public.conteudos
  ADD COLUMN video_uuid text,
  ADD CONSTRAINT conteudos_video_uuid_fkey
    FOREIGN KEY (video_uuid) REFERENCES public.videos(uuid);

CREATE INDEX idx_conteudos_video_ativos
  ON public.conteudos USING btree (video_uuid)
  WHERE NOT deleted AND video_uuid IS NOT NULL;

COMMIT;
