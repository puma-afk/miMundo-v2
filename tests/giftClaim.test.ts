import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('gift assignment uses verified server email, is private and can only be claimed once',async()=>{
 const db=new PGlite();const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 try {
  await db.exec(`create role authenticated;create role anon;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;
   insert into auth.users values('${a}','Recipient@example.invalid',null,'{}'),('${b}','other@example.invalid',now(),'{"email":"recipient@example.invalid"}');`);
  for(const file of ['002_private_gifts.sql','006_claim_gift.sql']) {const sql=await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);}
  await db.exec(`insert into public.gift_invitations(email,payload) values('recipient@example.invalid','{"id":"test-gift"}');set role authenticated;set request.jwt.claim.sub='${b}';`);
  const claim=async()=> (await db.query<{value:boolean}>('select public.claim_my_gift() as value')).rows[0].value;
  assert.equal(await claim(),false);
  await assert.rejects(db.query('select * from public.gift_invitations'),{code:'42501'});
  await db.exec(`set request.jwt.claim.sub='${a}'`);assert.equal(await claim(),false);
  await db.exec(`reset role;update auth.users set email_confirmed_at=now() where id='${a}';set role authenticated;`);
  assert.equal(await claim(),true);assert.equal(await claim(),false);
  assert.equal((await db.query('select * from public.world_gifts')).rows.length,1);
  await db.exec(`reset role;update auth.users set email='recipient@example.invalid' where id='${b}';set role authenticated;set request.jwt.claim.sub='${b}';`);
  assert.equal(await claim(),false);assert.equal((await db.query('select * from public.world_gifts')).rows.length,0);
  await db.exec('set role anon');await assert.rejects(claim(),{code:'42501'});
 }finally{await db.close();}
});
