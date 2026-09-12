begin;
create table if not exists public.world_visits (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 token uuid not null unique default gen_random_uuid(),
 snapshot jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.world_visits enable row level security;
revoke all on public.world_visits from anon, authenticated;

-- Only an explicitly assigned gift owner may publish. Public data is built here,
-- never trusted from the browser: no messages, gift payload, response or identity.
create or replace function public.publish_my_visit() returns uuid
language plpgsql security definer set search_path = '' as $$
declare player uuid := auth.uid(); saved jsonb; result uuid;
begin
 if player is null or not exists(select 1 from public.world_gifts where owner_id=player) then raise exception 'Private gift owner required' using errcode='42501'; end if;
 select save into saved from public.world_saves where owner_id=player;
 if saved is null then raise exception 'Save your world first'; end if;
 insert into public.world_visits(owner_id,snapshot) values(player,jsonb_build_object(
  'schemaVersion',1,'plants',coalesce((select jsonb_object_agg(key,jsonb_build_object('id',value->>'id','definitionId',value->>'definitionId','plantedAt',(value->>'plantedAt')::numeric,'wateredAt',(value->>'wateredAt')::numeric)) from jsonb_each(coalesce(saved->'plants','{}'::jsonb))),'{}'::jsonb),'memoriesRead','[]'::jsonb,'currentIsland','garden'
 )) on conflict(owner_id) do update set snapshot=excluded.snapshot,updated_at=now()
 returning token into result;
 return result;
end $$;
create or replace function public.read_world_visit(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select snapshot from public.world_visits where token=p_token
$$;
create or replace function public.revoke_my_visit() returns void
language sql security definer set search_path = '' as $$
 delete from public.world_visits where owner_id=auth.uid()
$$;
revoke all on function public.publish_my_visit(),public.read_world_visit(uuid),public.revoke_my_visit() from public;
grant execute on function public.publish_my_visit(),public.revoke_my_visit() to authenticated;
grant execute on function public.read_world_visit(uuid) to anon,authenticated;
commit;
