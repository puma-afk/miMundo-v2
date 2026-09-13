import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const b=await chromium.launch({headless:true,channel:'msedge'});
try{for(const width of [390,1440]){const p=await b.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));let publishCalls=0;
await p.route('**/rest/v1/rpc/publish_my_visit',r=>{publishCalls++;return r.fulfill({status:500,body:'{}'});});
const ready=async()=>{await p.locator('#intro-title').waitFor({state:'visible',timeout:120000});await p.locator('#loading').waitFor({state:'detached',timeout:120000});};
await p.goto('http://127.0.0.1:5174');await ready();await p.locator('.account-nudge').waitFor();await p.screenshot({path:`artifacts/account-hint-${width}.png`});await p.locator('.account-nudge .text-button').click();
await p.reload();await ready();assert.equal(await p.locator('.account-nudge').count(),0);
await p.getByRole('button',{name:'Visitar y compartir mundos'}).click();await p.locator('#visit-connect').waitFor({state:'visible'});await p.locator('#visit-publish').click();assert.equal(publishCalls,0);assert.equal(await p.locator('#visit-result').isVisible(),false);
await p.locator('#visit-key').fill('bad');await p.locator('#visit-enter button').click();assert.match(await p.locator('#visit-enter-status').textContent(),/válido/);await p.screenshot({path:`artifacts/invitations-guest-${width}.png`});await p.getByRole('button',{name:'Cerrar visitas',exact:true}).click();
await p.locator('#enter').click();await p.locator('#nav-avatar').click();await p.locator('#avatar-choice').selectOption('woman');await p.locator('#avatar-skin').selectOption('deep');await p.locator('#avatar-robe').selectOption('lavender');await p.locator('#avatar-hair').selectOption('braid');
assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.game.save.avatarStyle),undefined);
await p.screenshot({path:`artifacts/avatar-custom-${width}.png`});await p.locator('#avatar-save').click();await p.waitForFunction(()=>window.__MI_MUNDO_DEV__.game.save.avatarStyle?.robe==='lavender');await p.locator('#avatar-wave').click();
await p.evaluate(()=>{const s=window.__MI_MUNDO_DEV__.world.sky;s.auto=false;s.hour=23;s.update(0,false);});await p.screenshot({path:`artifacts/darker-night-${width}.png`});
await p.reload();await ready();assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.avatar.style.skin),'deep');assert.equal(await p.evaluate(()=>window.__MI_MUNDO_DEV__.world.avatar.appearance),'woman');
assert.deepEqual(errors,[]);await p.close();}
console.log('PASS first account hint, dismissal, guest invitation gate, inline errors, avatar preview/confirmation/persistence and dark night.');}finally{await b.close();}
