import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=path.resolve(root,'../ENTREGA-GITHUB-2026-09-12');
try {await fs.access(destination);throw new Error('La entrega ya existe. No se sobrescribe.');} catch(e){if(e.code!=='ENOENT')throw e;}
const github=path.join(destination,'github');await fs.mkdir(github,{recursive:true});
for(const entry of ['src','public','scripts','tests','supabase','docs','.gitignore','.node-version','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','vite.config.ts','index.html','README.md']) await fs.cp(path.join(root,entry),path.join(github,entry),{recursive:true});
const files=[];async function walk(dir){for(const d of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())await walk(p);else files.push(p);}}await walk(github);
const recipient=JSON.parse(await fs.readFile(path.join(root,'private-gifts/recipient.json'),'utf8'));
const gift=JSON.parse(await fs.readFile(path.join(root,'private-gifts/gift.json'),'utf8'));
for(const p of files){
 if(/\.(md|ts|json|sql|mjs|html|css|yaml)$/i.test(p)){const text=await fs.readFile(p,'utf8');for(const secret of [recipient.email,gift.message,gift.fullName])if(text.includes(secret))throw new Error('Contenido privado detectado: '+path.relative(github,p));}
}
await fs.writeFile(path.join(destination,'LEEME-PRIMERO.md'),`# Entrega del 12 de septiembre — versión 1.0

Sube SOLO el contenido de la carpeta github al repositorio miMundo-v2. package.json debe quedar en la raíz del repositorio. Esta carpeta reemplaza la entrega anterior del día 10.

1. En Supabase → SQL Editor pega TODO el archivo privado que está en mundo-v2/private-gifts/ACTIVAR-REGALO.sql y pulsa Run. Incluye las migraciones y el correo destinatario; no necesitas su UID. No subas ese archivo a GitHub.
2. Si no lo hiciste, sube los dos MP3 de mundo-v2/private-gifts/audio a Storage → gift-audio → september-gift-2026. Conserva sus nombres y el bucket privado.
3. Sube el contenido de github a https://github.com/puma-afk/miMundo-v2.
4. En Cloudflare Pages conecta el repositorio. Build: pnpm build. Salida: dist. Raíz vacía. Variables: NODE_VERSION=24.19.0 y PNPM_VERSION=11.19.0.
5. Copia el dominio público a Supabase → Authentication → URL Configuration: Site URL y Redirect URLs (con / final). Agrégalo también como origen JavaScript del cliente Google OAuth; conserva el callback de Supabase.
6. Prueba Google, guardado y recuperación en el dominio publicado antes de compartirlo. La destinataria recibe automáticamente el regalo al entrar con el correo confirmado configurado. Otras cuentas reciben un mundo normal.

La entrega no contiene las canciones privadas, la carta personal ni el correo destinatario. Estos se mantienen en Supabase. El código está preparado localmente; publicar y ejecutar el SQL en tu panel siguen siendo pasos manuales.

Detalle técnico y pruebas: github/docs/ENTREGA-1.0.md.
`);
await fs.writeFile(path.join(destination,'manifest.json'),JSON.stringify({version:'1.0.0',files:files.map(p=>path.relative(github,p)),count:files.length},null,2));
console.log(`Entrega preparada: ${destination} (${files.length} archivos, verificados sin datos privados).`);
