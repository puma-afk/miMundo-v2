import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GardenGame} from '../src/application/gardenGame.ts';
import {freshSave,parseSave,GROWTH_MS} from '../src/domain/gardening.ts';
import {canVisitForest,forestAchievements} from '../src/domain/achievements.ts';
import {plots} from '../src/content/garden.ts';
import {forestPlots} from '../src/content/islands.ts';
test('forest unlock requires all three achievements and persists on travel',async()=>{
 let now=1000;const game=new GardenGame({read:async()=>freshSave(),write:async()=>{}},()=>now);
 await assert.rejects(game.travel('forest'));await assert.rejects(game.act('bosque-01'));
 for(const p of plots.slice(0,3))await game.act(p.id);
 await game.readMemory('welcome');await game.readMemory('letter-home');assert.equal(canVisitForest(game.save,now),false);
 now+=GROWTH_MS;assert.equal(canVisitForest(game.save,now),true);await game.travel('forest');
 assert.equal(game.save.forestUnlocked,true);assert.equal(game.save.currentIsland,'forest');
 await assert.rejects(game.forestAction('refuge'));await game.act('bosque-01');await game.act('bosque-02');await game.forestAction('refuge');await game.forestAction('story');
 await game.setMessage('bosque-01','Entre las estrellas');await game.travel('garden');
 const copy=parseSave(JSON.parse(JSON.stringify(game.save)),[...plots,...forestPlots].map(p=>p.id));
 assert.equal(copy.plants['bosque-01'].definitionId,'starfern');assert.equal(copy.forestRefuge,true);assert.equal(copy.forestStory,true);assert.equal(copy.messages?.['bosque-01'],'Entre las estrellas');
 assert.equal(forestAchievements(copy,now)[0].current,3);
 now=0;assert.equal(canVisitForest(copy,now),true);
});
test('old saves remain valid and failed travel cannot unlock or move the player',async()=>{
 assert.equal(parseSave(freshSave(),[]).currentIsland,undefined);
 const game=new GardenGame({read:async()=>freshSave(),write:async()=>{throw new Error('disk');}});
 game.save={...freshSave(),forestUnlocked:true};await assert.rejects(game.travel('forest'));assert.equal(game.save.currentIsland,undefined);
 assert.throws(()=>parseSave({...freshSave(),currentIsland:'forest'},[]));
 assert.throws(()=>parseSave({...freshSave(),forestUnlocked:'yes'},[]));
});
