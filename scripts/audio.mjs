// Banda sonora original sintetizada desde cero (sin samples, sin archivos externos).
// Premium Tech · Cinematic Electronic · Minimal Future — 120 BPM, Re menor -> Re mayor (add9).
// Determinista: ruido con semilla fija, eventos tomados de src/timeline.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVENTS as EV, FPS, DURATION_FRAMES } from '../src/timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SR = 48000;
const DUR = DURATION_FRAMES / FPS; // 10.0 s exactos
const N = Math.round(DUR * SR);
const t = (frame) => frame / FPS; // fotograma -> segundos
const BEAT = 0.5;

// ---------- utilidades ----------
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(20260910);
const noise = () => rand() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const TAU = Math.PI * 2;

const bus = { dry: [new Float32Array(N), new Float32Array(N)], verb: [new Float32Array(N), new Float32Array(N)], delay: [new Float32Array(N), new Float32Array(N)] };
const side = new Float32Array(N); // envolvente de sidechain (kick)

function write(i, l, r, send = 0, dsend = 0) {
  if (i < 0 || i >= N) return;
  bus.dry[0][i] += l; bus.dry[1][i] += r;
  if (send) { bus.verb[0][i] += l * send; bus.verb[1][i] += r * send; }
  if (dsend) { bus.delay[0][i] += l * dsend; bus.delay[1][i] += r * dsend; }
}
const panLR = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

// Filtro de estado variable TPT (Zavalishin) con modulación por muestra
class SVF {
  constructor() { this.ic1 = 0; this.ic2 = 0; }
  run(x, fc, q = 0.707) {
    const g = Math.tan(Math.PI * clamp(fc, 10, SR * 0.45) / SR), k = 1 / q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - this.ic2, v1 = a1 * this.ic1 + a2 * v3, v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1; this.ic2 = 2 * v2 - this.ic2;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  }
}
// Diente de sierra con polyBLEP (sin aliasing audible)
function blep(ph, dt) { if (ph < dt) { ph /= dt; return ph + ph - ph * ph - 1; } if (ph > 1 - dt) { ph = (ph - 1) / dt; return ph * ph + ph + ph + 1; } return 0; }

// ---------- instrumentos ----------
function kick(at, gain = 1, tone = 1) {
  const s0 = Math.round(at * SR), len = Math.round(0.55 * SR);
  let ph = 0;
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const f = 44 + 118 * tone * Math.exp(-tt / 0.034);
    ph += f / SR;
    const amp = Math.exp(-tt / 0.26) * (1 - Math.exp(-tt / 0.0015));
    let y = Math.sin(TAU * ph) * amp;
    y += noise() * Math.exp(-tt / 0.0025) * 0.35; // clic de ataque
    y = Math.tanh(y * 1.6) * gain * 0.62;
    write(s0 + n, y, y, 0.03);
    side[s0 + n] = Math.max(side[s0 + n] || 0, Math.exp(-tt / 0.16));
  }
}

function hat(at, gain = 0.1, decay = 0.028, pan = 0, open = false) {
  const s0 = Math.round(at * SR), len = Math.round((open ? 0.3 : 0.12) * SR);
  const hp = new SVF(), bp = new SVF();
  const [pl, pr] = panLR(pan);
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const x = noise();
    const y = hp.run(x, 7600, 0.8).hp * 0.6 + bp.run(x, 10500, 2.5).bp * 0.5;
    const e = Math.exp(-tt / (open ? 0.11 : decay));
    write(s0 + n, y * e * gain * pl, y * e * gain * pr, 0.08);
  }
}

function clap(at, gain = 0.16) {
  const s0 = Math.round(at * SR), len = Math.round(0.35 * SR);
  const bp = new SVF();
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    // tres micro-ráfagas + cola
    const bursts = [0, 0.009, 0.018].reduce((a, o) => a + (tt >= o ? Math.exp(-(tt - o) / 0.006) : 0), 0) * 0.55 + Math.exp(-tt / 0.07) * 0.5;
    const y = bp.run(noise(), 1350, 1.4).bp * bursts * gain * 2.2;
    write(s0 + n, y * 0.9, y, 0.32);
  }
}

