import { parseSave } from '../src/domain/gardening.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('invitations expose shared content, comments cannot alter worlds, revoked tokens stop access',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;insert into auth.users values('${a}'),('${b}'),('${c}');`);
 for(const file of ['001_accounts_and_worlds.sql','002_private_gifts.sql','003_world_visits.sql','007_visits_and_comments.sql','009_comment_cooldown.sql','010_shared_world_name.sql']){const sql=await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');await db.exec(sql);if(file.startsWith('007') || file.startsWith('009'))await db.exec(sql);}
 await db.exec(`insert into public.world_gifts values('${a}','{"id":"test-gift","message":"Shared letter"}',now());`);
 const as=async(role:string,id='')=>db.exec(`reset role;set role ${role};set request.jwt.claim.sub='${id}';`);
 await as('authenticated',a);
 const save={schemaVersion:1,worldName:"Luna",plants:{'luna-01':{id:'luna-01',definitionId:'moonflower',plantedAt:1000,wateredAt:null}},memoriesRead:[],messages:{welcome:'Shared note'},giftProgress:{id:'test-gift',completed:4,response:'Shared reply'}};
 await db.query('select public.save_my_world($1,$2,0,$3)',[a,JSON.stringify(save),crypto.randomUUID()]);
 const token=(await db.query<{t:string}>('select public.publish_my_visit() t')).rows[0].t;
 const invite=(await db.query<{v:any}>('select public.get_my_visit() v')).rows[0].v;
 assert.match(invite.code,/^[A-F0-9]{12}$/);
 await as('anon');
 const shared=(await db.query<{v:any}>('select public.read_world_visit_v2($1) v',[invite.code])).rows[0].v;
 assert.equal(parseSave(shared.save,['luna-01']).plants['luna-01'].wateredAt,null);assert.equal(shared.gift.message,'Shared letter');assert.equal(shared.save.messages.welcome,'Shared note');assert.equal(shared.save.giftProgress.response,'Shared reply');assert.equal(shared.owner_id,undefined);assert.equal(shared.save.worldName,'Luna');
 await assert.rejects(db.exec('select * from public.world_saves'),{code:'42501'});
 await assert.rejects(db.query("select public.add_visit_comment($1,'welcome','A','Hi')",[token]),{code:'42501'});
 await as('authenticated',b);
 await db.query("select public.add_visit_comment($1,'welcome','Visitante','Hola <script>literal</script>')",[token]);
 await assert.rejects(db.query("select public.add_visit_comment($1,'welcome','Visitante','Too fast')",[token]));
 let rows=(await db.query<{v:any}>('select public.read_visit_comments($1,\'welcome\') v',[token])).rows[0].v;assert.equal(rows.length,1);assert.equal(rows[0].can_delete,true);assert.equal(rows[0].author_id,undefined);
 const id=rows[0].id;
 await assert.rejects(db.exec('delete from public.visit_comments'),{code:'42501'});
 await assert.rejects(db.query('select public.save_my_world($1,$2,1,$3)',[a,JSON.stringify(save),crypto.randomUUID()]),{code:'42501'});
 await as('authenticated',c);await assert.rejects(db.query('select public.delete_visit_comment($1,$2)',[token,id]),{code:'42501'});
 await as('authenticated',a);await db.query('select public.delete_visit_comment($1,$2)',[token,id]);
 await as('authenticated',b);await assert.rejects(db.query("select public.add_visit_comment($1,'welcome','Visitante','Delete bypass')",[token]));
 await as('authenticated',a);await db.exec('select public.revoke_my_visit()');
 await as('anon');assert.equal((await db.query<{v:any}>('select public.read_world_visit_v2($1) v',[token])).rows[0].v,null);
 assert.deepEqual((await db.query<{v:any}>('select public.read_visit_comments($1,\'welcome\') v',[token])).rows[0].v,[]);
 await as('authenticated',b);await db.query('select public.save_my_world($1,$2,0,$3)',[b,JSON.stringify({schemaVersion:1,plants:{},memoriesRead:[]}),crypto.randomUUID()]);assert.ok((await db.query('select public.publish_my_visit()')).rows.length);
 }finally{await db.close();}
});
