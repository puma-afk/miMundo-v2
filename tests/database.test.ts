import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL migration enforces owner isolation, CAS, idempotency and bounded recovery snapshots', async () => {
  const db = new PGlite();
  const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
  try {
    // Reproduce Supabase roles and JWT identity without connecting to any real account.
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${a}'), ('${b}');`);
    const migration = await readFile(new URL('../supabase/migrations/001_accounts_and_worlds.sql', import.meta.url), 'utf8');
    await db.exec(migration); await db.exec(migration);
    const giftsMigration = await readFile(new URL('../supabase/migrations/002_private_gifts.sql', import.meta.url), 'utf8');
    await db.exec(giftsMigration); await db.exec(giftsMigration);
    const visitsMigration = await readFile(new URL('../supabase/migrations/003_world_visits.sql', import.meta.url), 'utf8');
    await db.exec(visitsMigration); await db.exec(visitsMigration);
    const sealedMigration = await readFile(new URL('../supabase/migrations/004_sealed_response.sql', import.meta.url), 'utf8');
    await db.exec(sealedMigration); await db.exec(sealedMigration);
    await db.query('insert into public.world_gifts(owner_id,payload) values ($1,$2)', [a, JSON.stringify({ message: 'Test only private content' })]);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${a}';`);
    assert.equal((await db.query('select * from public.world_gifts')).rows.length, 1);
    await assert.rejects(db.exec("update public.world_gifts set payload = '{}'"), { code: '42501' });
    const save = { schemaVersion: 1, plants: {}, memoriesRead: [] };
    const op1 = '10000000-0000-4000-8000-000000000001';
    const commit = (owner: string, value: unknown, revision: number, op: string) => db.query<{ result: { revision: number } }>('select public.save_my_world($1, $2::jsonb, $3, $4) as result', [owner, JSON.stringify(value), revision, op]);
    assert.equal((await commit(a, save, 0, op1)).rows[0].result.revision, 1);
    assert.equal((await commit(a, save, 0, op1)).rows[0].result.revision, 1);
    await assert.rejects(commit(a, { ...save, messages: {} }, 0, op1), { code: '22023' });
    await assert.rejects(commit(a, save, 0, crypto.randomUUID()), { code: '40001' });
    await assert.rejects(commit(b, save, 0, crypto.randomUUID()), { code: '42501' });
    await assert.rejects(commit(a, { schemaVersion: 2 }, 1, crypto.randomUUID()), { code: '22023' });
    await assert.rejects(db.exec('update public.world_saves set revision = 100'), { code: '42501' });
    await commit(a, { ...save, messages: { tree: 'Primera' } }, 1, crypto.randomUUID());
    await commit(a, { ...save, messages: { tree: 'Segunda' } }, 2, crypto.randomUUID());
    assert.equal((await db.query('select * from public.world_snapshots')).rows.length, 1);
    await db.exec(`set request.jwt.claim.sub = '${b}'`);
    assert.equal((await db.query('select * from public.world_gifts')).rows.length, 0);
    await assert.rejects(db.query('insert into public.world_gifts(owner_id,payload) values ($1,$2)', [b, '{}']), { code: '42501' });
    assert.equal((await db.query('select * from public.world_saves')).rows.length, 0);
    assert.equal((await db.query('select * from public.world_snapshots')).rows.length, 0);
    await commit(b, save, 0, crypto.randomUUID());
    assert.equal((await db.query('select * from public.world_saves')).rows.length, 1);
    await db.exec(`set request.jwt.claim.sub = '${a}'`);
    for (let revision = 3; revision < 16; revision++) {
      await db.exec(`reset role; update public.world_snapshots set created_at = created_at - interval '31 minutes'; set role authenticated;`);
      await commit(a, { ...save, messages: { tree: String(revision) } }, revision, crypto.randomUUID());
    }
    assert.equal((await db.query('select * from public.world_snapshots')).rows.length, 10);
    await commit(a, { ...save, messages: { tree: 'PRIVATE' }, giftProgress: { id: 'gift', completed: 4, response: 'PRIVATE ANSWER' } }, 16, crypto.randomUUID());
    await assert.rejects(commit(a, save, 17, crypto.randomUUID()), { code:'22023' });
    await assert.rejects(commit(a, { ...save, giftProgress:{id:'gift',completed:4,response:'EDITED'} }, 17, crypto.randomUUID()), { code:'22023' });
    const token = (await db.query<{ token: string }>('select public.publish_my_visit() as token')).rows[0].token;
    await db.exec(`set request.jwt.claim.sub = '${b}'`);
    await assert.rejects(db.query('select public.publish_my_visit()'), { code: '42501' });
    await db.query('select public.revoke_my_visit()');
    assert.ok((await db.query<{value:unknown}>('select public.read_world_visit($1) as value',[token])).rows[0].value);
    await db.exec('set role anon');
    const publicSave = (await db.query<{value:unknown}>('select public.read_world_visit($1) as value',[token])).rows[0].value;
    assert.deepEqual(publicSave, { ...save, currentIsland: 'garden' });
    await assert.rejects(db.query('select * from public.world_visits'), { code: '42501' });
    await assert.rejects(db.query('select public.publish_my_visit()'), { code: '42501' });
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${a}'`);
    await db.query('select public.revoke_my_visit()');
    assert.equal((await db.query<{value:unknown}>('select public.read_world_visit($1) as value',[token])).rows[0].value, null);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.world_gifts'), { code: '42501' });
    await assert.rejects(db.query('select * from public.world_saves'), { code: '42501' });
    await assert.rejects(commit(a, save, 16, crypto.randomUUID()), { code: '42501' });
  } finally { await db.close(); }
});
