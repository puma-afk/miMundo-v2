import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const b=await chromium.launch({headless:true,channel:'msedge'});
const token='00000000-0000-4000-8000-000000000099',gift={id:'test-gift',firstName:'Destinataria',fullName:'Persona de prueba',dateLabel:'Un día',age:23,dedication:'Firma',message:'Una carta compartida de prueba',songs:[]};
try{for(const width of [390,1440]){const p=await b.newPage({viewport:{width,height:844},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));let reads=0,posted=false;
const signed=width===1440, user={id:'00000000-0000-4000-8000-000000000002',aud:'authenticated',email:'visitor@example.invalid',role:'authenticated',app_metadata:{},user_metadata:{}};
if(signed)await p.addInitScript(({user})=>localStorage.setItem('sb-lnjwbnhhwsmtonuxlasd-auth-token',JSON.stringify({access_token:'test-token',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user})),{user});
await p.route('https://lnjwbnhhwsmtonuxlasd.supabase.co/**',r=>{const path=new URL(r.request().url()).pathname;
 if(path.endsWith('/read_world_visit_v2'))return r.fulfill({contentType:'application/json',body:JSON.stringify({token,code:'ABCDEF123456',gift,save:{schemaVersion:1,plants:{},memoriesRead:[],giftProgress:{id:'test-gift',completed:0},messages:{'tomorrow-door':'Una dedicatoria compartida'}}})});
 if(path.endsWith('/user'))return r.fulfill({contentType:'application/json',body:JSON.stringify(user)});
 if(path.endsWith('/add_visit_comment')){assert.equal(r.request().postDataJSON().p_body,'Una visita bonita');posted=true;return r.fulfill({contentType:'application/json',body:'null'});}
 if(path.endsWith('/delete_visit_comment')){posted=false;return r.fulfill({contentType:'application/json',body:'null'});}
 if(path.endsWith('/read_visit_comments')){reads++;return r.fulfill({contentType:'application/json',body:JSON.stringify([{id:'1',nickname:'Viajera',body:posted?'Una visita bonita':'<script>No ejecutar</script> Qué bonito jardín',created_at:new Date().toISOString(),can_delete:posted}])});}
 throw Error('Unexpected request '+path);
});
await p.goto('http://127.0.0.1:5174/?visit=ABCDEF123456');await p.locator('#intro-title').waitFor({state:'visible',timeout:120000});await p.locator('#loading').waitFor({state:'detached',timeout:120000});await p.locator('#enter').click();
await p.evaluate(()=>{const w=window.__MI_MUNDO_DEV__.world,t=w.targets.find(t=>t.id==='tomorrow-door');w.avatar.root.position.set(t.position.x,t.position.y,t.position.z+1.3);});await p.waitForFunction(()=>window.__MI_MUNDO_DEV__.world.nearest?.id==='tomorrow-door');
await p.locator('#object-message').click();assert.equal(await p.locator('#message-editor').isVisible(),false);assert.equal(await p.locator('#edit-message').isVisible(),false);assert.match(await p.locator('#message-dedication').textContent(),/dedicatoria compartida/);await p.getByRole('button',{name:'Cerrar mensaje',exact:true}).click();
await p.locator('#action').click();await p.locator('.story-next').click();assert.match(await p.locator('.story-page-content').textContent(),/carta compartida/);await p.locator('.story-next').click();assert.equal(await p.locator('#gift-response').count(),0);
await p.locator('.card-conversation summary').click();await p.locator('.comment-list article').waitFor();assert.equal(await p.locator('.comment-list script').count(),0);assert.equal(await p.locator('.comment-login').isVisible(),!signed);assert.equal(await p.locator('.comment-form').isVisible(),signed);
if(signed){await p.locator('.comment-form textarea').fill('Una visita bonita');await p.locator('.comment-form button').click();await p.getByRole('button',{name:'Eliminar',exact:true}).waitFor();assert.equal(posted,true);await p.getByRole('button',{name:'Eliminar',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.comment-list p')?.textContent.includes('No ejecutar'));assert.equal(posted,false);}assert.ok(reads);
await p.screenshot({path:`artifacts/shared-card-comments-${width}.png`});
assert.equal(await p.evaluate(()=>{const g=window.__MI_MUNDO_DEV__.game;return g.setMessage('welcome','forbidden').then(()=>false,()=>true);}),true);
assert.deepEqual(errors,[]);await p.close();}
console.log('PASS shared event out of order, read-only unanswered proposal and dedications, anonymous comments and safe text, mobile/desktop.');}finally{await b.close();}
