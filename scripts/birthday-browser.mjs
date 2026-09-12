// Synthetic private gift. No real recipient or personal message in the test suite.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const gift = process.env.PRIVATE_REAL_GIFT === '1'
  ? JSON.parse(await fs.readFile(new URL('../private-gifts/gift.json', import.meta.url), 'utf8'))
  : { id: 'test-gift', firstName: 'Destinataria', fullName: 'Destinataria de prueba', dateLabel: 'Un día especial', age: 23, dedication: 'Una firma de prueba', message: 'Este mensaje solo existe en la prueba privada.', songs: [] };
try {
  await fs.mkdir('artifacts', { recursive: true });
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    let audioRequests=0;page.on('request',r=>{if(r.url().includes('/__private-gift-audio'))audioRequests++;});
    await page.route('**/__private-gift-preview', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(gift) }));
    const ready = () => page.locator('#loading').waitFor({ state: 'detached', timeout: 120000 });
    const approach = async id => {
      await page.evaluate(id => { const w = window.__MI_MUNDO_DEV__.world, t = w.targets.find(t => t.id === id); w.avatar.root.position.set(t.position.x, t.position.y, t.position.z + 1.3); }, id);
      await page.waitForFunction(id => window.__MI_MUNDO_DEV__.world.nearest?.id === id, id);
      await page.locator('#action').click(); await page.locator('#memory-dialog').waitFor({ state: 'visible' });
    };
    await page.goto('http://127.0.0.1:5174'); await ready();
    assert.equal((await page.locator('#intro-title').textContent()).includes(gift.firstName), false);
    await page.locator('#enter').click(); await approach('letter-home'); assert.equal(await page.locator('.birthday-art').count(), 0);
    assert.equal(await page.locator('.story-next svg').count(), 1);
    assert.equal(await page.locator('.story-prev svg').count(), 1);
    await page.goto('http://127.0.0.1:5174/?gift-preview=1'); await ready();
    assert.ok((await page.locator('#intro-title').textContent()).includes(gift.firstName));
    await page.locator('#enter').click();
    assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.world.scene.getTransformNodeByName('story-object-tomorrow-door').isEnabled()), false);
    const stops = ['letter-home', 'little-light', 'your-pace', 'tomorrow-door'];
    for (let step = 0; step < stops.length; step++) {
      assert.match(await page.locator('#quest-copy').textContent(), [/buzón/,/farol/,/flor rosa/,/pedestal/][step]);
      for (const future of stops.slice(step + 1)) assert.equal(await page.evaluate(id => window.__MI_MUNDO_DEV__.world.scene.getTransformNodeByName('story-object-' + id).isEnabled(), future), false);
      await approach(stops[step]);
      const songIndex=step===0 ? 1 : step===3 ? 0 : -1;
      if(songIndex>=0 && gift.songs[songIndex]?.file) {
        const before=audioRequests;
        assert.equal(await page.locator('.gift-song audio').getAttribute('src'),null);
        assert.equal(audioRequests,before);
        await page.locator('.gift-song-toggle').click();
        await page.waitForFunction(()=>document.querySelector('.gift-song audio')?.currentTime>0.1,undefined,{timeout:30000});
        assert.ok(audioRequests>before);
        await page.locator('.gift-song-toggle').click();
        assert.equal(await page.locator('.gift-song audio').evaluate(a=>a.paused),true);
        await page.locator('.gift-song-toggle').click();
      }
      assert.match(await page.locator('.story-page-status').textContent(), /1 de 3/);
      await page.locator('.story-next').click();
      assert.match(await page.locator('.story-page-status').textContent(), /2 de 3/);
      if(songIndex>=0 && gift.songs[songIndex]?.file) assert.equal(await page.locator('.gift-song audio').evaluate(a=>a.paused),false);
      if (step === 3) {
        assert.equal(await page.locator('.story-page-content>p').first().textContent(), gift.message);
        await page.screenshot({ path: `artifacts/private-letter-${width}.png` });
      }
      await page.locator('.story-next').click();
      if (step === 0) {
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.gift-wishes')).opacity === '1');
        await page.locator('.story-motion').click();
        assert.equal(await page.locator('.gift-messenger').evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await page.locator('.gift-messenger').evaluate(e => getComputedStyle(e).animationName), 'none');
      }
      if (step === 3) {
        assert.match(await page.locator('#journal-title').textContent(), /¿Aceptas/);
        assert.doesNotMatch(await page.locator('#memory-dialog').textContent(), /no es una pista|No se envía|Se guarda en tu partida/);
        await page.locator('#gift-response').fill('Sí, acepto ♡');
        await page.screenshot({ path: `artifacts/private-proposal-${width}.png` });
      }
      if (step === 3) await page.locator('.story-next').click();
      await page.waitForFunction(step => window.__MI_MUNDO_DEV__.game.save.giftProgress?.completed === step + 1, step);
      if (step === 3) {
        assert.equal(await page.locator('#gift-response').count(),0);
        assert.equal(await page.locator('.sealed-answer').textContent(),'Sí, acepto ♡');
        await page.screenshot({path:`artifacts/sealed-answer-${width}.png`});
      }
      const playingAudio=songIndex>=0 && gift.songs[songIndex]?.file ? await page.locator('.gift-song audio').elementHandle() : null;
      await page.locator('.journal-close').click();
      if(playingAudio){await page.waitForFunction(a=>a.paused && !a.getAttribute('src'),playingAudio,{timeout:5000});await playingAudio.dispose();}
    }
    assert.equal(await page.locator('.birthday-art').count(), 0);
    await page.reload(); await ready(); assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.giftProgress.completed), 4);
    assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.giftProgress.response), 'Sí, acepto ♡');
    await page.goto('http://127.0.0.1:5174'); await ready();
    assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.giftProgress), undefined, 'preview is isolated from guest save');
    assert.equal((await page.locator('#app').textContent()).includes(gift.message), false);
    assert.deepEqual(errors, []); await page.close();
  }
  console.log('PASS generic world, private preview, 4 ordered clues, exact message, optional response, pause/reduced motion, persistence and preview isolation on mobile/desktop.');
} finally { await browser.close(); }
