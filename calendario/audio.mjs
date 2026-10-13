// Diseño sonoro sutil sintetizado desde cero: aire en la llegada, toques suaves por cada grupo de
// componentes, campana en la selección del día 10 y un asentamiento cálido al reunirse las capas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, FRAMES, EV } from './timeline.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000, N = Math.round((FRAMES / FPS) * SR), TAU = Math.PI * 2;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 13102026;
const noise = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return (((x ^ (x >>> 14)) >>> 0) / 4294967296) * 2 - 1; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (i, v, pan) => { if (i >= 0 && i < N) { L[i] += v * Math.cos((pan + 1) * Math.PI / 4); R[i] += v * Math.sin((pan + 1) * Math.PI / 4); } };
const sec = (f) => f / FPS;
class SVF { constructor() { this.a = 0; this.b = 0; }
  run(x, fc, q) { const g = Math.tan(Math.PI * clamp(fc, 20, SR * 0.45) / SR), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - this.b, v1 = a1 * this.a + a2 * v3, v2 = this.b + a2 * this.a + a3 * v3; this.a = 2 * v1 - this.a; this.b = 2 * v2 - this.b; return v1; } }

// Toque suave: seno con 2.º parcial y ataque redondeado (tipo "marimba de cristal")
function tone(t, midi, gain, decay = 0.6, pan = 0) {
  const f = mtof(midi), s0 = Math.round(t * SR), len = Math.round(decay * 5 * SR);
  for (let n = 0; n < len; n++) { const tt = n / SR, env = Math.exp(-tt / decay) * (1 - Math.exp(-tt / 0.004));
    add(s0 + n, (Math.sin(TAU * f * tt) + 0.25 * Math.sin(TAU * 2 * f * tt) * Math.exp(-tt / 0.15)) * env * gain, pan); }
}
// Aire: ruido en paso-banda que recorre el espectro
function air(t0, t1, f0, f1, gain, p0 = -0.5, p1 = 0.5) {
  const s0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), flt = new SVF();
  for (let n = 0; n < len; n++) { const u = n / len; add(s0 + n, flt.run(noise(), f0 * Math.pow(f1 / f0, u), 1.1) * Math.pow(Math.sin(Math.PI * u), 2) * gain, p0 + (p1 - p0) * u); }
}

air(0, 2.0, 180, 2400, 0.10);                                                       // llegada desde la profundidad
tone(sec(EV.header), 74, 0.05, 0.7, -0.2);                                         // cabecera
[0, 1, 2, 3, 4].forEach((k) => tone(sec(EV.grid + k * 18), [78, 81, 83, 86, 88][k], 0.03, 0.45, -0.5 + k * 0.25)); // ola de días
[0, 1, 2].forEach((k) => tone(sec(EV.pills + k * 8), [86, 90, 93][k], 0.028, 0.3, 0.3 - k * 0.3)); // horarios
tone(sec(EV.select), 86, 0.07, 0.9, 0); tone(sec(EV.select) + 0.01, 93, 0.035, 0.8, 0.2);  // día 10
air(sec(EV.divider), sec(EV.divider) + 0.8, 1500, 6000, 0.03, -0.6, 0.6);           // línea divisoria
tone(sec(EV.aud1), 81, 0.045, 0.55, -0.2); tone(sec(EV.aud2), 85, 0.045, 0.55, 0.2); // audiencias
air(sec(EV.collapse), sec(EV.settle), 2400, 300, 0.07, 0.5, -0.3);                 // las capas se reúnen
[62, 69, 74, 78, 81].forEach((m, i) => tone(sec(EV.settle) + i * 0.012, m, 0.05 - i * 0.006, 1.4, (i - 2) * 0.2)); // acorde de asentamiento

// Reflexiones tempranas + cola breve deterministas (espacio pequeño y limpio)
const dry = [Float32Array.from(L), Float32Array.from(R)];
[[0.011, 0.25], [0.019, 0.18], [0.031, 0.13], [0.047, 0.09], [0.071, 0.06], [0.103, 0.04]].forEach(([d, g]) => {
  const D = Math.round(d * SR); for (let n = D; n < N; n++) { L[n] += dry[1][n - D] * g; R[n] += dry[0][n - D] * g; } });

let peak = 0; for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
const gn = Math.pow(10, -3 / 20) / peak, fo = Math.round(0.08 * SR), out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { const e = n > N - fo ? (N - n) / fo : 1;
  out.writeInt16LE(Math.round(clamp(L[n] * gn * e, -1, 1) * 32767), 44 + n * 4); out.writeInt16LE(Math.round(clamp(R[n] * gn * e, -1, 1) * 32767), 46 + n * 4); }
fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build', 'sound.wav'), out);
console.log(`sound.wav: ${N} muestras (${(N / SR).toFixed(3)} s)`);
