begin;
alter table public.world_visits add column if not exists code text unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
alter table public.world_visits add column if not exists gift jsonb;
alter table public.world_visits add column if not exists active boolean not null default true;
-- Existing links keep their old, restricted snapshot until the owner publishes again.
create or replace function public.publish_my_visit() returns uuid
language plpgsql security definer set search_path='' as $$
declare player uuid:=auth.uid(); saved jsonb; present jsonb; result uuid;
begin
 if player is null then raise exception 'Sign in first' using errcode='42501'; end if;
 select save into saved from public.world_saves where owner_id=player;
 if saved is null then raise exception 'Save your world first'; end if;
 select payload into present from public.world_gifts where owner_id=player;
 insert into public.world_visits(owner_id,snapshot,gift) values(player,jsonb_strip_nulls(jsonb_build_object(
  'schemaVersion',1,'createdAt',saved->'createdAt','plants',coalesce(saved->'plants','{}'::jsonb),
  'memoriesRead',coalesce(saved->'memoriesRead','[]'::jsonb),'messages',saved->'messages',
  'giftProgress',saved->'giftProgress','currentIsland','garden','forestUnlocked',saved->'forestUnlocked',
  'forestRefuge',saved->'forestRefuge','forestStory',saved->'forestStory'
 )) || jsonb_build_object('plants',coalesce(saved->'plants','{}'::jsonb)),present) on conflict(owner_id) do update set snapshot=excluded.snapshot,gift=excluded.gift,active=true,updated_at=now()
 returning token into result;
 return result;
end $$;
create or replace function public.get_my_visit() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('token',token,'code',code) from public.world_visits where owner_id=auth.uid() and active
$$;
create or replace function public.read_world_visit_v2(p_key text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('save',snapshot,'gift',gift,'token',token,'code',code) from public.world_visits
 where active and (token::text=lower(trim(p_key)) or code=upper(trim(p_key)))
$$;
create or replace function public.revoke_my_visit() returns void
language sql security definer set search_path='' as $$
 update public.world_visits set active=false,token=gen_random_uuid(),code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)) where owner_id=auth.uid()
$$;
create or replace function public.read_world_visit(p_token uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select snapshot from public.world_visits where active and token=p_token
$$;
create table if not exists public.visit_comments(
 id bigint generated always as identity primary key,
 owner_id uuid not null references public.world_visits(owner_id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 story_id text not null check(story_id in ('welcome','letter-home','little-light','cloud-message','your-pace','tomorrow-door')),
 nickname text not null check(length(nickname) between 1 and 40),
 body text not null check(length(body) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists visit_comments_thread on public.visit_comments(owner_id,story_id,id desc);
create index if not exists visit_comments_author_time on public.visit_comments(author_id,created_at desc);
alter table public.visit_comments enable row level security;
revoke all on public.visit_comments from anon,authenticated;
create or replace function public.read_visit_comments(p_token uuid,p_story text,p_before bigint default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(row),'[]'::jsonb) from (
 select c.id::text as id,c.nickname,c.body,c.created_at,(auth.uid()=c.author_id or auth.uid()=c.owner_id) as can_delete
 from public.visit_comments c join public.world_visits v on v.owner_id=c.owner_id
 where v.active and v.token=p_token and c.story_id=p_story and (p_before is null or c.id<p_before)
 order by c.id desc limit 30) row
$$;
create or replace function public.add_visit_comment(p_token uuid,p_story text,p_nickname text,p_body text) returns void
language plpgsql security definer set search_path='' as $$
declare player uuid:=auth.uid(); owner uuid;
begin
 if player is null then raise exception 'Sign in to comment' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(player::text,0));
 select owner_id into owner from public.world_visits where active and token=p_token for key share;
 if owner is null then raise exception 'Visit unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended('visit:'||owner::text,0));
 if exists(select 1 from public.visit_comments where author_id=player and created_at>now()-interval '15 seconds') then raise exception 'Espera 15 segundos antes de enviar otro mensaje.'; end if;
 if (select count(*) from public.visit_comments where owner_id=owner)>=500 then raise exception 'Este jardín alcanzó su límite de mensajes.'; end if;
 insert into public.visit_comments(owner_id,author_id,story_id,nickname,body) values(owner,player,p_story,trim(p_nickname),trim(p_body));
end $$;
create or replace function public.delete_visit_comment(p_token uuid,p_id bigint) returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from public.visit_comments c using public.world_visits v
 where c.id=p_id and c.owner_id=v.owner_id and v.active and v.token=p_token and (auth.uid()=c.author_id or auth.uid()=c.owner_id);
 if not found then raise exception 'Not permitted' using errcode='42501'; end if;
end $$;
revoke all on function public.get_my_visit(),public.read_world_visit_v2(text),public.read_visit_comments(uuid,text,bigint),public.add_visit_comment(uuid,text,text,text),public.delete_visit_comment(uuid,bigint) from public;
grant execute on function public.get_my_visit(),public.add_visit_comment(uuid,text,text,text),public.delete_visit_comment(uuid,bigint) to authenticated;
grant execute on function public.read_world_visit_v2(text),public.read_visit_comments(uuid,text,bigint) to anon,authenticated;
commit;