// Ping FM con brillo "digital" (golpes de tarjeta, filas, selección)
function ping(at, midi, gain = 0.12, decay = 0.5, pan = 0, index = 2.2, send = 0.4, dsend = 0.25) {
  const s0 = Math.round(at * SR), len = Math.round(Math.min(decay * 6, 3) * SR);
  const f = mtof(midi);
  const [pl, pr] = panLR(pan);
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const env = Math.exp(-tt / decay) * (1 - Math.exp(-tt / 0.002));
    const mod = Math.sin(TAU * f * 3.0 * tt) * index * Math.exp(-tt / (decay * 0.25));
    const y = (Math.sin(TAU * f * tt + mod) * 0.8 + Math.sin(TAU * f * 2 * tt) * 0.12 * Math.exp(-tt / 0.08)) * env * gain;
    write(s0 + n, y * pl, y * pr, send, dsend);
  }
}

// Impacto tecnológico: boom grave con caída de tono + ráfaga filtrada + cola
function impact(at, gain = 1, opts = {}) {
  const { boom = 1, air = 1, len = 2.2, lowHz = 46 } = opts;
  const s0 = Math.round(at * SR), L = Math.round(len * SR);
  let ph = 0; const lp = new SVF(), lp2 = new SVF();
  for (let n = 0; n < L; n++) {
    const tt = n / SR;
    const f = lowHz + 90 * Math.exp(-tt / 0.06);
    ph += f / SR;
    const b = Math.sin(TAU * ph) * Math.exp(-tt / 0.55) * (1 - Math.exp(-tt / 0.003)) * boom;
    const nz = noise();
    const fc = 300 + 7000 * Math.exp(-tt / 0.09);
    const a = lp.run(nz, fc, 0.9).lp * Math.exp(-tt / 0.32) * air * 0.6;
    const a2 = lp2.run(noise(), 900 + 2500 * Math.exp(-tt / 0.4), 0.7).bp * Math.exp(-tt / 0.9) * air * 0.25;
    const y = Math.tanh((b * 0.9 + a) * 1.3) * gain * 0.55;
    write(s0 + n, y + a2 * gain * 0.4, y - a2 * gain * 0.1, 0.35);
  }
}

// Whoosh / barrido: ruido con pasa-banda que recorre el espectro y paneo móvil
function sweep(start, end, f0, f1, gain = 0.15, pan0 = -0.6, pan1 = 0.6, q = 1.6, shape = 'swell') {
  const s0 = Math.round(start * SR), L = Math.round((end - start) * SR);
  const f = new SVF();
  for (let n = 0; n < L; n++) {
    const u = n / L;
    const fc = f0 * Math.pow(f1 / f0, u);
    let env = shape === 'swell' ? Math.pow(Math.sin(Math.PI * u), 1.5) : shape === 'rise' ? Math.pow(u, 2.2) * (1 - Math.pow(u, 40)) : Math.pow(1 - u, 2);
    const y = f.run(noise(), fc, q).bp * env * gain;
    const [pl, pr] = panLR(pan0 + (pan1 - pan0) * u);
    write(s0 + n, y * pl, y * pr, 0.3);
  }
}

// Pad: tres dientes de sierra desafinados por nota, filtro paso bajo que se abre con la energía
function pad(start, end, notes, gain = 0.05, att = 0.35, rel = 0.6, cutoff = (s) => 900, detune = 0.11) {
  const s0 = Math.round(start * SR), L = Math.round((end - start + rel) * SR);
  const voices = [];
  notes.forEach((m, i) => [-1, 0, 1].forEach((d) => voices.push({ f: mtof(m + d * detune), ph: rand(), pan: (((i * 3 + d + 1) % 7) / 6) * 1.4 - 0.7 })));
  const fl = new SVF(), fr = new SVF();
  const sus = end - start;
  for (let n = 0; n < L; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / att) * (tt > sus ? Math.exp(-(tt - sus) / (rel / 3)) : 1);
    let l = 0, r = 0;
    for (const v of voices) {
      const dt = v.f / SR; v.ph += dt; if (v.ph >= 1) v.ph -= 1;
      const s = 2 * v.ph - 1 - blep(v.ph, dt);
      const [pl, pr] = panLR(v.pan); l += s * pl; r += s * pr;
    }
    const fc = cutoff(start + tt);
    l = fl.run(l, fc, 0.8).lp; r = fr.run(r, fc, 0.8).lp;
    const g = gain * env / Math.sqrt(voices.length);
    write(s0 + n, l * g, r * g, 0.45);
  }
}

