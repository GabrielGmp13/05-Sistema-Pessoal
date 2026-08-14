begin;

create temp table test_assertions (
  description text not null,
  passed boolean not null
);

insert into test_assertions (description, passed)
select
  format('%s.nota usa numeric(2,1)', table_name),
  data_type = 'numeric' and numeric_precision = 2 and numeric_scale = 1
from information_schema.columns
where table_schema = 'public'
  and table_name = any (array['filmes', 'series', 'animes', 'mangas', 'livros', 'podcasts', 'videos'])
  and column_name = 'nota';

insert into test_assertions (description, passed)
select 'as sete tabelas possuem a coluna nota esperada', count(*) = 7
from information_schema.columns
where table_schema = 'public'
  and table_name = any (array['filmes', 'series', 'animes', 'mangas', 'livros', 'podcasts', 'videos'])
  and column_name = 'nota';

insert into test_assertions (description, passed)
select
  format('%s rejeita notas fora de 0-5 e passos diferentes de 0.5', c.relname),
  pg_get_constraintdef(pc.oid) ilike '%nota >=%0%'
    and pg_get_constraintdef(pc.oid) ilike '%nota <=%5%'
    and pg_get_constraintdef(pc.oid) ilike '%trunc%'
from pg_constraint pc
join pg_class c on c.oid = pc.conrelid
where conrelid = any (
  array[
    'public.filmes'::regclass,
    'public.series'::regclass,
    'public.animes'::regclass,
    'public.mangas'::regclass,
    'public.livros'::regclass,
    'public.podcasts'::regclass,
    'public.videos'::regclass
  ]
)
and conname = any (
  array[
    'filmes_nota_range',
    'series_nota_range',
    'animes_nota_range',
    'mangas_nota_range',
    'livros_nota_range',
    'podcasts_nota_range',
    'videos_nota_check'
  ]
);

insert into test_assertions (description, passed)
select 'as sete constraints de nota existem', count(*) = 7
from pg_constraint
where conrelid = any (
  array[
    'public.filmes'::regclass,
    'public.series'::regclass,
    'public.animes'::regclass,
    'public.mangas'::regclass,
    'public.livros'::regclass,
    'public.podcasts'::regclass,
    'public.videos'::regclass
  ]
)
and conname = any (
  array[
    'filmes_nota_range',
    'series_nota_range',
    'animes_nota_range',
    'mangas_nota_range',
    'livros_nota_range',
    'podcasts_nota_range',
    'videos_nota_check'
  ]
);

insert into test_assertions (description, passed) values
  ('0 permanece 0', round((0::numeric / 2.0) * 2.0) / 2.0 = 0),
  ('1 vira 0.5', round((1::numeric / 2.0) * 2.0) / 2.0 = 0.5),
  ('8.6 vira 4.5', round((8.6::numeric / 2.0) * 2.0) / 2.0 = 4.5),
  ('10 vira 5', round((10::numeric / 2.0) * 2.0) / 2.0 = 5);

do $$
declare
  failed text;
begin
  select string_agg(description, E'\n')
    into failed
  from test_assertions
  where not passed;

  if failed is not null then
    raise exception 'Falhas na validacao da nota da Biblioteca:%', E'\n' || failed;
  end if;
end;
$$;

select description, passed from test_assertions order by description;

rollback;
