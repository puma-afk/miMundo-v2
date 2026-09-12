import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stories, savedStoryCount } from '../src/content/stories.ts';
import { GardenGame } from '../src/application/gardenGame.ts';
import { freshSave, parseSave } from '../src/domain/gardening.ts';

test('old saved memories survive the expanded catalog', () => {
  const old = { ...freshSave(), memoriesRead: ['welcome', 'legacy-memory'] };
  const parsed = parseSave(old, []);
  assert.deepEqual(parsed.memoriesRead, old.memoriesRead);
  assert.equal(savedStoryCount(parsed.memoriesRead), 1);
  assert.equal(savedStoryCount(['welcome', 'welcome']), 1);
});
test('saving a story is idempotent and rejects unknown IDs', async () => {
  let writes = 0;
  const game = new GardenGame({ read: async () => freshSave(), write: async () => { writes++; } });
  await game.readMemory('letter-home'); await game.readMemory('letter-home');
  assert.equal(writes, 1); assert.deepEqual(game.save.memoriesRead, ['letter-home']);
  await assert.rejects(game.readMemory('unknown'));
  assert.equal(writes, 1);
});
test('failed story save is not marked as collected', async () => {
  const game = new GardenGame({ read: async () => freshSave(), write: async () => { throw new Error('No storage'); } });
  await assert.rejects(game.readMemory('little-light'), /No storage/);
  assert.deepEqual(game.save.memoriesRead, []); assert.equal(game.busy, false);
});
test('story catalog has unique IDs, complete pages and locations on the island', () => {
  assert.equal(new Set(stories.map(story => story.id)).size, stories.length);
  for (const story of stories) {
    assert.equal(story.pages.length, 3);
    assert.ok(Math.hypot(story.position.x, story.position.z) < 13);
    assert.ok(story.pages.every(page => page.heading.length && page.text.length && page.line.length));
  }
});
