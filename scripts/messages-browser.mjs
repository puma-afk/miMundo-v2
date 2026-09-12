import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const load=async()=>{await page.goto('http://127.0.0.1:5174');await page.locator('#loading').waitFor({state:'detached'});await page.locator('#enter').click();};
 const approach=async id=>{await page.evaluate(id=>{const w=window.__MI_MUNDO_DEV__.world,t=w.targets.find(t=>t.id===id);w.avatar.root.position.set(t.position.x,t.position.y,t.position.z+1.3);},id);await page.waitForFunction(id=>window.__MI_MUNDO_DEV__.world.nearest?.id===id,id);};
 await load(); await approach('letter-home'); await page.locator('#object-message').click();
 const message='Para ti ♡\n<script>hola</script>';
 await page.locator('#message-text').fill(message);await page.locator('#save-message').click();await page.waitForFunction(()=>document.querySelector('#message-status').textContent.includes('guardado'));
 await load(); await approach('letter-home');await page.locator('#object-message').click();assert.equal(await page.locator('#message-text').inputValue(),message);await page.screenshot({path:'artifacts/personal-message-mobile.png'});await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__MI_MUNDO_DEV__.world.paused);
 const plot=await page.evaluate(()=>window.__MI_MUNDO_DEV__.world.targets.find(t=>t.kind==='plot').id);await approach(plot);assert.equal(await page.locator('#object-message').isVisible(),false);await page.locator('#action').click();await page.locator('#object-message').waitFor({state:'visible'});await page.locator('#object-message').click();await page.locator('#message-text').fill('Nuestra primera flor');await page.locator('#save-message').click();await page.waitForFunction(()=>document.querySelector('#message-status').textContent.includes('guardado'));
 const save=await page.evaluate(()=>window.__MI_MUNDO_DEV__.game.save);assert.equal(save.messages[plot],'Nuestra primera flor');assert.equal(save.messages['letter-home'],message);
 await page.locator('#edit-message').click(); await page.locator('#message-text').fill('');await page.locator('#save-message').click();await page.waitForFunction(()=>document.querySelector('#message-status').textContent.includes('eliminado'));assert.equal(await page.evaluate(id=>window.__MI_MUNDO_DEV__.game.save.messages[id],plot),undefined);
 assert.deepEqual(errors,[]);console.log('PASS object/flower messages, persistence, literal text, deletion, mobile');
}finally{await browser.close();}
