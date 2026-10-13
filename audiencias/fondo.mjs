// Exporta el fondo (sin la tarjeta) del último fotograma como PNG 1080×1920.
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const R = path.dirname(new URL(import.meta.url).pathname);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = path.join(R, new URL(q.url, 'http://x').pathname); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://127.0.0.1:${srv.address().port}/scene.html`); await pg.evaluate(() => window.__ready);
await pg.evaluate(() => { window.renderFrame(359); document.getElementById('persp').style.display = 'none'; });
await pg.screenshot({ path: path.join(R, '..', 'LITIVO_FONDO_9x16.png') });
await b.close(); srv.close();
