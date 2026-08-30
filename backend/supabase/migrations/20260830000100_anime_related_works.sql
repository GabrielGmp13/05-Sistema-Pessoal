-- Obras relacionadas da AniList preservam identidade e metadados próprios,
-- embora temporadas continuem agrupadas no card do anime principal.

ALTER TABLE public.animes
  ADD COLUMN ano_obra_inicio INTEGER,
  ADD COLUMN ano_obra_fim INTEGER,
  ADD COLUMN duracao_obra_minutos INTEGER;

ALTER TABLE public.animes_temporadas
  ADD COLUMN nome_original TEXT,
  ADD COLUMN nome_traduzido TEXT,
  ADD COLUMN capa_url TEXT,
  ADD COLUMN sinopse TEXT,
  ADD COLUMN ano_lancamento INTEGER,
  ADD COLUMN ano_termino INTEGER,
  ADD COLUMN duracao_minutos INTEGER,
  ADD COLUMN anilist_id TEXT,
  ADD COLUMN mal_id TEXT,
  ADD COLUMN link_anilist TEXT,
  ADD COLUMN link_mal TEXT,
  ADD COLUMN formato TEXT,
  ADD COLUMN tipo_relacao TEXT,
  ADD COLUMN diretor TEXT,
  ADD COLUMN roteirista TEXT,
  ADD COLUMN produtores TEXT,
  ADD COLUMN estudio TEXT,
  ADD COLUMN character_designer TEXT,
  ADD COLUMN animador_chefe TEXT,
  ADD COLUMN compositor TEXT;

CREATE UNIQUE INDEX idx_animes_temporadas_anilist
  ON public.animes_temporadas (anime_uuid, anilist_id)
  WHERE NOT deleted AND anilist_id IS NOT NULL;

ALTER TABLE public.filmes
  ADD COLUMN titulo_original TEXT,
  ADD COLUMN sinopse TEXT,
  ADD COLUMN anilist_id TEXT,
  ADD COLUMN mal_id TEXT;

CREATE UNIQUE INDEX idx_filmes_complementos_anilist
  ON public.filmes (anime_uuid, anilist_id)
  WHERE NOT deleted AND anime_uuid IS NOT NULL AND anilist_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.animes_temporadas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filmes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animes TO authenticated;
