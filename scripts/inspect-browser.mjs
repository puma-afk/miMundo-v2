// Use an installed Playwright package: set PLAYWRIGHT_MODULE to its index.mjs.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); console.error(m.text()); } });
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174', { waitUntil: 'networkidle', timeout: 120000 });
await page.locator('#loading').waitFor({ state: 'detached', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.__MI_MUNDO_DEV__?.world.modelReady);
if (process.env.PREVIEW_GLB) {
  await page.evaluate(async () => {
    const { world } = window.__MI_MUNDO_DEV__;
    const { ModelLibrary } = await import('/src/infrastructure/assets/modelLibrary.ts');
    const library = new ModelLibrary(world.scene);
    const container = await library.load('/assets/models/arbol-mobile.glb');
    const root = container.createRootMesh(); container.addAllToScene();
    const bounds = root.getHierarchyBoundingVectors(true);
    const scale = 7.2 / (bounds.max.y - bounds.min.y);
    root.scaling.setAll(scale); root.position.set(-1.4, 0.2 - bounds.min.y * scale, -3);
    world.scene.getMeshByName('tree-trunk')?.setEnabled(false);
    world.scene.getMeshByName('tree-canopy')?.setEnabled(false);
    world.sky.auto = false;
    await world.scene.whenReadyAsync();
  });
}
await fs.mkdir('artifacts', { recursive: true });
await page.screenshot({ path: 'artifacts/desktop-intro.png' });
console.log(JSON.stringify({ title: await page.title(), errors }, null, 2));
await browser.close();
