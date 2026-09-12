import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({headless:true,channel:'msedge'});
try {
 const page = await browser.newPage({viewport:{width:390,height:844}}); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174'); await page.locator('#loading').waitFor({state:'detached'});
 await page.locator('#album').click(); assert.equal(await page.locator('article.memory-card').count(),6); assert.equal(await page.locator('.memory-card button').count(),0); await page.keyboard.press('Escape');
 await page.locator('#settings').click(); await page.locator('#avatar-choice').selectOption('woman');
 assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.avatar.appearance),'woman');
 assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.scene.getMeshByName('long-hair').isEnabled()),true);
 await page.reload(); await page.locator('#loading').waitFor({state:'detached'}); assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.avatar.appearance),'woman');
 await page.locator('#enter').click();
 for(const id of ['welcome','letter-home','little-light','cloud-message','your-pace','tomorrow-door']) {
 await page.evaluate(id=>{const w=window.__MI_MUNDO_DEV__.world,t=w.targets.find(t=>t.id===id);w.avatar.root.position.set(t.position.x,t.position.y,t.position.z+1.3);},id);
 await page.waitForFunction(id=>window.__MI_MUNDO_DEV__.world.nearest?.id===id,id);
 await page.locator('#action').click(); assert.equal(await page.locator('.journal-back').textContent(),'← Volver al jardín');
 assert.ok((await page.locator('.story-page-content > p').textContent()).length<110);
 await page.locator('.story-next').click(); if (!['letter-home','your-pace'].includes(id)) await page.locator('.story-next').click();
 await page.locator('.story-next').click(); await page.waitForFunction(()=>document.querySelector('.story-save-status')?.textContent.includes('Guardado contigo'));
 if(id==='letter-home')await page.screenshot({path:'artifacts/short-story-mobile.png'});
 await page.locator('.journal-back').click(); await page.waitForFunction(()=>!window.__MI_MUNDO_DEV__.world.paused);
 }
 await page.locator('#settings').click(); await page.locator('#avatar-choice').selectOption('man'); assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.scene.getMeshByName('long-hair').isEnabled()),false);
 assert.deepEqual(errors,[]); console.log('PASS: six object-only stories, short interactive pages, saving, mobile, both avatars and remembered choice');
} finally {await browser.close();}
