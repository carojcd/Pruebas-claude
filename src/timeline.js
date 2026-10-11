// Línea de tiempo maestra compartida por la escena (navegador) y el sintetizador (Node).
// Todo se expresa en fotogramas a 60 FPS. 120 BPM => 1 negra = 30 fotogramas, 1 corchea = 15.

export const FPS = 60;
export const DURATION_FRAMES = 600;
export const BPM = 120;
export const BEAT = 30; // fotogramas por negra

export const SCENES = {
  activation: [0, 72],     // 0.00 - 1.20
  dashboard: [72, 168],    // 1.20 - 2.80
  cards: [168, 264],       // 2.80 - 4.40
  attention: [264, 360],   // 4.40 - 6.00
  agenda: [360, 462],      // 6.00 - 7.70
  convergence: [462, 522], // 7.70 - 8.70
  brand: [522, 600],       // 8.70 - 10.00
};

// Eventos audiovisuales. "f" = fotograma exacto del golpe visual y sonoro.
export const EVENTS = {
  ignite: 15,          // 0.25 s  línea Aqua se enciende — impacto electrónico
  dashPulse: 75,       // 1.25 s  dashboard materializado — pulso digital
  grooveIn: 120,       // 2.00 s  entra el kick; barrido de luz sobre tarjetas
  card1: 180,          // 3.00 s  tarjeta 5 — impacto suave
  card2: 210,          // 3.50 s  tarjeta 3 — nuevo impacto
  card3: 240,          // 4.00 s  tarjeta 2 — impacto más pronunciado
  attentionSweep: 270, // 4.50 s  barrido electrónico hacia "Requiere tu atención"
  row1: 300,           // 5.00 s
  row2: 315,           // 5.25 s
  row3: 330,           // 5.50 s  + barrido luminoso del borde
  agendaWhoosh: 360,   // 6.00 s  transición sonora
  calendarLand: 375,   // 6.25 s  el calendario se asienta
  daySelect: 405,      // 6.75 s  JUE 10 se ilumina
  audience1: 420,      // 7.00 s
  audience2: 435,      // 7.25 s
  riserStart: 450,     // 7.50 s  riser de convergencia
  converge: 510,       // 8.50 s  todo encaja — impacto digital
  logo: 540,           // 9.00 s  logotipo — nota final
  tagline: 555,        // 9.25 s  "Donde la justicia evoluciona."
};

// ---------- utilidades deterministas ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smoothstep = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };

// cubic-bezier estilo CSS resuelto numéricamente (Newton + bisección), cacheado.
const _bz = new Map();
export function bezier(x1, y1, x2, y2) {
  const key = [x1, y1, x2, y2].join();
  if (_bz.has(key)) return _bz.get(key);
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  const fn = (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) { const e = sx(u) - x; const d = dx(u); if (Math.abs(e) < 1e-7) return sy(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
    let lo = 0, hi = 1; u = x;
    for (let i = 0; i < 40; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-7) break; if (v < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
  _bz.set(key, fn);
  return fn;
}

// Curvas de easing personalizadas (no todas iguales, por intención de movimiento).
export const ease = {
  linear: (t) => t,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  // cámara: arranque contenido y frenado largo (sensación de grúa/dolly pesado)
  camera: (t) => bezier(0.6, 0, 0.12, 1)(t),
  // entrada de objetos: muy rápida al inicio, asentamiento largo
  arrive: (t) => bezier(0.16, 0.9, 0.2, 1)(t),
  // salida: anticipación suave y aceleración
  depart: (t) => bezier(0.5, 0, 0.9, 0.4)(t),
  // overshoot controlado
  outBack: (t, s = 1.25) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  // muelle amortiguado (follow-through)
  spring: (t, zeta = 0.55, freq = 2.2) => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    const w = freq * 2 * Math.PI; const wd = w * Math.sqrt(1 - zeta * zeta);
    const v = 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
    // normaliza para terminar exactamente en 1
    const end = 1 - Math.exp(-zeta * w) * (Math.cos(wd) + (zeta * w / wd) * Math.sin(wd));
    return v / end;
  },
};

// Pista de keyframes: [[frame, valor, easingHaciaEsteKey], ...]; valor puede ser número o array.
export function track(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (f <= f1) {
      const t = (f - f0) / (f1 - f0);
      const k = (typeof e === 'function' ? e : ease[e || 'inOutCubic'])(t);
      if (Array.isArray(v0)) return v0.map((a, j) => a + (v1[j] - a) * k);
      return v0 + (v1 - v0) * k;
    }
  }
  return keys[keys.length - 1][1];
}

// Envolvente de pulso luminoso: subida rápida, caída exponencial.
export function pulse(f, at, attack = 3, decay = 22) {
  if (f < at - attack) return 0;
  if (f < at) return ease.outCubic((f - (at - attack)) / attack);
  return Math.exp(-(f - at) / decay);
}
