// Render determinista: Chromium headless -> fotogramas -> FFmpeg (+ audio sintetizado).
// Uso: node render.mjs --preview 0,60,110,150   |   node render.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(DIR, 'build');
const FPS = 24, FRAMES = 157, WORKERS = 4;
const args = process.argv.slice(2), pi = args.indexOf('--preview');
const PREVIEW = pi >= 0 ? args[pi + 1].split(',').map(Number) : null;
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, 'src', f)).toString('base64');
const html = fs.readFileSync(path.join(DIR, 'scene.html'), 'utf8').replace('__BASE__', b64('base.png')).replace('__ARM__', b64('arm.png')).replace('__NEON__', b64('neon.png'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 890, height: 1600 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e));
  await page.setContent(html); await page.evaluate(() => window.__ready); return page;
}
const shot = async (page, f, file, type) => { await page.evaluate((x) => window.renderFrame(x), f); await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 97 } : {}) }); };
const t0 = Date.now();
if (PREVIEW) {
  const out = path.join(BUILD, 'preview'); fs.mkdirSync(out, { recursive: true });
  const page = await newPage();
  for (const f of PREVIEW) await shot(page, f, path.join(out, `f${String(f).padStart(3, '0')}.png`), 'png');
} else {
  const out = path.join(BUILD, 'frames'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  let next = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await newPage();
    while (next < FRAMES) { const f = next++; await shot(page, f, path.join(out, `f${String(f).padStart(4, '0')}.jpg`), 'jpeg'); }
  }));
  console.log(`captura: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  execFileSync('python3', [path.join(DIR, 'audio.py'), path.join(BUILD, 'audio.wav')], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(out, 'f%04d.jpg'), '-i', path.join(BUILD, 'audio.wav'),
    '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart',
    path.join(DIR, 'BAR_FUMANDO.mp4')], { stdio: 'inherit' });
}
console.log(`total: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
