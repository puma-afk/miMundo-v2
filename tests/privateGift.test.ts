import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGift, giftStops } from '../src/domain/privateGift.ts';
import { personalizeStory } from '../src/content/giftStories.ts';
import { findStory } from '../src/content/stories.ts';
import { GardenGame } from '../src/application/gardenGame.ts';
import { freshSave, parseSave } from '../src/domain/gardening.ts';

const gift = parseGift({ id: 'test-gift', firstName: 'Destinataria', fullName: 'Destinataria de prueba', dateLabel: 'Un día especial', age: 23, dedication: 'Una firma de prueba', message: 'Un mensaje privado de prueba.', songs: [] });
test('the final letter remains ordinary until all previous gift stops are completed', async () => {
  const star = findStory('tomorrow-door')!;
  for (let completed = 0; completed < 3; completed++) assert.equal(personalizeStory(star, gift, completed).step, null);
  assert.equal(personalizeStory(star, gift, 3).story.pages[1].text, gift.message);
  assert.match(personalizeStory(star, gift, 0).story.pages[0].text, /buzón/);
  assert.equal(personalizeStory(star, gift, 3).story.pages[2].text, '¿Aceptas?');
  let stored = freshSave(); const game = new GardenGame({ read: async () => stored, write: async next => { stored = next; } });
  await game.load(); await assert.rejects(game.completeGiftStep(gift.id, 3), /anterior/);
  for (let step = 0; step < 4; step++) {
    await game.completeGiftStep(gift.id, step);
    assert.equal(game.save.giftProgress?.completed, step + 1);
    assert.ok(game.save.memoriesRead.includes(giftStops[step]));
  }
  const restored = parseSave(JSON.parse(JSON.stringify(stored)), []);
  assert.equal(restored.giftProgress?.completed, 4);
  assert.equal(JSON.stringify(restored).includes(gift.message), false, 'the private letter is not embedded in exported save data');
  await game.saveGiftResponse(gift.id, 'Sí, acepto ♡');
  await assert.rejects(game.saveGiftResponse(gift.id, 'Otra respuesta'), /cerrada/);
  await assert.rejects(game.import(freshSave()), /cerrada/);
  await game.setAvatar('woman');
  assert.equal(parseSave(JSON.parse(JSON.stringify(stored)), []).giftProgress?.response, 'Sí, acepto ♡');
  await assert.rejects(game.saveGiftResponse('someone-else', 'test'));
  await assert.rejects(game.saveGiftResponse(gift.id, 'x'.repeat(501)));
});
test('a failed local write does not consume a clue and malformed gift progress is rejected', async () => {
  const game = new GardenGame({ read: async () => freshSave(), write: async () => { throw new Error('Storage failed'); } });
  await game.load(); await assert.rejects(game.completeGiftStep(gift.id, 0)); assert.equal(game.save.giftProgress, undefined);
  assert.throws(() => parseSave({ ...freshSave(), giftProgress: { id: gift.id, completed: 9 } }, []));
  assert.throws(() => parseGift({ ...gift, songs: [{ title: 12 }] }));
});
