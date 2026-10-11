// Diagnóstico: estado calculado de elementos en fotogramas concretos
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const SRC = path.resolve('src');
const server = http.createServer((q, r) => { const p = path.join(SRC, new URL(q.url, 'http://x').pathname); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(p)] }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${server.address().port}/scene.html`); await page.evaluate(() => window.__ready);
for (const f of process.argv.slice(2).map(Number)) {
  const s = await page.evaluate((f) => {
    window.renderFrame(f);
    const q = (id) => document.getElementById(id);
    const r = (el) => { const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v)).join(','); };
    return { cam: q('cam').style.transform, cal: q('cal').style.transform, fog: q('cal').style.getPropertyValue('--fog'), plate: r(q('calPlate')), att: q('att').style.transform, cardT: q('card3').style.transform };
  }, f);
  console.log(f, JSON.stringify(s));
}
await b.close(); server.close();
