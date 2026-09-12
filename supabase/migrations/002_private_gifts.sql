begin;
create table if not exists public.world_gifts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 32768),
  updated_at timestamptz not null default now()
);
alter table public.world_gifts enable row level security;
revoke all on public.world_gifts from anon, authenticated;
grant select on public.world_gifts to authenticated;
drop policy if exists read_own_gift on public.world_gifts;
create policy read_own_gift on public.world_gifts for select to authenticated using ((select auth.uid()) = owner_id);
-- Assign gifts only through the Dashboard/admin connection. Clients cannot give themselves a gift.
commit;
