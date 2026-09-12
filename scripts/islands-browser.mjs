import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const loaded=async()=>{await p.locator('#loading').waitFor({state:'detached'});};
 const approach=async id=>{await p.evaluate(id=>{const w=window.__MI_MUNDO_DEV__.world,t=w.targets.find(t=>t.id===id);w.avatar.root.position.set(t.position.x,t.position.y,t.position.z+1);},id);await p.waitForFunction(id=>window.__MI_MUNDO_DEV__.world.nearest?.id===id,id);};
 await p.goto('http://127.0.0.1:5174');await loaded();await p.locator('#enter').click();await approach('travel');await p.locator('#action').click();assert.equal(await p.locator('#travel-go').isDisabled(),true);assert.equal(await p.locator('.achievement-row').count(),3);await p.screenshot({path:'artifacts/island-achievements.png'});await p.getByRole('button',{name:'Cerrar viaje',exact:true}).click();
 await p.evaluate(async()=>{const g=window.__MI_MUNDO_DEV__.game;for(const id of ['luna-01','luna-02','luna-03'])await g.act(id);await g.readMemory('welcome');await g.readMemory('letter-home');const copy=structuredClone(g.save);copy.plants['luna-01'].plantedAt=Date.now()-7*3600000;await g.import(copy);});
 await p.locator('#action').click();assert.equal(await p.locator('#travel-go').isEnabled(),true);
 await Promise.all([p.waitForNavigation(),p.locator('#travel-go').click()]);await loaded();assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.forest),true);await p.locator('#enter').click();await p.screenshot({path:'artifacts/forest-mobile.png'});
 assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.scene.getMeshByName('garden-island')),null);
 await approach('bosque-01');await p.locator('#action').click();await p.waitForFunction(()=>!window.__MI_MUNDO_DEV__.game.busy&&!window.__MI_MUNDO_DEV__.world.avatar.caring);await approach('bosque-02');await p.locator('#action').click();await p.waitForFunction(()=>!window.__MI_MUNDO_DEV__.game.busy&&!window.__MI_MUNDO_DEV__.world.avatar.caring);
 await approach('refuge');await p.locator('#action').click();await p.waitForFunction(()=>window.__MI_MUNDO_DEV__.game.save.forestRefuge);assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.scene.getMeshByName('refuge-lamp').isEnabled()),true);
 await approach('forest-story');await p.locator('#action').click();await p.locator('#forest-story-save').click();await p.waitForFunction(()=>window.__MI_MUNDO_DEV__.game.save.forestStory);await p.getByRole('button',{name:'Cerrar historia del bosque',exact:true}).click();
 await approach('travel');await p.locator('#action').click();await Promise.all([p.waitForNavigation(),p.locator('#travel-go').click()]);await loaded();assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.forest),false);assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.game.save.plants['bosque-01'].definitionId),'starfern');assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.game.save.forestRefuge),true);
 assert.deepEqual(errors,[]);console.log('PASS locked portal, achievements, travel, separate scenes, forest planting/refuge/story and return persistence');
} finally {await browser.close();}
