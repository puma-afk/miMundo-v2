import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const ready=async()=>{await page.locator('#intro-title').waitFor({state:'visible',timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});};
  await page.goto('http://127.0.0.1:5174');await ready();await page.locator('.account-nudge .text-button').click();await page.locator('#enter').click();
  assert.equal(await page.locator('.sky-status').isVisible(),true);
  await page.locator('.sky-status summary').click();
  assert.match(await page.locator('#world-day').textContent(),/Día 1 · Año 1/);
  assert.ok(await page.locator('#real-date').getAttribute('datetime'));
  await page.screenshot({path:`artifacts/world-clock-${width}.png`});
  await page.locator('.sky-status summary').click();await page.locator('#settings').click();
  assert.equal(await page.locator('#hour,#auto-time,[data-sky-hour]').count(),0);
  await page.locator('[data-sky-theme=celestial]').click();
  assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.theme),'celestial');
  const before=await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.hour);
  await page.waitForFunction(n=>window.__MI_MUNDO_DEV__.world.sky.hour>n+.001,before);
  const day=await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.sun.intensity);
  await page.evaluate(()=>{const original=Date.now.bind(Date);Date.now=()=>original()+900000;});
  await page.waitForFunction(()=>window.__MI_MUNDO_DEV__.world.sky.hour>19);
  const night=await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.sun.intensity);
  assert.ok(day>night+.5);
  await page.screenshot({path:`artifacts/world-themes-${width}.png`});
  await page.reload();await ready();
  assert.equal(await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.theme),'celestial');
  const after=await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.sky.hour);
  assert.ok(after>=before && after-before<.5);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS mobile/desktop clock, themes persist, actual lighting changes, reload continuity and no manual time controls.');
}finally{await browser.close();}
