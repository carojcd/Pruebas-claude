// Diagnóstico: ¿depende el fotograma N del historial de fotogramas renderizados antes?
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const SRC = path.resolve('src');
const server = http.createServer((q, r) => { const p = path.join(SRC, new URL(q.url, 'http://x').pathname); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(p)] }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const target = +process.argv[2];
for (const hist of process.argv.slice(3)) {
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/scene.html`); await page.evaluate(() => window.__ready);
  for (const h of hist ? hist.split(',').filter(Boolean).map(Number) : []) { await page.evaluate((x) => window.renderFrame(x), h); await page.screenshot({ type: 'jpeg', quality: 10 }); }
  await page.evaluate((x) => window.renderFrame(x), target);
  const buf = await page.screenshot({ clip: { x: 0, y: 1000, width: 1080, height: 600 } });
  const mean = await page.evaluate(() => 0);
  fs.writeFileSync(`build/preview/hist_${hist || 'cold'}.png`, buf);
  console.log(hist || 'cold', buf.length);
  await page.close();
}
await b.close(); server.close();
