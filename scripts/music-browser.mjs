import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() => {
  const OriginalAudio = window.Audio;
  window.Audio = function(...args) { const element = new OriginalAudio(...args); window.__testMedia = element; return element; };
  const OriginalContext = window.AudioContext;
  window.AudioContext = class extends OriginalContext {
    createGain() {
      const node = super.createGain();
      if (!window.__testAudio) {
        const analyser = this.createAnalyser(); analyser.fftSize = 2048;
        const silent = super.createGain(); silent.gain.value = 0;
        node.connect(analyser); analyser.connect(silent); silent.connect(this.destination);
        window.__testAudio = { context: this, analyser };
      }
      return node;
    }
  };
});
const errors = [], results = [], requests = [];
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => requests.push(r.url()));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174', { waitUntil: 'networkidle', timeout: 120000 });
  await page.locator('#loading').waitFor({ state: 'detached' });
  assert.equal(requests.some(url => url.endsWith('.mp3')), false);
  await page.getByRole('button', { name: 'Abrir música' }).click();
  assert.equal(await page.locator('#music-track option').count(), 4);
  await page.getByRole('button', { name: 'Reproducir música' }).click();
  await page.waitForFunction(() => {
    const probe = window.__testAudio;
    if (!probe || probe.context.state !== 'running') return false;
    const samples = new Float32Array(2048); probe.analyser.getFloatTimeDomainData(samples);
    return samples.some(s => Math.abs(s) > 0.001) && samples.every(s => Number.isFinite(s) && Math.abs(s) <= 1);
  });
  results.push('first original melody produces a non-silent, non-clipped audio signal');
  await page.getByRole('button', { name: 'Canción siguiente' }).click();
  await page.waitForFunction(() => document.getElementById('music-track').value === 'fireflies' && document.getElementById('music-status').textContent.includes('Ahora suena'));
  await page.getByRole('button', { name: 'Canción siguiente' }).click();
  await page.waitForFunction(() => document.getElementById('music-track').value === 'clouds' && document.getElementById('music-status').textContent.includes('Ahora suena'));
  assert.equal(requests.some(url => url.endsWith('.mp3')), false);
  results.push('three generated tracks switch without music downloads');
  await page.locator('#music-volume').evaluate(el => { el.value = '18'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.locator('#music-volume-value').textContent(), '18 %');
  await page.getByRole('button', { name: 'Pausar música' }).click();
  await page.waitForFunction(() => window.__testAudio.context.state === 'suspended');
  results.push('volume and pause');
  await page.reload({ waitUntil: 'networkidle' }); await page.locator('#loading').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Abrir música' }).click();
  assert.equal(await page.locator('#music-track').inputValue(), 'clouds');
  assert.equal(await page.locator('#music-volume').inputValue(), '18');
  assert.equal(await page.getByRole('button', { name: 'Reproducir música' }).count(), 1);
  assert.equal(await page.evaluate(() => !!window.__testAudio), false);
  results.push('preferences survive reload without autoplay');
  await page.locator('#music-track').selectOption('personal');
  assert.equal(requests.some(url => url.endsWith('.mp3')), false);
  await page.getByRole('button', { name: 'Reproducir música' }).click();
  await page.waitForFunction(() => window.__testMedia?.currentTime > 0 && !window.__testMedia.paused && Number.isFinite(window.__testMedia.duration));
  results.push('original MP3 decodes and plays only on request');
  await page.evaluate(() => window.__testMedia.dispatchEvent(new Event('ended')));
  await page.waitForFunction(() => document.getElementById('music-track').value === 'leaves' && document.getElementById('music-status').textContent.includes('Ahora suena'));
  results.push('track end advances and wraps playlist');
  await page.getByRole('button', { name: 'Pausar música' }).click();
  await fs.mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/music-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await page.locator('#music-dialog').boundingBox();
  assert.ok(dialog && dialog.x >= 0 && dialog.x + dialog.width <= 390);
  await page.screenshot({ path: 'artifacts/music-mobile.png' });
  results.push('mobile music panel fits viewport');
  assert.deepEqual(errors, []);
  await fs.writeFile('artifacts/music-results.json', JSON.stringify({ passed: results, errors }, null, 2));
  console.log(JSON.stringify({ passed: results, errors }, null, 2));
} finally { await browser.close(); }
