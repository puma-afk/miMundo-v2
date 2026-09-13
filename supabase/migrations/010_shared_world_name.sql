begin;
-- Share the chosen public name; never copy account email or authentication metadata.
create or replace function public.publish_my_visit() returns uuid
language plpgsql security definer set search_path='' as $$
declare player uuid:=auth.uid(); saved jsonb; present jsonb; result uuid;
begin
 if player is null then raise exception 'Sign in first' using errcode='42501'; end if;
 select save into saved from public.world_saves where owner_id=player;
 if saved is null then raise exception 'Save your world first'; end if;
 select payload into present from public.world_gifts where owner_id=player;
 insert into public.world_visits(owner_id,snapshot,gift) values(player,jsonb_strip_nulls(jsonb_build_object(
  'schemaVersion',1,'worldName',saved->'worldName','createdAt',saved->'createdAt','plants',coalesce(saved->'plants','{}'::jsonb),
  'memoriesRead',coalesce(saved->'memoriesRead','[]'::jsonb),'messages',saved->'messages',
  'giftProgress',saved->'giftProgress','currentIsland','garden','forestUnlocked',saved->'forestUnlocked',
  'forestRefuge',saved->'forestRefuge','forestStory',saved->'forestStory'
 )) || jsonb_build_object('plants',coalesce(saved->'plants','{}'::jsonb)),present) on conflict(owner_id) do update set snapshot=excluded.snapshot,gift=excluded.gift,active=true,updated_at=now()
 returning token into result;
 return result;
end $$;
commit;
