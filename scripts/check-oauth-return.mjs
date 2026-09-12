import fs from 'node:fs';
const origin='https://lnjwbnhhwsmtonuxlasd.supabase.co';const results=[];
for(const base of ['http://localhost:5174','http://127.0.0.1:5174','https://mimundo-v2.pages.dev']){
 const target=base+'/?visit=00000000-0000-4000-8000-000000000000';const url=new URL(origin+'/auth/v1/authorize');url.searchParams.set('provider','google');url.searchParams.set('redirect_to',target);
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000)});const location=r.headers.get('location');let destination=null,google=false;
 if(location){const u=new URL(location);google=u.hostname==='accounts.google.com';const state=u.searchParams.get('state');if(state?.split('.').length===3){const claims=JSON.parse(Buffer.from(state.split('.')[1],'base64url').toString());destination=claims.referrer??claims.redirect_to??null;}}
 results.push({requestedOrigin:base,status:r.status,googleRedirect:google,returnDestination:destination,visitPreserved:destination===null?null:destination===target});
}
fs.writeFileSync('artifacts/oauth-return-check.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
