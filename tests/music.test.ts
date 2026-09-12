import { test } from 'node:test';
import assert from 'node:assert/strict';
import { musicTracks, nextTrackIndex, readMusicPreferences } from '../src/content/music.ts';

test('playlist moves both ways and wraps at either end', () => {
  assert.equal(nextTrackIndex(0, musicTracks.length, -1), musicTracks.length - 1);
  assert.equal(nextTrackIndex(musicTracks.length - 1, musicTracks.length, 1), 0);
});
test('invalid or outdated music preferences recover safely', () => {
  assert.deepEqual(readMusicPreferences('broken'), { trackId: 'leaves', volume: 0.35 });
  assert.deepEqual(readMusicPreferences('{"trackId":"missing","volume":4}'), { trackId: 'leaves', volume: 1 });
  assert.deepEqual(readMusicPreferences('{"trackId":"clouds","volume":-2}'), { trackId: 'clouds', volume: 0 });
});
test('all original scores have complete bars and playable notes', () => {
  for (const track of musicTracks) if (track.kind === 'score') {
    assert.ok(track.score.bpm >= 40 && track.score.bpm <= 120);
    for (const phrase of track.score.phrases) { assert.equal(phrase.length, 8); assert.ok(phrase.every(n => n === null || Number.isInteger(n) && n >= 21 && n <= 108)); }
    assert.ok(track.score.chords.every(chord => chord.length === 4));
  }
});
