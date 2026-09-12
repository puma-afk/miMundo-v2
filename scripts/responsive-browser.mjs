import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 for(const [width,height] of [[390,844],[320,640],[844,390]]) {
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174'); await page.locator('#loading').waitFor({state:'detached'});await page.locator('#enter').tap();
 assert.equal(await page.locator('.quest').evaluate(e=>e.open),false);
 await page.locator('.quest-toggle').tap();assert.equal(await page.locator('.quest').evaluate(e=>e.open),true);
 await page.locator('.quest-toggle').tap();assert.equal(await page.locator('.quest').evaluate(e=>e.open),false);
 await page.screenshot({path:`artifacts/mobile-hud-${width}.png`});
 await page.locator('#settings').tap();const dialog=page.locator('#settings-dialog');const b=await dialog.boundingBox();console.log(width,b); await page.screenshot({path:`artifacts/debug-settings-${width}.png`}); assert.ok(b.x>=0&&b.x+b.width<=width+1);assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
 await page.screenshot({path:`artifacts/mobile-settings-${width}.png`});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS collapsible HUD and dialog layout: 320px, 390px, landscape touch');
}finally{await browser.close();}

