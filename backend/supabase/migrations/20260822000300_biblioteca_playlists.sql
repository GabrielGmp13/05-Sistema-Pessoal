-- Playlists são agrupamentos da Biblioteca; vídeos continuam entidades próprias.

CREATE TABLE public.videos_playlists (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_playlist_id text NOT NULL,
  nome text NOT NULL,
  origem text NOT NULL DEFAULT 'youtube_link',
  origem_url text NOT NULL,
  importada_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT videos_playlists_youtube_id_check
    CHECK (youtube_playlist_id ~ '^[A-Za-z0-9_-]{10,100}$'),
  CONSTRAINT videos_playlists_origem_check
    CHECK (origem IN ('youtube_conta', 'youtube_link')),
  CONSTRAINT videos_playlists_user_youtube_unique
    UNIQUE (user_id, youtube_playlist_id),
  CONSTRAINT videos_playlists_user_uuid_unique
    UNIQUE (user_id, uuid)
);

-- Permite que o vínculo abaixo confirme também a posse do vídeo, não apenas
-- a existência de um UUID globalmente único.
ALTER TABLE public.videos
  ADD CONSTRAINT videos_user_uuid_unique UNIQUE (user_id, uuid);

CREATE TABLE public.videos_playlist_itens (
  uuid text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_uuid text NOT NULL,
  video_uuid text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT videos_playlist_itens_ordem_check CHECK (ordem >= 0),
  CONSTRAINT videos_playlist_itens_playlist_owner_fkey
    FOREIGN KEY (user_id, playlist_uuid)
    REFERENCES public.videos_playlists(user_id, uuid) ON DELETE CASCADE,
  CONSTRAINT videos_playlist_itens_video_owner_fkey
    FOREIGN KEY (user_id, video_uuid)
    REFERENCES public.videos(user_id, uuid) ON DELETE CASCADE,
  CONSTRAINT videos_playlist_itens_playlist_video_unique
    UNIQUE (playlist_uuid, video_uuid)
);

CREATE INDEX idx_videos_playlists_user_updated
  ON public.videos_playlists (user_id, updated_at DESC)
  WHERE NOT deleted;

CREATE INDEX idx_videos_playlist_itens_playlist_ordem
  ON public.videos_playlist_itens (playlist_uuid, ordem)
  WHERE NOT deleted;

ALTER TABLE public.videos_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos_playlist_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_data ON public.videos_playlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_own_data ON public.videos_playlist_itens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos_playlists TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos_playlist_itens TO authenticated, service_role;

COMMENT ON TABLE public.videos_playlists IS
  'Playlists do YouTube importadas para organizar vídeos da Biblioteca.';
COMMENT ON TABLE public.videos_playlist_itens IS
  'Vínculo entre playlist importada e vídeo persistido na Biblioteca.';
