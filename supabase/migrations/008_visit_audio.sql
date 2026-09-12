begin;
-- Only a bearer of an active invitation may request a short-lived audio URL.
create or replace function public.visit_audio_allowed(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.world_visits v, jsonb_array_elements(coalesce(v.gift->'songs','[]'::jsonb)) song
 where v.active and v.token::text=(nullif(current_setting('request.headers',true),'')::jsonb->>'x-visit-token')
 and p_name=(v.gift->>'id')||'/'||(song->>'file'))
$$;
revoke all on function public.visit_audio_allowed(text) from public;
grant execute on function public.visit_audio_allowed(text) to anon,authenticated;
drop policy if exists read_invited_audio on storage.objects;
create policy read_invited_audio on storage.objects for select to anon,authenticated
using(bucket_id='gift-audio' and public.visit_audio_allowed(name));
commit;