// Sub bajo: seno + 2º armónico, con sidechain del kick
function sub(start, end, midi, gain = 0.2, att = 0.04) {
  const s0 = Math.round(start * SR), L = Math.round((end - start + 0.12) * SR);
  const f = mtof(midi); let ph = 0;
  for (let n = 0; n < L; n++) {
    const tt = n / SR; ph += f / SR;
    const env = Math.min(1, tt / att) * (tt > end - start ? Math.exp(-(tt - (end - start)) / 0.03) : 1);
    const duck = 1 - 0.75 * (side[s0 + n] || 0);
    const y = (0.8 * Math.sin(TAU * ph) + 0.42 * Math.sin(2 * TAU * ph) + 0.16 * Math.sin(3 * TAU * ph)) * env * duck * gain; // armónicos audibles en móviles
    write(s0 + n, y, y, 0);
  }
}

// Riser: ruido que se abre + diente de sierra ascendente (dos octavas) + redoble digital acelerado
function riser(start, end, gain = 0.18) {
  const s0 = Math.round(start * SR), L = Math.round((end - start) * SR);
  const f = new SVF(), f2 = new SVF(); let ph1 = 0, ph2 = 0;
  for (let n = 0; n < L; n++) {
    const u = n / L, tt = n / SR;
    const nz = f.run(noise(), 500 * Math.pow(24, u), 1.2).bp;
    const fr = mtof(50) * Math.pow(4, u * u);
    ph1 += fr / SR; ph2 += (fr * 1.006) / SR;
    const saw = ((ph1 % 1) * 2 - 1) + ((ph2 % 1) * 2 - 1);
    const sw = f2.run(saw, 400 + 5000 * u * u, 1.5).lp;
    const env = 0.15 + 0.85 * Math.pow(u, 1.3);
    write(s0 + n, (nz * 0.8 + sw * 0.18) * env * gain, (nz * 0.8 - sw * 0.18 + 0) * env * gain, 0.35);
  }
  // redoble: corcheas -> semicorcheas -> fusas
  let x = start;
  while (x < end - 0.02) {
    const u = (x - start) / (end - start);
    clap(x, 0.04 + 0.1 * u * u);
    x += u < 0.5 ? 0.125 : u < 0.8 ? 0.0625 : 0.03125;
  }
}

// Campana final (FM suave, larga)
function bell(at, midi, gain = 0.08, decay = 1.6, pan = 0) { ping(at, midi, gain, decay, pan, 1.2, 0.6, 0.18); }

// =====================================================================
// COMPOSICIÓN — cada golpe ligado a un evento visual (src/timeline.js)
// =====================================================================
const CH = {
  Dm9: [50, 57, 60, 64, 65], Bbmaj9: [46, 53, 57, 60, 62], Gm9: [43, 50, 53, 57, 58],
  A7sus: [45, 52, 55, 62, 64], Bbmaj7s11: [46, 53, 57, 60, 64], Dadd9: [38, 45, 50, 54, 57, 64, 66, 69],
};
// Apertura del filtro del pad: crece con la energía del montaje
const cut = (s) => s < 2 ? 380 + 260 * (s / 2) : s < 4 ? 640 + 700 * ((s - 2) / 2) : s < 7.5 ? 1340 + 500 * Math.sin((s - 4) / 3.5 * Math.PI / 2) : s < 8.5 ? 1840 + 2600 * Math.pow((s - 7.5), 2) : 2600 - 900 * Math.min(1, (s - 8.5) / 1.5);

