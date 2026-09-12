begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('gift-audio','gift-audio',false,16777216,array['audio/mpeg','audio/mp3','audio/mp4','audio/ogg'])
on conflict(id) do update set public=false;
drop policy if exists read_assigned_gift_audio on storage.objects;
create policy read_assigned_gift_audio on storage.objects for select to authenticated
using (bucket_id='gift-audio' and exists (
 select 1 from public.world_gifts g, jsonb_array_elements(g.payload->'songs') song
 where g.owner_id=(select auth.uid()) and storage.objects.name=(g.payload->>'id')||'/'||(song->>'file')
));
commit;
