import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, plantSeed, waterPlant, stage, GROWTH_MS, parseSave } from '../src/domain/gardening.ts';

test('a plant survives serialized reload and grows during absence', () => {
  const planted = plantSeed(freshSave(), 'p1', 1000);
  const loaded = parseSave(JSON.parse(JSON.stringify(planted)), ['p1']);
  assert.equal(stage(loaded.plants.p1, 1000), 0);
  assert.equal(stage(loaded.plants.p1, 1000 + GROWTH_MS), 2);
  assert.equal(stage(loaded.plants.p1, 0), 0);
});
test('watering advances growth once without modifying previous state', () => {
  const before = plantSeed(freshSave(), 'p1', 1000);
  const after = waterPlant(before, 'p1', 1100);
  assert.equal(before.plants.p1.wateredAt, null);
  assert.equal(stage(after.plants.p1, 1100), 1);
  assert.equal(stage(after.plants.p1, 1000 + GROWTH_MS / 2), 2);
  assert.throws(() => waterPlant(after, 'p1', 1200));
  assert.throws(() => plantSeed(after, 'p1', 1200));
});
test('invalid and future saves are rejected rather than silently discarded', () => {
  assert.throws(() => parseSave({ schemaVersion: 2 }, ['p1']));
  assert.throws(() => parseSave({ ...freshSave(), plants: { bad: {} } }, ['p1']));
  const save = plantSeed(freshSave(), 'p1', 1000);
  save.plants.p1.plantedAt = NaN;
  assert.throws(() => parseSave(save, ['p1']));
});