// --- Pads armónicos ---
pad(0.05, 2.0, CH.Dm9, 0.038, 0.9, 0.5, cut);
pad(2.0, 4.0, CH.Bbmaj9, 0.050, 0.25, 0.5, cut);
pad(4.0, 6.0, CH.Gm9, 0.050, 0.25, 0.5, cut);
pad(6.0, 7.5, CH.A7sus, 0.052, 0.25, 0.4, cut);
pad(7.5, 8.5, CH.Bbmaj7s11, 0.062, 0.2, 0.08, cut);
pad(t(EV.logo), DUR, CH.Dadd9, 0.052, 0.06, 0.4, (s) => 3200 - 1600 * Math.min(1, (s - 9) / 1.0));

// --- Kicks primero: generan la envolvente de sidechain que usa el sub bajo ---
kick(t(EV.dashPulse), 0.45, 0.8);
for (let b = 2.0; b < 7.5 - 1e-6; b += BEAT) kick(b, b < 3 ? 0.8 : 1.0);
kick(t(EV.converge), 0.9, 1.1);

// --- Sub bajo (acompaña a los acordes; entra con el pulso del dashboard) ---
sub(t(EV.dashPulse), 2.0, 38, 0.10, 0.3);
sub(2.0, 4.0, 34, 0.2); sub(4.0, 6.0, 31, 0.2); sub(6.0, 7.5, 33, 0.2);
sub(7.5, 8.5, 34, 0.12, 0.4);
sub(t(EV.converge), t(EV.logo) - 0.02, 38, 0.16);
sub(t(EV.logo), DUR - 0.12, 38, 0.18, 0.02);

// --- Escena 1: activación ---
sweep(0.0, t(EV.ignite), 300, 4200, 0.16, 0, 0, 1.2, 'rise');      // succión previa
impact(t(EV.ignite), 0.7, { boom: 0.8, air: 0.9, len: 2.0, lowHz: 44 });
ping(t(EV.ignite), 86, 0.07, 0.35, 0.2, 3.0, 0.6, 0.35);             // destello digital (D6)
sweep(t(EV.ignite) + 0.05, t(EV.dashPulse) - 0.02, 1800, 300, 0.05, -0.8, 0.8, 2.0, 'fall'); // la línea recorre el plano

// --- Escena 2: el dashboard aparece ---
ping(t(EV.dashPulse), 74, 0.10, 0.28, -0.2, 2.6, 0.35, 0.3);          // pulso digital (D5)
ping(t(EV.dashPulse), 81, 0.05, 0.22, 0.3, 2.0, 0.35, 0.3);
for (let k = 0; k < 6; k++) ping(t(EV.dashPulse) + 0.25 + k * 0.125, [74, 77, 81, 84, 81, 77][k], 0.022 + k * 0.002, 0.12, k % 2 ? 0.5 : -0.5, 1.6, 0.2, 0.4); // pulsos digitales
sweep(2.0, 2.65, 800, 9000, 0.05, -0.7, 0.7, 2.0, 'swell');           // barrido de luz sobre tarjetas

// --- Groove 120 BPM (kick a negras) ---
for (let b = 2.25; b < 7.5; b += BEAT) hat(b, b < 3 ? 0.06 : 0.1, 0.03, 0.25);
for (let b = 4.125; b < 7.4; b += 0.25) if (Math.abs((b * 4) % 2 - 1) < 1e-6) hat(b, 0.035, 0.018, -0.3);
[4.5, 5.5, 6.5, 7.0].forEach((x) => clap(x, 0.13));
hat(3.75, 0.05, 0.03, 0, true); hat(5.75, 0.06, 0.03, 0, true);

