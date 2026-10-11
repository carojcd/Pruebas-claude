// Render determinista de la escena: Chromium headless -> fotogramas -> FFmpeg.
// Uso:
//   node scripts/render.mjs --preview 0,60,120        (PNG sueltos en build/preview)
//   node scripts/render.mjs --sub 4 --workers 4      (render completo con motion blur)
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FPS, DURATION_FRAMES } from '../src/timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const BUILD = path.join(ROOT, 'build');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PREVIEW = opt('preview', null);
const IS_PREVIEW = args.includes('--preview');
const SUB = +opt('sub', 4);            // sub-fotogramas por fotograma (motion blur)
const SHUTTER = +opt('shutter', 0.5);  // fracción de fotograma (0.5 = obturador de 180°)
const WORKERS = +opt('workers', 4);
const FIRST = +opt('from', 0), LAST = +opt('to', DURATION_FRAMES - 1);
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(SRC, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(SRC) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/scene.html`;

const browser = await chromium.launch({ executablePath: EXE, args: ['--disable-lcd-text', '--force-color-profile=srgb', '--hide-scrollbars',
  // composición determinista: rasteriza todas las teselas antes de dibujar (sin checkerboarding)
  '--run-all-compositor-stages-before-draw', '--disable-checker-imaging', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-new-content-rendering-timeout', '--disable-partial-raster'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e));
  page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
  await page.goto(URL_);
  await page.evaluate(() => window.__ready);
  return page;
}
async function shot(page, f, file, type = 'jpeg') {
  await page.evaluate((x) => window.renderFrame(x), f);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 96 } : {}), animations: 'disabled', caret: 'hide' });
}

const t0 = Date.now();
if (IS_PREVIEW) {
  const dir = path.join(BUILD, 'preview'); fs.mkdirSync(dir, { recursive: true });
  const page = await newPage();
  if (opt('flat', null)) { await page.evaluate(() => window.renderFlat()); await page.screenshot({ path: path.join(dir, 'flat.png') }); }
  for (const f of (PREVIEW || '').split(',').filter(Boolean).map(Number)) {
    const s = Date.now();
    await shot(page, f, path.join(dir, `f${String(f).padStart(3, '0')}.png`), 'png');
    console.log('frame', f, Date.now() - s, 'ms');
  }
} else {
  const dir = path.join(BUILD, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const jobs = [];
  for (let f = FIRST; f <= LAST; f++) for (let k = 0; k < SUB; k++) jobs.push([f, k]);
  let next = 0, done = 0;
  const worker = async () => {
    const page = await newPage();
    while (next < jobs.length) {
      const [f, k] = jobs[next++];
      const off = SUB > 1 ? ((k + 0.5) / SUB - 0.5) * SHUTTER : 0; // obturador centrado en el fotograma
      await shot(page, f + off, path.join(dir, `s${String(f * SUB + k).padStart(5, '0')}.jpg`));
      if (++done % 200 === 0) console.log(`${done}/${jobs.length} sub-fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  const tCap = (Date.now() - t0) / 1000;
  console.log(`captura: ${tCap.toFixed(1)} s`);
  // Promediado temporal (motion blur) + codificación de vídeo sin audio
  const silent = path.join(BUILD, 'video_noaudio.mp4');
  const vf = SUB > 1 ? `tmix=frames=${SUB}:weights='${Array(SUB).fill(1).join(' ')}',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)` : 'null';
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-nostats', '-framerate', String(FPS * SUB), '-start_number', String(FIRST * SUB), '-i', path.join(dir, 's%05d.jpg'),
    '-vf', `${vf},format=yuv420p`, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', silent], { stdio: 'inherit' });
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  console.log(`codificación: ${((Date.now() - t0) / 1000 - tCap).toFixed(1)} s`);
}
console.log(`total: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
server.close();
