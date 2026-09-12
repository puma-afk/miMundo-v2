import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('private audio is readable only by the assigned owner and only for listed files',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role authenticated;create role anon;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(bucket_id text,name text);
   alter table storage.objects enable row level security;
   grant usage on schema storage,auth to authenticated,anon;
   grant select on storage.objects to authenticated,anon;
   insert into auth.users values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
  await db.exec(await readFile(new URL('../supabase/migrations/002_private_gifts.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../supabase/migrations/005_private_audio.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
  await db.exec(`insert into public.world_gifts(owner_id,payload) values('00000000-0000-4000-8000-000000000001','{"id":"gift","songs":[{"file":"song.mp3"}]}');
   insert into storage.objects values('gift-audio','gift/song.mp3'),('gift-audio','gift/unlisted.mp3'),('gift-audio','another/song.mp3');
   set role authenticated;set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';`);
  assert.deepEqual((await db.query('select name from storage.objects')).rows,[{name:'gift/song.mp3'}]);
  await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'`);
  assert.equal((await db.query('select name from storage.objects')).rows.length,0);
  await db.exec('set role anon');assert.equal((await db.query('select name from storage.objects')).rows.length,0);

 await db.exec(`reset role;create table public.world_visits(owner_id uuid,token uuid,gift jsonb,active boolean default true);
 insert into public.world_visits(owner_id,token,gift) values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','{"id":"gift","songs":[{"file":"song.mp3"}]}');`);
 const audioVisit=await readFile(new URL('../supabase/migrations/008_visit_audio.sql',import.meta.url),'utf8');await db.exec(audioVisit);await db.exec(audioVisit);
 await db.exec(`set role anon;set request.headers='{"x-visit-token":"00000000-0000-4000-8000-000000000099"}';`);
 assert.deepEqual((await db.query('select name from storage.objects')).rows,[{name:'gift/song.mp3'}]);
 await db.exec(`set request.headers='{"x-visit-token":"wrong"}';`);assert.equal((await db.query('select name from storage.objects')).rows.length,0);
 await db.exec(`reset role;delete from public.world_visits;set role anon;set request.headers='{"x-visit-token":"00000000-0000-4000-8000-000000000099"}';`);assert.equal((await db.query('select name from storage.objects')).rows.length,0);
 } finally {await db.close();}
});
