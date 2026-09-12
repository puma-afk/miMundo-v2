import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const base = process.env.GAME_URL || 'http://127.0.0.1:5174';
const failures = [];
const results = [];
await fs.mkdir('artifacts', { recursive: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
async function ready(page) {
  page.on('pageerror', e => failures.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => !!window.__MI_MUNDO_DEV__ && !document.getElementById('loading'), undefined, { timeout: 120000 });
  await page.evaluate(() => { window.__MI_MUNDO_DEV__.world.sky.auto = false; });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__MI_MUNDO_DEV__.world.modelReady);
  assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.world.scene.getMeshByName('tree-trunk').isEnabled()), false, 'optimized GLB replaces fallback');
}
async function approach(page, id) {
  await page.evaluate(id => {
    const world = window.__MI_MUNDO_DEV__.world;
    const target = world.targets.find(t => t.id === id);
    world.avatar.root.position.set(target.position.x, target.position.y, target.position.z + 1.3);
  }, id);
  await page.waitForFunction(id => window.__MI_MUNDO_DEV__.world.nearest?.id === id, id);
}
try {
  const page = await context.newPage(); await ready(page);
  await page.screenshot({ path: 'artifacts/desktop-intro.png' });
  await page.getByRole('button', { name: 'Entrar al jardín' }).click();
  const before = await page.evaluate(() => window.__MI_MUNDO_DEV__.world.avatar.root.position.asArray());
  await page.keyboard.down('KeyW');
  await page.waitForFunction(before => {
    const p = window.__MI_MUNDO_DEV__.world.avatar.root.position;
    return Math.hypot(p.x - before[0], p.z - before[2]) > 0.5;
  }, before);
  await page.keyboard.up('KeyW'); results.push('keyboard movement');
  await approach(page, 'luna-01');
  await page.locator('#action').click(); await page.waitForFunction(() => !window.__MI_MUNDO_DEV__.game.busy && !window.__MI_MUNDO_DEV__.world.avatar.caring);
  await page.waitForFunction(() => !!window.__MI_MUNDO_DEV__.game.save.plants['luna-01']);
  await page.locator('#action').click(); await page.waitForFunction(() => !window.__MI_MUNDO_DEV__.game.busy && !window.__MI_MUNDO_DEV__.world.avatar.caring);
  await page.waitForFunction(() => window.__MI_MUNDO_DEV__.game.save.plants['luna-01'].wateredAt !== null);
  results.push('plant and water through UI');
  await page.screenshot({ path: 'artifacts/desktop-play.png' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__MI_MUNDO_DEV__ && !document.getElementById('loading'));
  assert.equal(await page.evaluate(() => Object.keys(window.__MI_MUNDO_DEV__.game.save.plants).length), 1);
  assert.notEqual(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.plants['luna-01'].wateredAt), null);
  results.push('IndexedDB persistence after reload');
  await page.getByRole('button', { name: 'Entrar al jardín' }).click();
  await page.getByRole('button', { name: 'Abrir recuerdos' }).click();
  assert.equal(await page.locator('#memory-dialog').evaluate(d => d.open), true);
  await page.screenshot({ path: 'artifacts/memory.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#memory-dialog').evaluate(d => d.open), false);
  results.push('memory modal and Escape');
  await page.getByRole('button', { name: 'Abrir ajustes' }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar jardín' }).click();
  const download = await downloading; const saved = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  assert.equal(saved.schemaVersion, 1); assert.equal(Object.keys(saved.plants).length, 1);
  results.push('export valid save');
  await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":99}') });
  await page.getByRole('button', { name: 'Reemplazar jardín' }).click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('no es compatible'));
  assert.equal(await page.evaluate(() => Object.keys(window.__MI_MUNDO_DEV__.game.save.plants).length), 1);
  results.push('invalid import preserves garden');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.locator('#hour').evaluate(el => { el.value = '21'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'artifacts/night.png' });
  results.push('sky time control');
  const other = await context.newPage(); await ready(other); await other.getByRole('button', { name: 'Entrar al jardín' }).click();
  await approach(page, 'luna-02'); await page.locator('#action').click(); await page.waitForFunction(() => !window.__MI_MUNDO_DEV__.game.busy && !window.__MI_MUNDO_DEV__.world.avatar.caring);
  await page.waitForFunction(() => !!window.__MI_MUNDO_DEV__.game.save.plants['luna-02']);
  await approach(other, 'luna-03'); await other.locator('#action').click();
  await other.waitForFunction(() => document.getElementById('toast').textContent.includes('otra pestaña'));
  assert.equal(await other.evaluate(() => !!window.__MI_MUNDO_DEV__.game.save.plants['luna-03']), false);
  results.push('stale tab cannot overwrite progress'); await other.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage(); await ready(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.screenshot({ path: 'artifacts/mobile-intro.png' });
  await mobile.getByRole('button', { name: 'Entrar al jardín' }).tap();
  const box = await mobile.locator('#joystick').boundingBox(); assert.ok(box);
  const start = await mobile.evaluate(() => window.__MI_MUNDO_DEV__.world.avatar.root.position.asArray());
  await mobile.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await mobile.mouse.down();
  await mobile.mouse.move(box.x + box.width / 2, box.y + 10);
  await mobile.waitForFunction(start => {
    const p = window.__MI_MUNDO_DEV__.world.avatar.root.position;
    return Math.hypot(p.x - start[0], p.z - start[2]) > 0.5;
  }, start);
  await mobile.mouse.up();
  await approach(mobile, 'luna-01'); await mobile.locator('#action').tap();
  await mobile.waitForFunction(() => !!window.__MI_MUNDO_DEV__.game.save.plants['luna-01']);
  await mobile.screenshot({ path: 'artifacts/mobile-play.png' });
  results.push('mobile viewport, joystick and touch planting');
  await mobileContext.close();
  assert.deepEqual(failures, []);
  const report = { passed: results, errors: failures, note: 'Headless Edge; emulated mobile viewport/touch, not a physical-device performance benchmark.' };
  await fs.writeFile('artifacts/browser-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
