// End-to-end UI tests with intercepted Supabase responses. Never sends real emails.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const owner = '00000000-0000-4000-8000-000000000001';
const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'player@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() };
const expires = Math.floor(Date.now() / 1000) + 3600;
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: expires, role: 'authenticated' })).toString('base64url')}.test-only`;
const session = { access_token: token, refresh_token: 'test-only-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expires, user };
let remote = null, offline = false, otpRequests = 0, commits = 0;
const errors = [];
try {
  await fs.mkdir('artifacts', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.route('https://lnjwbnhhwsmtonuxlasd.supabase.co/**', async route => {
    if (offline) return route.abort('internetdisconnected');
    const request = route.request(), url = new URL(request.url());
    const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname === '/auth/v1/otp') { otpRequests++; return json({}); }
    if (url.pathname === '/auth/v1/verify' || url.pathname === '/auth/v1/token') return json(session);
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
    if (url.pathname === '/rest/v1/world_saves') return json(remote ? [remote] : []);
    if (url.pathname === '/rest/v1/world_gifts') return json([]);
    if (url.pathname === '/rest/v1/rpc/claim_my_gift') return json(false);
    if (url.pathname === '/rest/v1/rpc/save_my_world') {
      const body = request.postDataJSON(); assert.equal(body.p_owner_id, owner);
      if (remote?.last_operation_id === body.p_operation_id) return json(remote);
      if ((remote?.revision ?? 0) !== body.p_expected_revision) return json({ code: '40001', message: 'conflict' }, 409);
      commits++; remote = { save: body.p_save, revision: (remote?.revision ?? 0) + 1, last_operation_id: body.p_operation_id, updated_at: new Date().toISOString() }; return json(remote);
    }
    throw new Error(`Unexpected backend request: ${url.pathname}`);
  });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  const ready = async () => { await page.waitForFunction(() => window.__MI_MUNDO_DEV__ && !document.getElementById('loading'), { timeout: 120000 }); };
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174'); await ready();
  await page.evaluate(async () => { await window.__MI_MUNDO_DEV__.game.act('luna-01'); });
  await page.locator('#account').click();
  await page.locator('#account-email').fill(user.email); await page.locator('#account-email-form button').click();
  await page.locator('#account-code-form').waitFor({ state: 'visible' }); assert.equal(otpRequests, 1);
  await page.screenshot({ path: 'artifacts/account-mobile-code.png' });
  await page.locator('#account-code').fill('123456'); await page.locator('#account-code-form button[type=submit]').click();
  await page.waitForFunction(() => window.__MI_MUNDO_DEV__?.sync?.status === 'saved'); await ready();
  assert.equal(await page.evaluate(() => Object.keys(window.__MI_MUNDO_DEV__.game.save.plants).length), 0, 'guest world is not silently attached to account');
  await page.locator('#account').click(); await page.locator('#account-adopt-guest').click();
  await page.waitForFunction(() => !!window.__MI_MUNDO_DEV__?.game.save.plants['luna-01']); await ready();
  assert.ok(remote.save.plants['luna-01']);
  await page.evaluate(async () => { await window.__MI_MUNDO_DEV__.game.setMessage('luna-01', 'Mi recuerdo guardado'); await window.__MI_MUNDO_DEV__.sync.sync(); });
  assert.equal(remote.save.messages['luna-01'], 'Mi recuerdo guardado');
  offline = true;
  await page.evaluate(async () => { await window.__MI_MUNDO_DEV__.game.setAvatar('woman'); await window.__MI_MUNDO_DEV__.sync.sync(); });
  assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.sync.pending), true);
  await page.reload(); await ready(); assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.avatar), 'woman');
  offline = false; await page.evaluate(() => window.__MI_MUNDO_DEV__.sync.sync()); assert.equal(remote.save.avatar, 'woman');
  // Another device changes the server before this browser makes another edit.
  remote = { ...remote, save: { ...remote.save, messages: { 'luna-01': 'Otro dispositivo' } }, revision: remote.revision + 1, last_operation_id: crypto.randomUUID() };
  await page.evaluate(async () => { await window.__MI_MUNDO_DEV__.game.setMessage('luna-01', 'Este dispositivo'); await window.__MI_MUNDO_DEV__.sync.sync(); });
  await page.locator('#account').click(); await page.locator('#account-conflict').waitFor({ state: 'visible' });
  await page.screenshot({ path: 'artifacts/account-mobile-conflict.png' });
  assert.equal(remote.save.messages['luna-01'], 'Otro dispositivo');
  await page.locator('#account-use-cloud').click(); await page.locator('#account-confirm').click();
  await ready(); await page.waitForFunction(() => window.__MI_MUNDO_DEV__?.game.save.messages?.['luna-01'] === 'Otro dispositivo');
  await page.locator('#account').click();
  assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.sync.backups.at(-1).save.messages['luna-01']), 'Este dispositivo');
  await page.locator('#account-signout').click();
  await page.waitForFunction(() => window.__MI_MUNDO_DEV__ && !window.__MI_MUNDO_DEV__.sync); await ready();
  assert.ok(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.plants['luna-01']));
  assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.messages?.['luna-01']), undefined, 'account messages do not leak into guest');
  assert.deepEqual(errors, []);
  console.log(`PASS: OTP UI, account/guest isolation, explicit adoption, cloud sync (${commits} writes), offline reload, conflict resolution, avatar, signout, mobile dialogs. Supabase mocked; no real emails sent.`);
} finally { await browser.close(); }
