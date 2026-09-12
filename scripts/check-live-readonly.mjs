import fs from 'node:fs';
const c=fs.readFileSync('src/content/cloud.ts','utf8');const url=c.match(/https:\/\/[^']+/)[0],key=c.match(/sb_publishable_[^']+/)[0];
const headers={apikey:key,'Content-Type':'application/json'};
const checks=[['auth settings','/auth/v1/settings'],['visit lookup','/rest/v1/rpc/read_world_visit_v2',{p_key:'00000000-0000-4000-8000-000000000000'}],['comments lookup','/rest/v1/rpc/read_visit_comments',{p_token:'00000000-0000-4000-8000-000000000000',p_story:'welcome',p_before:null}],...['world_saves','world_gifts','gift_invitations','visit_comments','world_visits'].map(t=>[t,'/rest/v1/'+t+'?select=*&limit=0'])];
const results=[];
for(const [name,path,body] of checks){try{const r=await fetch(url+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});const data=await r.json();results.push({name,status:r.status,...(name==='auth settings'?{googleEnabled:data.external?.google}:body?{result:data,}: {code:data.code})});}catch(e){results.push({name,error:e.message});}}
fs.writeFileSync('artifacts/live-readonly-check.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
