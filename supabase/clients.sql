-- Cadastro de clientes e vinculo com reservas.
-- Rode este arquivo no Supabase SQL Editor antes de publicar o codigo.

create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  email text,
  observacoes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create unique index if not exists clientes_telefone_normalizado_unique
on public.clientes (telefone_normalizado);

alter table public.reservas
add column if not exists cliente_id bigint references public.clientes(id) on delete set null;

insert into public.clientes (nome, telefone, telefone_normalizado, email)
select distinct on (regexp_replace(cliente_telefone, '\D', '', 'g'))
  cliente_nome,
  cliente_telefone,
  regexp_replace(cliente_telefone, '\D', '', 'g') as telefone_normalizado,
  nullif(cliente_email, '') as email
from public.reservas
where cliente_telefone is not null
  and regexp_replace(cliente_telefone, '\D', '', 'g') <> ''
order by regexp_replace(cliente_telefone, '\D', '', 'g'), created_at desc
on conflict (telefone_normalizado) do update
set
  nome = excluded.nome,
  telefone = excluded.telefone,
  email = coalesce(excluded.email, public.clientes.email),
  updated_at = timezone('utc'::text, now());

update public.reservas r
set cliente_id = c.id
from public.clientes c
where r.cliente_id is null
  and regexp_replace(r.cliente_telefone, '\D', '', 'g') = c.telefone_normalizado;

alter table public.clientes disable row level security;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.clientes
to anon, authenticated;

grant usage, select
on all sequences in schema public
to anon, authenticated;

drop policy if exists "Permitir leitura clientes" on public.clientes;
drop policy if exists "Permitir inserir clientes" on public.clientes;
drop policy if exists "Permitir atualizar clientes" on public.clientes;
drop policy if exists "Permitir deletar clientes" on public.clientes;

create policy "Permitir leitura clientes"
on public.clientes
for select
to anon, authenticated
using (true);

create policy "Permitir inserir clientes"
on public.clientes
for insert
to anon, authenticated
with check (true);

create policy "Permitir atualizar clientes"
on public.clientes
for update
to anon, authenticated
using (true)
with check (true);

create policy "Permitir deletar clientes"
on public.clientes
for delete
to anon, authenticated
using (true);
