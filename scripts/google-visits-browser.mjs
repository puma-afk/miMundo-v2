import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const context = await browser.newContext({ viewport: { width:390, height:844 } });
  const page = await context.newPage();
  let authorize;
  let giftClaimed=false;
  const assignedGift={id:'assigned-test',firstName:'Destinataria asignada',fullName:'Destinataria de prueba',dateLabel:'Un día especial',age:23,dedication:'Una firma de prueba',message:'Mensaje de prueba asignado por servidor',songs:[]};
  const owner = '00000000-0000-4000-8000-000000000001';
  const user = { id:owner,aud:'authenticated',role:'authenticated',email:'google-test@example.invalid',app_metadata:{provider:'google'},user_metadata:{},created_at:new Date().toISOString() };
  const exp = Math.floor(Date.now()/1000)+3600;
  const access = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:owner,exp,role:'authenticated'})).toString('base64url')}.test-only`;
  let exchanged = false;
  await context.route('https://lnjwbnhhwsmtonuxlasd.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/auth/v1/authorize') { authorize = url; return route.fulfill({ contentType:'text/html', body:'<p>Google redirect intercepted for test</p>' }); }
    if (url.pathname === '/auth/v1/token') {
      assert.equal(url.searchParams.get('grant_type'),'pkce'); assert.ok(route.request().postDataJSON().code_verifier); exchanged = true;
      return route.fulfill({contentType:'application/json',body:JSON.stringify({access_token:access,refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,user})});
    }
    if (url.pathname === '/auth/v1/user') return route.fulfill({contentType:'application/json',body:JSON.stringify(user)});
    if (url.pathname === '/rest/v1/world_saves') return route.fulfill({contentType:'application/json',body:'[]'});
    if (url.pathname === '/rest/v1/world_gifts') return route.fulfill({contentType:'application/json',body:JSON.stringify(giftClaimed?[{payload:assignedGift}]:[])});
    if (url.pathname === '/rest/v1/rpc/claim_my_gift') {giftClaimed=true;return route.fulfill({contentType:'application/json',body:'true'});}
    if (url.pathname === '/rest/v1/rpc/read_world_visit') return route.fulfill({contentType:'application/json',body:JSON.stringify({ schemaVersion:1,plants:{},memoriesRead:[],currentIsland:'garden' })});
    throw new Error('Unexpected request: ' + url.pathname);
  });
  await page.goto('http://localhost:5174/');
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  await page.locator('#account').click(); await page.locator('#account-google').click();
  await page.waitForURL('https://lnjwbnhhwsmtonuxlasd.supabase.co/auth/v1/authorize**');
  assert.equal(authorize.searchParams.get('provider'),'google');
  assert.equal(authorize.searchParams.get('redirect_to'),'http://localhost:5174/');
  assert.ok(authorize.searchParams.get('code_challenge'));
  assert.equal(authorize.searchParams.get('code_challenge_method'),'s256');
  await page.goto('http://localhost:5174/?code=test-code');
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  assert.equal(exchanged,true);
  assert.equal(giftClaimed,true);assert.match(await page.locator('#intro-title').textContent(),/Destinataria asignada/);
  await page.locator('#account').click();
  assert.match(await page.locator('#account-identity').textContent(), /google-test@example.invalid/);
  assert.equal(new URL(page.url()).searchParams.has('code'),false);
  await page.goto('http://localhost:5174/?visit=00000000-0000-4000-8000-000000000001');
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  assert.equal(await page.locator('#account').count(),0);
  assert.equal(await page.locator('#settings').isVisible(),false);
  assert.equal(await page.locator('.visit-home').isVisible(),true);
  assert.equal(await page.locator('.gift-preview-bar,.preview-entry').count(),0);
  assert.equal(await page.locator('.visit-home svg').count(),1);
  assert.equal(await page.locator('#gift-response').count(),0);
  assert.equal((await page.locator('#app').textContent()).includes(assignedGift.firstName),false);
  await page.locator('#enter').click();
  assert.equal(await page.locator('#object-message').isVisible(),false);
  await context.route('**/__private-gift-preview', route => route.fulfill({contentType:'application/json',body:JSON.stringify({id:'preview-test',firstName:'Vista de prueba',fullName:'Vista de prueba',dateLabel:'Un día',age:23,dedication:'Prueba',message:'Carta privada de prueba',songs:[]})}));
  await page.goto('http://localhost:5174/?gift-preview=1');
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  assert.match(await page.locator('#intro-title').textContent(), /Vista de prueba/);
  await page.locator('#preview-account').click();
  await page.waitForURL('**account=1');
  await page.locator('#account-dialog').waitFor({state:'visible',timeout:120000});
  assert.match(await page.locator('#account-identity').textContent(),/google-test@example.invalid/);
  await page.locator('#account-close').click();
  await page.getByRole('link',{name:'Probar evento'}).click();
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  assert.match(await page.locator('#intro-title').textContent(),/Vista de prueba/);
  assert.equal(await page.locator('#account').count(),0);
  await page.getByRole('button',{name:'Probar desde el inicio'}).click();
  await page.waitForURL('**preview-run=*');
  await page.locator('#intro-title').waitFor({state:'visible',timeout:120000}); await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  assert.equal(await page.evaluate(() => window.__MI_MUNDO_DEV__.game.save.giftProgress),undefined);
  assert.match(await page.locator('#intro-title').textContent(), /Vista de prueba/);
  console.log('PASS Google PKCE redirect and anonymous read-only visit. No real Google login performed.');
} finally { await browser.close(); }
