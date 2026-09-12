import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GardenGame } from '../src/application/gardenGame.ts';
import { freshSave, parseSave } from '../src/domain/gardening.ts';
test('messages survive copies, validate limits and keep previous value on failed save', async () => {
 let fail=false;
 const game=new GardenGame({read:async()=>freshSave(),write:async()=>{if(fail)throw new Error('disk');}});
 await game.setMessage('welcome','Hola ♡');
 assert.equal(parseSave(JSON.parse(JSON.stringify(game.save)),[]).messages?.welcome,'Hola ♡');
 assert.equal(parseSave(freshSave(),[]).messages,undefined);
 await assert.rejects(game.setMessage('unknown','no'));
 await assert.rejects(game.setMessage('welcome','a'.repeat(501)));
 assert.throws(()=>parseSave({...freshSave(),messages:{welcome:5}},[]));
 fail=true;await assert.rejects(game.setMessage('welcome','Otro'));assert.equal(game.save.messages?.welcome,'Hola ♡');
});
