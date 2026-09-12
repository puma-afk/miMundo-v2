import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CloudSync } from '../src/application/cloudSync.ts';
import type { LocalWorld, Operation, RemoteWorld } from '../src/application/cloudSync.ts';
import { freshSave, plantSeed } from '../src/domain/gardening.ts';

class Store {
  data: LocalWorld | undefined;
  fail = false;
  async read() { return structuredClone(this.data); }
  async put(expected: LocalWorld | undefined, next: LocalWorld) {
    if (this.fail) throw new Error('Disk full');
    if (JSON.stringify(expected) !== JSON.stringify(this.data)) throw new Error('Other tab changed the garden');
    this.data = structuredClone(next);
  }
}
class Cloud {
  data: RemoteWorld | null = null;
  offline = false; loseResponse = false; commits = 0;
  beforeCommit: (() => Promise<void>) | null = null;
  async read() { if (this.offline) throw new Error('Offline'); return structuredClone(this.data); }
  async commit(op: Operation) {
    this.commits++;
    await this.beforeCommit?.();
    if (this.offline) throw new Error('Offline');
    if (this.data?.operationId === op.id) return structuredClone(this.data);
    if ((this.data?.revision ?? 0) !== op.base) throw Object.assign(new Error('Conflict'), { code: '40001' });
    this.data = { save: structuredClone(op.save), revision: op.base + 1, operationId: op.id, updatedAt: new Date().toISOString() };
    if (this.loseResponse) { this.loseResponse = false; throw new Error('Response lost'); }
    return structuredClone(this.data);
  }
}
const planted = () => plantSeed(freshSave(), 'luna-01', 1000);

test('offline changes survive reload and sync after reconnect', async () => {
  const store = new Store(), cloud = new Cloud(); cloud.offline = true;
  const first = new CloudSync(store, cloud); await first.read(); await first.write(planted()); await first.sync();
  assert.equal(first.pending, true); assert.equal(first.status, 'error');
  const reopened = new CloudSync(store, cloud); assert.deepEqual(await reopened.read(), planted());
  cloud.offline = false; await reopened.sync();
  assert.deepEqual(cloud.data!.save, planted()); assert.equal(reopened.pending, false);
});
test('a lost acknowledgement retries without creating a duplicate revision', async () => {
  const store = new Store(), cloud = new Cloud(), engine = new CloudSync(store, cloud);
  await engine.read(); await engine.write(planted()); cloud.loseResponse = true; await engine.sync();
  assert.equal(store.data!.dirty, true); assert.ok(store.data!.operation);
  const reopened = new CloudSync(store, cloud); await reopened.read(); await reopened.sync();
  assert.equal(cloud.data!.revision, 1); assert.equal(cloud.commits, 1); assert.equal(reopened.pending, false);
});
test('edits while a request is in flight stay pending after acknowledgement', async () => {
  const store = new Store(), cloud = new Cloud(), engine = new CloudSync(store, cloud);
  await engine.read(); await engine.write(planted());
  let release!: () => void, started!: () => void;
  const entered = new Promise<void>(resolve => started = resolve);
  cloud.beforeCommit = () => { started(); return new Promise<void>(resolve => release = resolve); };
  const request = engine.sync(); await entered;
  const later = { ...planted(), messages: { 'luna-01': 'No perder esta edición' } };
  await engine.write(later); release(); await request;
  assert.equal(engine.pending, true); assert.deepEqual(store.data!.save, later);
  cloud.beforeCommit = null; await engine.sync(); assert.deepEqual(cloud.data!.save, later); assert.equal(cloud.data!.revision, 2);
});
test('two devices never silently overwrite each other and resolution preserves a recovery copy', async () => {
  const cloud = new Cloud(), a = new CloudSync(new Store(), cloud), storeB = new Store(), b = new CloudSync(storeB, cloud);
  await a.read(); await b.read(); await a.sync(); await b.sync();
  await a.write(planted()); await a.sync();
  const other = { ...freshSave(), messages: { tree: 'Otra historia' } };
  await b.write(other); await b.sync(); assert.equal(b.status, 'conflict'); assert.deepEqual(cloud.data!.save, planted());
  assert.deepEqual(await b.resolve('cloud'), planted()); assert.deepEqual(b.backups[0].save, other);
});
test('a new device must explicitly recover an existing cloud world', async () => {
  const cloud = new Cloud(), first = new CloudSync(new Store(), cloud);
  await first.read(); await first.write(planted()); await first.sync();
  const second = new CloudSync(new Store(), cloud); await second.read(); await second.sync();
  assert.equal(second.status, 'incoming'); await assert.rejects(second.write(freshSave()), /recuperarlo/);
  assert.deepEqual(await second.resolve('cloud'), planted()); assert.equal(second.status, 'saved');
});
test('local choice uses a new compare-and-swap and keeps the displaced remote version', async () => {
  const cloud = new Cloud(), first = new CloudSync(new Store(), cloud), second = new CloudSync(new Store(), cloud);
  await first.read(); await second.read(); await first.write(planted()); await first.sync();
  const other = { ...freshSave(), messages: { tree: 'Elegida' } };
  await second.write(other); await second.sync(); await second.resolve('local'); await second.sync();
  assert.equal(cloud.data!.revision, 2); assert.deepEqual(cloud.data!.save, other); assert.deepEqual(second.backups[0].save, planted());
});
test('another tab cannot replace a local envelope and failed writes do not advance it', async () => {
  const store = new Store(), cloud = new Cloud(), a = new CloudSync(store, cloud), b = new CloudSync(store, cloud);
  await a.read(); await b.read(); await a.write(planted());
  await assert.rejects(b.write(freshSave()), /Other tab/); assert.deepEqual(store.data!.save, planted());
  store.fail = true; await assert.rejects(a.write(freshSave()), /Disk full/); assert.deepEqual(store.data!.save, planted());
});
test('simultaneous sync requests share one network operation', async () => {
  const cloud = new Cloud(), engine = new CloudSync(new Store(), cloud);
  await engine.read(); await engine.write(planted()); await Promise.all([engine.sync(), engine.sync(), engine.sync()]);
  assert.equal(cloud.commits, 1);
});

test('local save dates survive reload and failed writes never advance confirmation dates', async () => {
 const store=new Store(), cloud=new Cloud(), sync=new CloudSync(store,cloud);
 await sync.read(); await sync.write(planted()); await sync.sync();
 const localAt=sync.localSavedAt, cloudAt=sync.syncedAt;
 assert.ok(localAt); assert.equal(cloudAt,cloud.data!.updatedAt);
 store.fail=true;
 await assert.rejects(sync.write({...planted(),avatar:'woman'}));
 assert.equal(sync.localSavedAt,localAt);assert.equal(sync.syncedAt,cloudAt);
 store.fail=false;cloud.offline=true;
 await sync.write({...planted(),avatar:'woman'});await sync.sync();
 assert.equal(sync.syncedAt,cloudAt);assert.equal(sync.pending,true);
 const loaded=new CloudSync(store,cloud);await loaded.read();
 assert.equal(loaded.localSavedAt,sync.localSavedAt);assert.equal(loaded.syncedAt,cloudAt);
});
