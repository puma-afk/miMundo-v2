import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worldTime, worldCalendar, DAY_MS} from '../src/domain/worldTime.ts';
import {freshSave, parseSave, plantSeed, stage, GROWTH_MS} from '../src/domain/gardening.ts';
test('sky completes a day in 30 minutes and keeps continuity across reload/absence',()=>{
 const start=1000;
 assert.equal(worldTime(start,start).hour,8);
 assert.equal(worldTime(start+DAY_MS/2,start).hour,20);
 assert.deepEqual(worldTime(start+DAY_MS,start),{hour:8,day:2});
 const reloaded=parseSave(JSON.parse(JSON.stringify(freshSave(start))),[]);
 assert.equal(worldTime(start+DAY_MS*3,reloaded.createdAt).hour,8);
 assert.equal(worldTime(start+DAY_MS*3,reloaded.createdAt).day,4);
 assert.equal(worldTime(start-1,start).hour,8);
});
test('old saves keep unknown creation date and visual days do not speed plant growth',()=>{
 assert.equal(parseSave(freshSave(),[]).createdAt,undefined);
 assert.throws(()=>parseSave({...freshSave(),createdAt:-1},[]));
 const plant=plantSeed(freshSave(1000),'p1',1000).plants.p1;
 assert.equal(stage(plant,1000+DAY_MS),0);
 assert.equal(stage(plant,1000+GROWTH_MS),2);
});

test('fantasy years use 360 virtual days',()=>{assert.deepEqual(worldCalendar(360),{day:360,year:1});assert.deepEqual(worldCalendar(361),{day:1,year:2});});
