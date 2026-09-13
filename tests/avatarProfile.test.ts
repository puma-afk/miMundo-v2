import {test} from 'node:test';import assert from 'node:assert/strict';
import {GardenGame} from '../src/application/gardenGame.ts';import {freshSave,parseSave} from '../src/domain/gardening.ts';
test('avatar draft and name commit atomically and validate portable saves',async()=>{
 let data=freshSave(),fail=false;const g=new GardenGame({read:async()=>data,write:async s=>{if(fail)throw Error('Full');data=s;}});await g.load();
 await g.setAvatarLook('woman',{skin:'deep',robe:'lavender',hair:'braid'});await g.setWorldName(' Luna ');
 assert.equal(parseSave(JSON.parse(JSON.stringify(data)),[]).worldName,'Luna');
 assert.equal(data.avatarStyle?.skin,'deep');fail=true;await assert.rejects(g.setAvatarLook('man',{skin:'light',robe:'rose',hair:'short'}));assert.equal(g.save.avatar,'woman');
 await assert.rejects(g.setWorldName(' '.repeat(10)));assert.throws(()=>parseSave({...data,avatarStyle:{skin:'invalid',robe:'rose',hair:'short'}},[]));
 assert.throws(()=>parseSave({...data,worldName:'x'.repeat(25)},[]));
});