// --- Escena 3: tarjetas flotantes (energía creciente) ---
sweep(t(166), t(EV.card1), 400, 5200, 0.10, -0.6, 0.0, 1.4, 'rise');
impact(t(EV.card1), 0.45, { boom: 0.6, air: 0.7, len: 1.2 });
ping(t(EV.card1), 81, 0.10, 0.45, -0.35);                             // A5
sweep(t(190), t(EV.card2), 400, 6000, 0.11, 0.7, 0.1, 1.4, 'rise');
impact(t(EV.card2), 0.55, { boom: 0.7, air: 0.8, len: 1.3 });
ping(t(EV.card2), 84, 0.11, 0.45, 0.35);                              // C6
sweep(t(212), t(EV.card3), 300, 7000, 0.13, -0.2, 0.2, 1.3, 'rise');
impact(t(EV.card3), 0.8, { boom: 1.0, air: 1.0, len: 1.8, lowHz: 42 }); // más pronunciado
ping(t(EV.card3), 88, 0.12, 0.55, 0); ping(t(EV.card3), 76, 0.06, 0.6, 0);
// arpegio digital (semicorcheas) — energía de la secuencia de tarjetas
for (let x = 4.0; x < 7.45; x += 0.125) {
  const set = x < 6 ? [67, 70, 74, 77, 74, 70, 69, 74] : [69, 72, 76, 74, 72, 69, 76, 79];
  const i = Math.round((x - 4) / 0.125) % 8;
  ping(x, set[i], 0.018 + 0.01 * ((x - 4) / 3.5), 0.09, i % 2 ? 0.45 : -0.45, 1.4, 0.15, 0.35);
}

// --- Escena 4: Requiere tu atención ---
sweep(t(EV.attentionSweep) - 0.18, t(EV.attentionSweep) + 0.32, 350, 7000, 0.16, -0.8, 0.8, 1.8, 'swell'); // barrido electrónico
ping(t(EV.row1), 86, 0.07, 0.16, -0.3, 1.8, 0.25, 0.3);
ping(t(EV.row2), 89, 0.07, 0.16, 0.0, 1.8, 0.25, 0.3);
ping(t(EV.row3), 93, 0.075, 0.18, 0.3, 1.8, 0.25, 0.3);
sweep(t(EV.row3), t(EV.row3) + 0.75, 4000, 12000, 0.045, -0.5, 0.5, 3.0, 'swell'); // brillo del borde

// --- Escena 5: agenda ---
sweep(t(EV.agendaWhoosh) - 0.3, t(EV.agendaWhoosh) + 0.06, 200, 3500, 0.15, 0.6, -0.4, 1.2, 'rise'); // transición sonora
impact(t(EV.calendarLand), 0.35, { boom: 0.5, air: 0.5, len: 1.0 });
ping(t(EV.calendarLand), 81, 0.06, 0.3, 0.2);
ping(t(EV.daySelect), 86, 0.10, 0.35, 0, 2.4, 0.35, 0.35);           // JUE 10 se ilumina
ping(t(EV.daySelect), 93, 0.04, 0.3, 0.2, 2.0, 0.35, 0.35);
ping(t(EV.audience1), 88, 0.06, 0.16, -0.25, 1.8, 0.25, 0.3);
ping(t(EV.audience2), 91, 0.055, 0.16, 0.25, 1.8, 0.25, 0.3);

// --- Escena 6: convergencia ---
riser(t(EV.riserStart), t(EV.converge), 0.62);
impact(t(EV.converge), 1.0, { boom: 1.1, air: 1.0, len: 1.6, lowHz: 40 });
[62, 66, 69, 74].forEach((m, i) => ping(t(EV.converge), m + 12, 0.045, 0.5, (i - 1.5) * 0.3, 1.6, 0.5, 0.2)); // acorde brillante

// --- Escena 7: logotipo — nota final ---
sweep(t(EV.logo) - 0.25, t(EV.logo), 600, 6000, 0.07, 0, 0, 1.4, 'rise');
impact(t(EV.logo), 0.5, { boom: 0.8, air: 0.35, len: 1.0, lowHz: 37 });
bell(t(EV.logo), 74, 0.10, 1.4, -0.2); bell(t(EV.logo) + 0.012, 81, 0.07, 1.2, 0.2); bell(t(EV.logo) + 0.024, 88, 0.045, 1.0, 0);
bell(t(EV.tagline), 90, 0.035, 0.8, 0.35); bell(t(EV.tagline) + 0.125, 93, 0.028, 0.7, -0.35);

