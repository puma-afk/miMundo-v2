import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GardenGame } from '../src/application/gardenGame.ts';
import { freshSave } from '../src/domain/gardening.ts';

test('a failed write does not create a plant or leave actions locked', async () => {
  const game = new GardenGame({ read: async () => freshSave(), write: async () => { throw new Error('Disk full'); } }, () => 1000);
  await assert.rejects(game.act('luna-01'), /Disk full/);
  assert.deepEqual(game.save, freshSave());
  assert.equal(game.busy, false);
});
test('concurrent clicks cannot plant and water in the same transaction', async () => {
  let complete: () => void = () => {};
  let writes = 0;
  const game = new GardenGame({ read: async () => freshSave(), write: async () => { writes++; await new Promise<void>(resolve => { complete = resolve; }); } }, () => 1000);
  const planting = game.act('luna-01');
  await assert.rejects(game.act('luna-01'), /Espera/);
  complete(); await planting;
  assert.equal(writes, 1);
  assert.equal(game.save.plants['luna-01'].wateredAt, null);
});
