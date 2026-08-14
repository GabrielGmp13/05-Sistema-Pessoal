begin;

alter table public.filmes drop constraint if exists filmes_nota_range;
alter table public.series drop constraint if exists series_nota_range;
alter table public.animes drop constraint if exists animes_nota_range;
alter table public.mangas drop constraint if exists mangas_nota_range;
alter table public.livros drop constraint if exists livros_nota_range;
alter table public.podcasts drop constraint if exists podcasts_nota_range;
alter table public.videos drop constraint if exists videos_nota_check;

-- Converte a escala 0-10 para 0-5 e aproxima para o meio ponto mais próximo.
update public.filmes set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.series set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.animes set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.mangas set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.livros set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.podcasts set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;
update public.videos set nota = round((nota / 2.0) * 2.0) / 2.0 where nota is not null;

alter table public.filmes alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.series alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.animes alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.mangas alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.livros alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.podcasts alter column nota type numeric(2,1) using nota::numeric(2,1);
alter table public.videos alter column nota type numeric(2,1) using nota::numeric(2,1);

alter table public.filmes add constraint filmes_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.series add constraint series_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.animes add constraint animes_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.mangas add constraint mangas_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.livros add constraint livros_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.podcasts add constraint podcasts_nota_range
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));
alter table public.videos add constraint videos_nota_check
  check (nota is null or (nota between 0 and 5 and nota * 2 = trunc(nota * 2)));

grant select, insert, update, delete on public.filmes to authenticated;
grant select, insert, update, delete on public.series to authenticated;
grant select, insert, update, delete on public.animes to authenticated;
grant select, insert, update, delete on public.mangas to authenticated;
grant select, insert, update, delete on public.livros to authenticated;
grant select, insert, update, delete on public.podcasts to authenticated;
grant select, insert, update, delete on public.videos to authenticated;

commit;
