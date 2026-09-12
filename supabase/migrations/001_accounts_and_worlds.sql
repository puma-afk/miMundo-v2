-- Execute in the Supabase SQL Editor for this project. Safe to rerun for this schema.
begin;

create table if not exists public.world_saves (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  world_id uuid not null default gen_random_uuid() unique,
  save jsonb not null,
  revision bigint not null check (revision > 0),
  last_operation_id uuid not null,
  updated_at timestamptz not null default now(),
  constraint world_payload_size check (octet_length(save::text) <= 131072)
);
create table if not exists public.world_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  save jsonb not null,
  revision bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists world_snapshots_owner_created on public.world_snapshots(owner_id, created_at desc);
alter table public.world_saves enable row level security;
alter table public.world_snapshots enable row level security;
revoke all on public.world_saves, public.world_snapshots from anon, authenticated;
grant select on public.world_saves, public.world_snapshots to authenticated;
drop policy if exists read_own_world on public.world_saves;
create policy read_own_world on public.world_saves for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists read_own_snapshots on public.world_snapshots;
create policy read_own_snapshots on public.world_snapshots for select to authenticated using ((select auth.uid()) = owner_id);

-- Clients cannot INSERT/UPDATE tables directly, forge a revision, or save another owner's world.
create or replace function public.save_my_world(p_owner_id uuid, p_save jsonb, p_expected_revision bigint, p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  current_world public.world_saves%rowtype;
  result public.world_saves%rowtype;
begin
  if account_id is null or p_owner_id is distinct from account_id then
    raise exception 'Authentication required for this owner' using errcode = '42501';
  end if;
  if p_operation_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid operation' using errcode = '22023';
  end if;
  if (jsonb_typeof(p_save) = 'object'
      and p_save->'schemaVersion' = '1'::jsonb
      and jsonb_typeof(p_save->'plants') = 'object'
      and jsonb_typeof(p_save->'memoriesRead') = 'array'
      and octet_length(p_save::text) <= 131072) is not true then
    raise exception 'Invalid save payload' using errcode = '22023';
  end if;

  -- Serialize creation as well as updates for one owner; different accounts are independent.
  perform pg_advisory_xact_lock(hashtextextended(account_id::text, 0));
  select * into current_world from public.world_saves where owner_id = account_id for update;
  if found then
    if current_world.last_operation_id = p_operation_id then
      if current_world.save is distinct from p_save then
        raise exception 'Operation ID reused with a different save' using errcode = '22023';
      end if;
      return to_jsonb(current_world);
    end if;
    if current_world.revision <> p_expected_revision then
      raise exception 'World changed on another device' using errcode = '40001';
    end if;
    -- A recovery point on changes, at most every 30 minutes. Not an external backup.
    if not exists (select 1 from public.world_snapshots where owner_id = account_id and created_at > now() - interval '30 minutes') then
      insert into public.world_snapshots(owner_id, save, revision) values(account_id, current_world.save, current_world.revision);
      delete from public.world_snapshots where owner_id = account_id and id not in
        (select id from public.world_snapshots where owner_id = account_id order by created_at desc, id desc limit 10);
    end if;
    update public.world_saves set save = p_save, revision = revision + 1, last_operation_id = p_operation_id, updated_at = now()
      where owner_id = account_id returning * into result;
  else
    if p_expected_revision <> 0 then
      raise exception 'Expected world no longer exists' using errcode = '40001';
    end if;
    insert into public.world_saves(owner_id, save, revision, last_operation_id)
      values(account_id, p_save, 1, p_operation_id) returning * into result;
  end if;
  return to_jsonb(result);
end;
$$;
revoke all on function public.save_my_world(uuid, jsonb, bigint, uuid) from public, anon;
grant execute on function public.save_my_world(uuid, jsonb, bigint, uuid) to authenticated;
commit;
