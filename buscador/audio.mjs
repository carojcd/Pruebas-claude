// Sonido de teclado sintetizado desde cero (sin samples). Cada golpe cae en el fotograma exacto
// en que aparece su carácter (timeline.js). Determinista: PRNG con semilla fija.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, FRAMES, KEYS, ENTER } from './timeline.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000, N = Math.round((FRAMES / FPS) * SR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 51020261;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const noise = () => rnd() * 2 - 1;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

class SVF { // filtro de estado variable TPT
  constructor() { this.a = 0; this.b = 0; }
  run(x, fc, q) {
    const g = Math.tan(Math.PI * clamp(fc, 20, SR * 0.45) / SR), k = 1 / q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - this.b, v1 = a1 * this.a + a2 * v3, v2 = this.b + a2 * this.a + a3 * v3;
    this.a = 2 * v1 - this.a; this.b = 2 * v2 - this.b;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  }
}
const add = (i, v, pan) => { if (i < 0 || i >= N) return; L[i] += v * Math.cos((pan + 1) * Math.PI / 4); R[i] += v * Math.sin((pan + 1) * Math.PI / 4); };

// Una pulsación: clic de contacto + cuerpo de la carcasa + resonancia plástica + retorno de la tecla.
function key(t, { gain = 1, pitch = 1, pan = 0, heavy = false } = {}) {
  const s0 = Math.round(t * SR), len = Math.round(0.16 * SR);
  const f1 = new SVF(), f2 = new SVF(), f3 = new SVF();
  const body = (heavy ? 125 : 205) * pitch, res = (heavy ? 820 : 1150) * pitch, click = (heavy ? 2600 : 3400) * pitch;
  const up = Math.round((heavy ? 0.105 : 0.075 + 0.02 * rnd()) * SR); // la tecla vuelve
  let ph = 0;
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const x = noise();
    const tick = f1.run(x, click, 1.4).bp * Math.exp(-tt / 0.0016) * 1.6;
    const plast = f2.run(x, res, 6).bp * Math.exp(-tt / (heavy ? 0.022 : 0.014)) * 0.9;
    ph += body * (1 + 0.4 * Math.exp(-tt / 0.004)) / SR;
    const thump = Math.sin(TAU * ph) * Math.exp(-tt / (heavy ? 0.04 : 0.022)) * (1 - Math.exp(-tt / 0.0008)) * (heavy ? 0.9 : 0.55);
    let rel = 0;
    if (n >= up) { const u = (n - up) / SR; rel = f3.run(noise(), click * 1.25, 1.6).bp * Math.exp(-u / 0.0012) * (heavy ? 0.7 : 0.45); }
    add(s0 + n, (tick + plast + thump + rel) * gain, pan);
  }
}

// Tecleo (variación humana pequeña y determinista por tecla)
KEYS.forEach((f, i) => key(f / FPS, { gain: 0.85 + 0.25 * rnd(), pitch: 0.94 + 0.12 * rnd(), pan: -0.25 + 0.5 * rnd() }));
// Enter: pulsación más grave y larga, coincide con la compresión del botón
key(ENTER / FPS, { gain: 1.25, pitch: 1, pan: 0.1, heavy: true });

// Aire muy suave mientras el buscador llega desde la profundidad
{ const f = new SVF(), len = Math.round(0.75 * SR);
  for (let n = 0; n < len; n++) { const u = n / len; const y = f.run(noise(), 300 * Math.pow(12, u), 1.2).bp * Math.pow(Math.sin(Math.PI * u), 2) * 0.05; add(n, y, -0.4 + 0.8 * u); } }

// Sala pequeña: reflexiones tempranas deterministas (sensación de escritorio real)
const taps = [[0.0071, 0.22], [0.0113, 0.17], [0.0167, 0.12], [0.0231, 0.08], [0.0307, 0.05]];
const dry = [Float32Array.from(L), Float32Array.from(R)];
for (const [d, g] of taps) { const D = Math.round(d * SR); for (let n = D; n < N; n++) { L[n] += dry[1][n - D] * g; R[n] += dry[0][n - D] * g; } }

// Normalización a -1 dBFS + fundidos de seguridad
let peak = 0; for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
const gn = Math.pow(10, -1 / 20) / peak, fo = Math.round(0.02 * SR);
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  const e = n > N - fo ? (N - n) / fo : 1;
  out.writeInt16LE(Math.round(clamp(L[n] * gn * e, -1, 1) * 32767), 44 + n * 4);
  out.writeInt16LE(Math.round(clamp(R[n] * gn * e, -1, 1) * 32767), 46 + n * 4);
}
fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build', 'keys.wav'), out);
console.log(`keys.wav: ${N} muestras (${(N / SR).toFixed(3)} s), ${KEYS.length} teclas + Enter`);
