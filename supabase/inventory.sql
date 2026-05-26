-- Controle de estoque por itens globais e vinculo com kits.
-- Rode este arquivo no Supabase SQL Editor antes de publicar o codigo
-- que depende das tabelas estoque_itens e kit_itens.

create table if not exists public.estoque_itens (
  id bigint generated always as identity primary key,
  nome text not null,
  quantidade_total integer not null default 1 check (quantidade_total >= 0),
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create unique index if not exists estoque_itens_nome_unique
on public.estoque_itens (lower(nome));

create table if not exists public.kit_itens (
  id bigint generated always as identity primary key,
  kit_id bigint not null references public.kits(id) on delete cascade,
  item_id bigint not null references public.estoque_itens(id) on delete cascade,
  quantidade integer not null default 1 check (quantidade > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (kit_id, item_id)
);

create table if not exists public.reserva_itens (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas(id) on delete cascade,
  kit_id bigint references public.kits(id) on delete set null,
  item_id bigint not null references public.estoque_itens(id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique (reserva_id, item_id)
);

-- Migracao inicial opcional a partir da tabela antiga "itens".
-- Ela cria um item global para cada nome ja cadastrado e vincula aos kits.
insert into public.estoque_itens (nome, quantidade_total, descricao, ativo)
select
  trim(nome) as nome,
  greatest(max(coalesce(quantidade, 1)), 1) as quantidade_total,
  max(descricao) as descricao,
  bool_or(coalesce(ativo, true)) as ativo
from public.itens
where nome is not null and trim(nome) <> ''
group by trim(nome)
on conflict do nothing;

insert into public.kit_itens (kit_id, item_id, quantidade)
select
  i.kit_id,
  ei.id,
  greatest(coalesce(i.quantidade, 1), 1) as quantidade
from public.itens i
join public.estoque_itens ei on lower(ei.nome) = lower(trim(i.nome))
where i.kit_id is not null
on conflict (kit_id, item_id) do update
set quantidade = excluded.quantidade;

-- Cria snapshot dos itens para reservas ja existentes.
insert into public.reserva_itens (reserva_id, kit_id, item_id, quantidade)
select
  r.id,
  r.kit_id,
  ki.item_id,
  ki.quantidade
from public.reservas r
join public.kit_itens ki on ki.kit_id = r.kit_id
where r.kit_id is not null
on conflict (reserva_id, item_id) do nothing;

alter table public.estoque_itens disable row level security;
alter table public.kit_itens disable row level security;
alter table public.reserva_itens disable row level security;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.estoque_itens
to anon, authenticated;

grant select, insert, update, delete
on table public.kit_itens
to anon, authenticated;

grant select, insert, update, delete
on table public.reserva_itens
to anon, authenticated;

grant usage, select
on all sequences in schema public
to anon, authenticated;
