import { defineConfig } from 'vite';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

export default defineConfig({
  plugins: [{ name: 'local-private-gift-preview', apply: 'serve', configureServer(server) {
    server.middlewares.use('/__private-gift-audio', async (req, res) => {
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') || !['GET','HEAD'].includes(req.method ?? '')) { res.statusCode=404;res.end();return; }
      res.setHeader('Cache-Control','no-store');
      try {
        const index = new URL(req.url ?? '/', 'http://localhost').searchParams.get('track');
        if (!/^[0-4]$/.test(index ?? '')) throw new Error('Invalid track');
        const gift = JSON.parse(await readFile(new URL('./private-gifts/gift.json',import.meta.url),'utf8'));
        const file = gift.songs[Number(index)]?.file;
        if (typeof file !== 'string' || !/^[a-z0-9][a-z0-9.-]+\.(mp3|mpeg)$/i.test(file) || file.includes('..')) throw new Error('Invalid file');
        const path = new URL('./private-gifts/audio/'+file,import.meta.url); const {size}=await stat(path);
        let start=0,end=size-1;
        if (req.headers.range) {
          const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
          if (!match || (start=Number(match[1]))>=size || (end=match[2] ? Math.min(Number(match[2]),size-1) : end)<start) { res.statusCode=416;res.setHeader('Content-Range',`bytes */${size}`);res.end();return; }
          res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
        }
        res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
        if(req.method==='HEAD') {res.end();return;}
        const stream=createReadStream(path,{start,end});res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
      } catch { res.statusCode=404;res.end(); }
    });
    server.middlewares.use('/__private-gift-preview', async (req, res) => {
      const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
      res.setHeader('Cache-Control', 'no-store');
      if (!loopback || req.method !== 'GET') { res.statusCode = 404; res.end(); return; }
      try { const gift = await readFile(new URL('./private-gifts/gift.json', import.meta.url), 'utf8'); res.setHeader('Content-Type', 'application/json'); res.end(gift); }
      catch { res.statusCode = 404; res.end(); }
    });
  } }],
  base: './',
  server: { port: 5174, strictPort: true, fs: { deny: ['**/.env', '**/.env.*', '**/*.{crt,pem}', '**/.git/**', '**/private-gifts/**'] } },
  build: { target: 'es2022', chunkSizeWarningLimit: 1800 },
});
