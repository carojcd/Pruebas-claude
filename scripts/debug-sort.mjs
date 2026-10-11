// Diagnóstico: qué elementos rompen el ordenamiento 3D de Chromium en un fotograma dado
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const SRC = path.resolve('src');
const server = http.createServer((q, r) => { const p = path.join(SRC, new URL(q.url, 'http://x').pathname); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(p)] }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${server.address().port}/scene.html`); await page.evaluate(() => window.__ready);
const f = +process.argv[2];
const tests = { calPlateZ: '__calz__', farArcs: '.far-arcs', worldHalo: '.world-halo', mainBg: '#mainBg', sidebar: '#sidebar', topbar: '#topbar', hdr: '#hDate,#hTitle,#hSub,#hCta', sec: '.sec-title,.sec-more', calEdge: '#calEdge,#calSweep', attEdge: '#attEdge,#attSweep',  none: '', scan: '#scanLine,#scanBand', halo: '.world-halo,.far-arcs', trails: '.trail', attRows: '#att .row3d', att: '#att', cards: '.card3d', zeroOpacity: '__zero__', dashEdge: '#dashEdge', shadows: '.cshadow,.slot' };
for (const [name, sel] of Object.entries(tests)) {
  await page.evaluate(([f, sel]) => {
    document.querySelectorAll('[data-dbg]').forEach((e) => { e.style.visibility = ''; e.removeAttribute('data-dbg'); });
    window.renderFrame(f);
    let list = [];
    if (sel === '__zero__') list = [...document.querySelectorAll('#cam *')].filter((e) => getComputedStyle(e).opacity === '0');
    else if (sel) list = [...document.querySelectorAll(sel)];
    list.forEach((e) => { e.style.visibility = 'hidden'; e.setAttribute('data-dbg', 1); });
  }, [f, sel]);
  const buf = await page.screenshot({ clip: { x: 0, y: 1000, width: 1080, height: 600 } });
  fs.writeFileSync(`build/preview/dbg_${name}.png`, buf);
  console.log(name, buf.length);
}
await b.close(); server.close();
