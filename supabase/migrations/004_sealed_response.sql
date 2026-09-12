begin;
-- A saved answer cannot be replaced by another device or an imported older save.
create or replace function public.keep_sealed_response() returns trigger
language plpgsql set search_path = '' as $$
begin
 if coalesce(btrim(old.save #>> '{giftProgress,response}'),'') <> '' and
    ((new.save #>> '{giftProgress,response}') is distinct from (old.save #>> '{giftProgress,response}') or
     (new.save #>> '{giftProgress,id}') is distinct from (old.save #>> '{giftProgress,id}')) then
   raise exception 'This response is already sealed' using errcode = '22023';
 end if;
 return new;
end $$;
revoke all on function public.keep_sealed_response() from public;
drop trigger if exists keep_sealed_response on public.world_saves;
create trigger keep_sealed_response before update on public.world_saves
for each row execute function public.keep_sealed_response();
commit;
