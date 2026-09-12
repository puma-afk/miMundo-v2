import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, parseSave } from '../src/domain/gardening.ts';
import { GardenGame } from '../src/application/gardenGame.ts';

test('avatar is portable in the save and does not change after a failed write', async () => {
  let saved = freshSave(), fail = false;
  const game = new GardenGame({ read: async () => saved, write: async next => { if (fail) throw new Error('Storage full'); saved = next; } });
  await game.load(); await game.setAvatar('woman');
  assert.equal(parseSave(JSON.parse(JSON.stringify(saved)), []).avatar, 'woman');
  fail = true; await assert.rejects(game.setAvatar('man')); assert.equal(game.save.avatar, 'woman');
  assert.throws(() => parseSave({ ...saved, avatar: 'unknown' }, []), /Avatar/);
});