// =====================================================================
// EFECTOS DE BUS: delay ping-pong (corchea con puntillo) + reverb tipo Freeverb
// =====================================================================
function pingpong(src, time = 0.375, fb = 0.32, mix = 1) {
  const D = Math.round(time * SR), out = [new Float32Array(N), new Float32Array(N)];
  const bl = new Float32Array(D), br = new Float32Array(D); let w = 0;
  const lpL = new SVF(), lpR = new SVF();
  for (let n = 0; n < N; n++) {
    const yl = bl[w], yr = br[w];
    out[0][n] = yl * mix; out[1][n] = yr * mix;
    bl[w] = lpL.run(src[1][n] + yr * fb, 5200).lp; // cruce L<->R
    br[w] = lpR.run(src[0][n] + yl * fb, 5200).lp;
    w = (w + 1) % D;
  }
  return out;
}
function freeverb(src, room = 0.86, damp = 0.35, wet = 1) {
  const sc = SR / 44100, spread = 23;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  const out = [new Float32Array(N), new Float32Array(N)];
  [0, 1].forEach((ch) => {
    const cb = combs.map((l) => ({ buf: new Float32Array(Math.round((l + ch * spread) * sc)), i: 0, st: 0 }));
    const ab = aps.map((l) => ({ buf: new Float32Array(Math.round((l + ch * spread) * sc)), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = (src[0][n] + src[1][n]) * 0.5 * 0.03 + src[ch][n] * 0.012;
      let y = 0;
      for (const c of cb) { const o = c.buf[c.i]; c.st = o * (1 - damp) + c.st * damp; c.buf[c.i] = x + c.st * room; c.i = (c.i + 1) % c.buf.length; y += o; }
      for (const a of ab) { const b = a.buf[a.i]; const o = -y + b; a.buf[a.i] = y + b * 0.5; a.i = (a.i + 1) % a.buf.length; y = o; }
      out[ch][n] = y * wet;
    }
  });
  return out;
}
const dl = pingpong(bus.delay, 0.375, 0.34, 0.55);
for (let n = 0; n < N; n++) { bus.verb[0][n] += dl[0][n] * 0.3; bus.verb[1][n] += dl[1][n] * 0.3; }
const rv = freeverb(bus.verb, 0.87, 0.32, 1.0);

// =====================================================================
// MASTER: suma, saturación suave, normalización a -1 dBFS, fundidos de seguridad
// =====================================================================
const L = new Float32Array(N), R = new Float32Array(N);
const hpL = new SVF(), hpR = new SVF();
for (let n = 0; n < N; n++) {
  let l = bus.dry[0][n] + dl[0][n] + rv[0][n] * 2.4;
  let r = bus.dry[1][n] + dl[1][n] + rv[1][n] * 2.4;
  l = hpL.run(l, 32, 0.7).hp; r = hpR.run(r, 32, 0.7).hp; // limpia DC/infragraves
  L[n] = Math.tanh(l * 1.15); R[n] = Math.tanh(r * 1.15);
}
let peak = 0; for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
const g = Math.pow(10, -1 / 20) / peak;
const fin = Math.round(0.004 * SR), fout = Math.round(0.08 * SR);
for (let n = 0; n < N; n++) {
  let e = 1; if (n < fin) e = n / fin; if (n > N - fout) e = (N - n) / fout;
  L[n] *= g * e; R[n] *= g * e;
}

// WAV PCM 24 bits estéreo
const out = Buffer.alloc(44 + N * 6);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 6, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 6, 28); out.writeUInt16LE(6, 32); out.writeUInt16LE(24, 34); out.write('data', 36); out.writeUInt32LE(N * 6, 40);
for (let n = 0; n < N; n++) {
  out.writeIntLE(Math.round(clamp(L[n], -1, 1) * 8388607), 44 + n * 6, 3);
  out.writeIntLE(Math.round(clamp(R[n], -1, 1) * 8388607), 47 + n * 6, 3);
}
fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'build', 'soundtrack.wav'), out);
console.log(`soundtrack.wav: ${N} muestras · ${DUR.toFixed(3)} s · pico previo ${peak.toFixed(3)} · ganancia ${(20 * Math.log10(g)).toFixed(2)} dB`);
