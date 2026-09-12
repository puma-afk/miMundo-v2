// Produces a private SQL assignment only; never connects to the database.
import { readFile, writeFile } from 'node:fs/promises';
const owner = process.argv[2];
if (!owner || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner)) throw new Error('Indica el UUID de la cuenta destinataria: node scripts/prepare-private-gift.mjs UUID');
const payload = JSON.parse(await readFile(new URL('../private-gifts/gift.json', import.meta.url), 'utf8'));
const literal = JSON.stringify(payload).replaceAll("'", "''");
const sql = `-- PRIVATE: do not commit or upload this file to GitHub.\nbegin;\ninsert into public.world_gifts(owner_id,payload) values ('${owner}', '${literal}'::jsonb)\non conflict(owner_id) do update set payload = excluded.payload, updated_at = now();\ncommit;\n`;
await writeFile(new URL('../private-gifts/assign-gift.sql', import.meta.url), sql);
console.log('Asignación preparada en private-gifts/assign-gift.sql. No se ejecutó en Supabase.');
