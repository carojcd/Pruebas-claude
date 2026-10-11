// Motor de escena determinista: TODO depende del fotograma recibido en renderFrame(f).
// Sin setTimeout / setInterval / requestAnimationFrame / animaciones CSS / aleatoriedad.
import { EVENTS as E, clamp, lerp, invLerp, smoothstep, ease, track, pulse, bezier } from './timeline.js';

const F = 1300; // distancia focal CSS (perspective)
const $ = (id) => document.getElementById(id);
const deg = Math.PI / 180;
const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const cubic3 = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1, 2].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]);
};

// ---------------------------------------------------------------------------
// Spline de Hermite (tangentes Catmull-Rom no uniformes) para trayectorias de cámara
// con velocidad continua: sin paradas bruscas entre keyframes.
function hermiteTrack(keys) {
  const n = keys.length;
  const tangents = keys.map((k, i) => {
    if (k.hold || i === 0 || i === n - 1) return k.v.map(() => 0);
    const [fp, vp] = [keys[i - 1].f, keys[i - 1].v];
    const [fn, vn] = [keys[i + 1].f, keys[i + 1].v];
    return k.v.map((x, j) => 0.5 * ((x - vp[j]) / (k.f - fp) + (vn[j] - x) / (fn - k.f)));
  });
  return (f) => {
    if (f <= keys[0].f) return keys[0].v.slice();
    if (f >= keys[n - 1].f) return keys[n - 1].v.slice();
    let i = 0; while (f > keys[i + 1].f) i++;
    const a = keys[i], b = keys[i + 1], h = b.f - a.f;
    const t = (f - a.f) / h, t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    return a.v.map((x, j) => h00 * x + h10 * h * tangents[i][j] + h01 * b.v[j] + h11 * h * tangents[i + 1][j]);
  };
}

// Cámara: objetivo T (coordenadas del dashboard), distancia r, yaw/pitch/roll en grados.
//                       Tx    Ty   Tz     r     yaw  pitch roll
const CAM = hermiteTrack([
  { f: 0,   v: [1000, 560,   0, 4300, -34, 38, -22], hold: true },
  { f: 72,  v: [ 830, 520,   0, 2150, -24, 28, -15] },              // dolly in inclinado
  { f: 120, v: [ 760, 330,  20, 1750,  -8, 20,  -9] },              // tracking lateral
  { f: 168, v: [1000, 280,  30, 1500,   8, 12,  -4] },
  { f: 206, v: [1111, 262, 480, 1010,   6,  4,  -1] },              // entre las tarjetas flotantes
  { f: 262, v: [1100, 282, 520,  960,  -7,  2,   1] },              // órbita moderada
  { f: 296, v: [ 720, 500, 160,  760, -16,  9,  -2] },              // transición en profundidad
  { f: 328, v: [ 790, 525, 150,  700, -14,  7,  -1] },
  { f: 342, v: [ 880, 530, 150,  700, -12,  7,  -1] },
  { f: 364, v: [1480, 560, 150,  740,  -6,  6,   0] },              // tracking lateral rápido hacia los botones
  { f: 394, v: [1270, 885, 290,  780,  12,  9,   1] },              // desciende a la agenda
  { f: 424, v: [ 890, 890, 290,  760,   4,  7,   0] },
  { f: 462, v: [ 720, 895, 290,  780,  -8,  6,  -1] },              // tracking lateral
  { f: 500, v: [1000, 560,  20, 2300,   2, 14,  -5] },              // dolly out: convergencia
  { f: 522, v: [1000, 540,   0, 2700,  -4, 18,  -7] },
  { f: 600, v: [1000, 540,   0, 4600, -12, 26, -12], hold: true },
]);

function camera(f) {
  const [tx, ty, tz, r, yaw, pitch, roll] = CAM(f);
  const a = yaw * deg, b = pitch * deg;
  const eye = [tx + r * Math.cos(b) * Math.sin(a), ty - r * Math.sin(b), tz + r * Math.cos(b) * Math.cos(a)];
  return { T: [tx, ty, tz], r, yaw, pitch, roll, eye };
}

// ---------------------------------------------------------------------------
// Coreografía de tarjetas (centros en coordenadas del dashboard)
const SLOT = [v3(691.5, 268, 0), v3(1110.5, 268, 0), v3(1530.5, 268, 0)];
const FLOAT = [v3(1040, 70, 815), v3(1200, 272, 690), v3(1080, 470, 880)];
const PARK = [v3(860, -620, 380), v3(1260, -660, 330), v3(1320, -560, 450)];
const HIT = [E.card1, E.card2, E.card3];

function cardPose(i, f) {
  const S = SLOT[i], P = FLOAT[i], K = PARK[i];
  let pos = S.slice(), rx = 0, ry = 0, rz = 0, s = 1, flying = 0;
  // Fase A — reposo en el dashboard (ligera elevación en la escena 2 para parallax)
  pos[2] = 14 * smoothstep(110, 160, f);

  if (i === 0) {
    // 5 · Audiencias próximas: anticipación hacia el fondo, avance a cámara, giro en Y
    const ant = smoothstep(150, 164, f) * (1 - smoothstep(164, 172, f));
    pos[2] -= 34 * ant; s -= 0.02 * ant;
    const t = invLerp(164, 206, f), p = ease.arrive(t);
    if (t > 0) {
      pos = cubic3(add(S, v3(0, 0, -20)), v3(691, 268, 260), v3(930, 90, 820), P, p);
      ry = -11 * ease.spring(invLerp(164, 222, f), 0.5, 1.6) + 2 * (1 - p) * Math.sin(p * Math.PI);
      rx = 5 * ease.spring(invLerp(164, 222, f), 0.55, 1.4);
      flying = 1 - smoothstep(0.55, 1, t);
    }
  } else if (i === 1) {
    // 3 · Procesos admitidos: desplazamiento lateral, gana profundidad, giro suave
    const ant = smoothstep(180, 190, f) * (1 - smoothstep(190, 196, f));
    pos[0] -= 16 * ant;
    const t = invLerp(190, 232, f), p = ease.arrive(t);
    if (t > 0) {
      pos = cubic3(S, v3(1540, 300, 110), v3(1580, 250, 620), P, p);
      ry = track(f, [[190, 0], [204, 26, 'outCubic'], [236, 8, (x) => ease.spring(x, 0.5, 1.3)]]);
      rx = -3 * ease.spring(invLerp(196, 236, f), 0.5, 1.4);
      flying = 1 - smoothstep(0.55, 1, t);
    }
  } else {
    // 2 · Procesos finalizados: surge desde otra profundidad y traza una curva
    const ant = smoothstep(198, 212, f) * (1 - smoothstep(212, 218, f));
    pos[2] -= 46 * ant; s -= 0.03 * ant;
    const t = invLerp(212, 256, f), p = ease.arrive(t);
    if (t > 0) {
      pos = cubic3(add(S, v3(0, 0, -30)), v3(1820, 760, 140), v3(640, 820, 560), P, p);
      rz = -12 * Math.sin(Math.PI * clamp(p * 1.05)) * (1 - p * 0.2);
      ry = -7 * ease.spring(invLerp(212, 262, f), 0.5, 1.5);
      rx = -4 * ease.spring(invLerp(212, 262, f), 0.5, 1.5);
      flying = 1 - smoothstep(0.55, 1, t);
    }
  }

  // Flotación: respiración lenta con fases distintas (overlapping action)
  const fl = smoothstep(HIT[i] + 6, HIT[i] + 40, f) * (1 - smoothstep(258, 270, f));
  const ph = (f - HIT[i]) / 60 * 2 * Math.PI * 0.38 + i * 1.7;
  pos[1] += 8 * Math.sin(ph) * fl;
  ry += 1.6 * Math.sin(ph * 0.8 + 0.6) * fl;
  rx += 1.1 * Math.cos(ph * 0.9) * fl;

  // Fase C — retirada elegante (escena 4): suben y retroceden escalonadas
  const r0 = 258 + i * 5, r1 = r0 + 44;
  if (f > r0) {
    const t = ease.depart(invLerp(r0, r1, f));
    const from = pos.slice();
    pos = mix3(from, K, t);
    rx += 16 * t; ry += (i === 1 ? 14 : -14) * t;
  }

  // Fase D — convergencia (escena 6): regresan a su hueco
  const c0 = 466 + i * 4, c1 = 508;
  if (f > c0) {
    const t = invLerp(c0, c1, f);
    const p = bezier(0.45, 0, 0.12, 1)(t);
    const from = f >= r1 ? K : pos;
    const ctrl = add(mix3(from, S, 0.55), v3(0, -60, 260));
    const u = 1 - p;
    pos = [0, 1, 2].map((k) => u * u * from[k] + 2 * u * p * ctrl[k] + p * p * S[k]);
    rx = lerp(16, 0, p); ry = lerp(i === 1 ? 14 : -14, 0, p); rz = 0;
    flying = Math.sin(Math.PI * t) * 0.8;
    // asentamiento: micro-rebote de escala al encajar
    s = 1 + 0.025 * Math.sin(Math.PI * invLerp(504, 516, f)) * (f > 504 ? 1 : 0);
    pos[2] = Math.max(pos[2], 0) + 14 * (1 - smoothstep(500, 520, f)) * (f > 500 ? 1 : 0) * 0;
  }
  if (f >= 520) { pos = S.slice(); rx = ry = rz = 0; s = 1; }
  return { pos, rx, ry, rz, s, flying };
}

// ---------------------------------------------------------------------------
let els = {};
let revealLeaves = [];

function dashTop(el) {
  let y = 0, x = 0, n = el;
  while (n && n.id !== 'dash') { y += n.offsetTop; x += n.offsetLeft; n = n.offsetParent; }
  return { x, y, h: el.offsetHeight };
}

async function init() {
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
  // Ajuste fino del título a la anchura medida en la captura
  for (const el of document.querySelectorAll('.fit')) {
    const target = +el.dataset.w; let fs = parseFloat(getComputedStyle(el).fontSize);
    for (let k = 0; k < 6; k++) { fs *= target / el.getBoundingClientRect().width || 1; el.style.fontSize = fs.toFixed(3) + 'px'; }
  }
  els = {
    cam: $('cam'), fade: $('fade'), dash: $('dash'), bgHalo: $('bgHalo'), worldHalo: $('worldHalo'), farArcs: $('farArcs'),
    scanLine: $('scanLine'), scanBand: $('scanBand'), dashEdge: $('dashEdge'), flash: $('flash'),
    hDate: $('hDate'), hTitle: $('hTitle'), hSub: $('hSub'), hCta: $('hCta'),
    cards: [1, 2, 3].map((k) => $('card' + k)), slots: [1, 2, 3].map((k) => $('slot' + k)), shadows: [1, 2, 3].map((k) => $('shadow' + k)),
    att: $('att'), attPlate: $('attPlate'), attRows: [0, 1, 2].map((k) => $('attRow' + k)), attEdge: $('attEdge'), attSweep: $('attSweep'),
    cal: $('cal'), calPlate: $('calPlate'), days: [0, 1, 2, 3, 4, 5, 6].map((k) => $('day' + k)), daySel: $('daySel'),
    auds: [0, 1].map((k) => $('aud' + k)), calEdge: $('calEdge'), calSweep: $('calSweep'),
    brandLogo: $('brandLogo'), tagline: $('tagline'), brandHalo: $('brandHalo'), brandArcs: $('brandArcs'),
    arcs: [1, 2, 3, 4].map((k) => $('ba' + k)), sidebar: $('sidebar'), secTitles: [...document.querySelectorAll('.sec-title, .sec-more')],
  };
  els.cards.forEach((c, i) => { c.style.left = (SLOT[i][0] - 203.5) + 'px'; els.shadows[i].style.left = (SLOT[i][0] - 203.5) + 'px'; });
  // Estelas: 3 ecos de contorno por tarjeta
  const tr = $('trails');
  els.trails = els.cards.map(() => [0, 1, 2].map(() => { const d = document.createElement('div'); d.className = 'trail'; tr.appendChild(d); return d; }));
  // Hojas que se materializan con la línea de activación
  const skip = ['scanLine', 'scanBand', 'dashEdge'];
  revealLeaves = [...els.dash.querySelectorAll('.leaf')]
    .filter((el) => !skip.includes(el.id) && !el.classList.contains('neon-edge') && !el.classList.contains('neon-sweep') && !el.classList.contains('c-halo') && !el.classList.contains('cshadow') && !el.classList.contains('slot'))
    .map((el) => ({ el, ...dashTop(el) }));
  for (const p of els.arcs) { const L = p.getTotalLength(); p.style.strokeDasharray = `${L} ${L}`; p.dataset.len = L; }
  els.ibAtt = els.attRows.map((r) => r.querySelector('.ibox'));
  els.btnAtt = els.attRows.map((r) => r.querySelector('.btn'));
  els.btnAud = els.auds.map((r) => r.querySelector('.btn'));
}

const T3 = (p, rx = 0, ry = 0, rz = 0, s = 1) =>
  `translate3d(${p[0].toFixed(3)}px, ${p[1].toFixed(3)}px, ${p[2].toFixed(3)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`;

// Las capas totalmente transparentes se ocultan: menos polígonos en el ordenamiento 3D de Chromium
function setOpacity(el, o) {
  const v = clamp(o);
  el.style.opacity = v.toFixed(4);
  el.style.visibility = v < 0.002 ? 'hidden' : '';
}

function renderFrame(f) {
  const cam = camera(f);
  els.cam.style.transform =
    `translate3d(0px, 0px, ${(F - cam.r).toFixed(3)}px) rotateZ(${(-cam.roll).toFixed(3)}deg) rotateX(${(-cam.pitch).toFixed(3)}deg) rotateY(${(-cam.yaw).toFixed(3)}deg) translate3d(${(-cam.T[0]).toFixed(3)}px, ${(-cam.T[1]).toFixed(3)}px, ${(-cam.T[2]).toFixed(3)}px)`;

  // ---------------- Fondo y halos ----------------
  const ign = pulse(f, E.ignite, 6, 40);
  const ambient = smoothstep(10, 70, f) * (1 - 0.6 * smoothstep(528, 570, f));
  setOpacity(els.bgHalo, 0.15 + 0.55 * ign + 0.35 * ambient);
  els.bgHalo.style.transform = `scale(${(0.7 + 0.3 * smoothstep(10, 90, f)).toFixed(4)})`;
  els.worldHalo.style.transform = `translate3d(1000px, 540px, -1100px)`;
  setOpacity(els.worldHalo, ambient * (0.75 + 0.25 * pulse(f, E.converge, 2, 30)));
  els.farArcs.style.transform = `translate3d(1000px, 540px, -2400px) rotateZ(${(f * 0.035).toFixed(3)}deg) scale(${(1 + 0.04 * Math.sin(f / 90)).toFixed(4)})`;
  setOpacity(els.farArcs, smoothstep(20, 90, f) * 0.85 * (1 - smoothstep(530, 565, f)) + 0.6 * pulse(f, E.converge, 3, 30));

  // ---------------- Escena 1: línea de activación + materialización ----------------
  const lineGrow = ease.outExpo(invLerp(E.ignite - 4, E.ignite + 22, f));
  const lineY = track(f, [[0, -70], [30, -70], [E.dashPulse, 1110, 'inOutSine']]);
  const lineOn = smoothstep(E.ignite - 6, E.ignite, f) * (1 - smoothstep(E.dashPulse - 2, E.dashPulse + 14, f));
  els.scanLine.style.top = lineY + 'px';
  els.scanLine.style.transform = `translateZ(3px) scaleX(${Math.max(0.0005, lineGrow).toFixed(4)}) scaleY(${(1 + 1.6 * pulse(f, E.ignite, 2, 10)).toFixed(3)})`;
  setOpacity(els.scanLine, lineOn);
  els.scanBand.style.top = lineY + 'px';
  setOpacity(els.scanBand, smoothstep(30, 40, f) * (1 - smoothstep(E.dashPulse - 6, E.dashPulse + 6, f)));
  const revealing = f < E.dashPulse + 16;
  for (const L of revealLeaves) {
    if (revealing) {
      const y = lineY - L.y; // límite de revelado en coordenadas locales
      const m = `linear-gradient(to bottom, #000 ${(y - 90).toFixed(1)}px, rgba(0,0,0,.35) ${(y - 20).toFixed(1)}px, transparent ${y.toFixed(1)}px)`;
      L.el.style.webkitMaskImage = m; L.el.style.maskImage = m;
    } else if (L.el.style.maskImage) { L.el.style.webkitMaskImage = ''; L.el.style.maskImage = ''; }
  }

  // ---------------- Escena 2: parallax del encabezado ----------------
  const lift = smoothstep(80, 150, f) * (1 - smoothstep(470, 510, f));
  els.hDate.style.transform = `translateZ(${(26 * lift).toFixed(2)}px)`;
  els.hTitle.style.transform = `translateZ(${(34 * lift).toFixed(2)}px)`;
  els.hSub.style.transform = `translateZ(${(28 * lift).toFixed(2)}px)`;
  els.hCta.style.transform = `translateZ(${(46 * lift).toFixed(2)}px)`;
  for (const el of els.secTitles) el.style.transform = `translateZ(${(14 * lift).toFixed(2)}px)`;

  // Foco/atmósfera: atenúa lo que no protagoniza el plano (iluminación dependiente de profundidad)
  const dashFog = 0.86 * smoothstep(172, 206, f) * (1 - smoothstep(470, 506, f));
  els.dash.style.setProperty('--fog', dashFog.toFixed(3));

  // ---------------- Escena 3: tarjetas flotantes ----------------
  for (let i = 0; i < 3; i++) {
    const card = els.cards[i];
    const P = cardPose(i, f);
    const S = SLOT[i];
    const local = sub(P.pos, S);
    card.style.transform = T3(local, P.rx, P.ry, P.rz, P.s);

    // Neón: pulso sincronizado con el golpe + barrido en el vuelo + destello en la convergencia
    const hit = pulse(f, HIT[i], 2, i === 2 ? 30 : 24) * (i === 2 ? 1 : 0.9);
    const sweepScene2 = pulse(f, 132 + i * 9, 4, 14) * 0.45;
    const floatBase = 0.16 * smoothstep(HIT[i], HIT[i] + 20, f) * (1 - smoothstep(262, 290, f));
    const lock = pulse(f, E.converge, 2, 22) * 0.85;
    const neon = clamp(hit + sweepScene2 + floatBase + lock + 0.5 * P.flying * (f < 300 ? 1 : 0.6));
    setOpacity(card.querySelector('.neon-edge'), neon);
    setOpacity(card.querySelector('.c-halo'), clamp(hit * 0.9 + lock * 0.5 + floatBase * 1.5));
    const fs = [158, 184, 206][i];
    const sw = invLerp(fs, fs + 52, f);
    const swEl = card.querySelector('.neon-sweep');
    swEl.style.setProperty('--ang', (360 * ease.inOutCubic(sw) + 90 * i) + 'deg');
    setOpacity(swEl, Math.sin(Math.PI * sw) * 0.95 + pulse(f, E.converge - 4, 3, 16) * 0.6);

    // Reflejo especular: barrido de luz (escena 2) + reflejo dependiente del giro
    const face = card.querySelector('.c-face');
    const sp = invLerp(126 + i * 9, 150 + i * 9, f);
    face.style.setProperty('--spec', (-70 + 140 * ease.inOutSine(sp)) + '%');
    face.style.setProperty('--specO', (Math.sin(Math.PI * sp) * 0.9 + clamp(Math.abs(P.ry) / 30) * 0.35).toFixed(3));

    // Sombreado por profundidad (más lejos = más oscuro), y foco
    const d = len(sub(P.pos, cam.eye));
    const fogC = clamp((d - 900) / 2600) * 0.55 * smoothstep(40, 160, P.pos[2]) + dashFog * 0.6 * (1 - smoothstep(170, 200, f)) + 0.35 * smoothstep(270, 300, f) * (1 - smoothstep(466, 500, f));
    face.style.setProperty('--fog', clamp(fogC).toFixed(3));

    // Sombra proyectada sobre el plano del dashboard
    const z = Math.max(0, P.pos[2]);
    const sh = els.shadows[i];
    const k = clamp(z / 900);
    sh.style.transform = `translate3d(${(local[0] + z * 0.10).toFixed(2)}px, ${(local[1] + z * 0.16).toFixed(2)}px, 0.6px) scale(${(1 + k * 0.25).toFixed(3)})`;
    sh.style.filter = `blur(${(6 + z * 0.06).toFixed(1)}px)`;
    setOpacity(sh, (z > 2 ? 1 : 0) * (0.45 * (1 - k) + 0.08) * smoothstep(0, 30, z));

    // Hueco vacío en el dashboard
    const away = clamp(len(local) / 120);
    setOpacity(els.slots[i], away * 0.9 + pulse(f, E.converge, 1, 14) * 0.8);

    // Estelas luminosas: ecos del contorno en instantes anteriores, sólo con velocidad alta
    for (let k2 = 0; k2 < 3; k2++) {
      const fb = f - (k2 + 1) * 1.6;
      const Q = cardPose(i, fb);
      const Q2 = cardPose(i, fb - 1);
      const speed = len(sub(Q.pos, Q2.pos));
      const t = els.trails[i][k2];
      t.style.left = S[0] - 203.5 + 'px';
      t.style.transform = T3(sub(Q.pos, S), Q.rx, Q.ry, Q.rz, Q.s);
      setOpacity(t, clamp((speed - 8) / 40) * 0.42 * (1 - k2 / 3.2));
    }
  }

  // ---------------- Escena 4: Requiere tu atención ----------------
  const attLift = track(f, [[276, 0], [306, 120, 'arrive'], [372, 120], [404, 0, (x) => bezier(0.45, 0, 0.15, 1)(x)]]);
  const attTilt = track(f, [[276, 0], [292, -5, 'outCubic'], [316, 0, (x) => ease.spring(x, 0.5, 1.2)], [372, 0], [388, 3, 'inOutSine'], [404, 0, 'outCubic']]);
  els.att.style.transform = `translate3d(0px, 0px, ${attLift.toFixed(2)}px) rotateX(${attTilt.toFixed(3)}deg)`;
  const attFocus = smoothstep(262, 290, f) * (1 - smoothstep(380, 400, f));
  els.att.style.setProperty('--fog', (dashFog * (1 - attFocus)).toFixed(3));
  const ROWT = [E.row1, E.row2, E.row3];
  const SPREAD = [-30, 0, 30];
  let lifted = 0;
  for (let i = 0; i < 3; i++) {
    const row = els.attRows[i];
    const t0 = ROWT[i] - 12;
    const k = ease.spring(invLerp(t0, ROWT[i] + 26, f), 0.45, 1.6);
    const back = bezier(0.45, 0, 0.15, 1)(invLerp(370 + i * 3, 400, f));
    const z = lerp((24 + 18 * i) * k, 0, back);
    const y = lerp(SPREAD[i] * k, 0, back);
    const x = -14 * Math.sin(Math.PI * invLerp(t0, ROWT[i] + 14, f));
    lifted = Math.max(lifted, clamp(z / 20));
    row.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
    const face = row.firstElementChild;
    face.style.setProperty('--rr', (13 * clamp(z / 14)).toFixed(2) + 'px');
    const hp = pulse(f, ROWT[i], 2, 18);
    face.style.boxShadow = z > 1 ? `0 ${(z * 0.5).toFixed(1)}px ${(z * 1.2).toFixed(1)}px rgba(25,41,44,${(0.22 * clamp(z / 30)).toFixed(3)}), 0 0 0 ${(1.5 * hp).toFixed(2)}px rgba(99,194,200,${hp.toFixed(3)}), 0 0 ${(26 * hp).toFixed(1)}px rgba(99,194,200,${(0.6 * hp).toFixed(3)})` : 'none';
    // microanimaciones: icono y botón
    const u = invLerp(ROWT[i] - 4, ROWT[i] + 22, f);
    els.ibAtt[i].style.transform = `scale(${(1 + 0.2 * Math.sin(Math.PI * u) * Math.exp(-1.5 * u)).toFixed(4)})`;
    els.btnAtt[i].style.setProperty('--bg', pulse(f, ROWT[i] + 4, 3, 16).toFixed(3));
  }
  const rowsOut = lifted;
  els.attPlate.style.setProperty('--tint', (0.12 * rowsOut).toFixed(3));
  setOpacity(els.attEdge, pulse(f, E.row3, 3, 26) * 0.55 + 0.12 * attFocus + pulse(f, E.converge, 2, 22) * 0.4);
  const asw = invLerp(E.row3 - 4, E.row3 + 40, f);
  els.attSweep.style.setProperty('--ang', (40 + 360 * ease.inOutSine(asw)) + 'deg');
  setOpacity(els.attSweep, Math.sin(Math.PI * asw));

  // ---------------- Escena 5: Agenda en perspectiva ----------------
  // Nivel de profundidad claramente separado del módulo de atención (z≤180) para que nunca sean casi coplanares
  const calZ = track(f, [[344, 0], [362, 330, 'outCubic'], [384, 260, (x) => ease.spring(x, 0.55, 1.1)], [470, 260], [506, 0, (x) => bezier(0.45, 0, 0.15, 1)(x)]]);
  // Sin inclinación propia: planos paralelos a los demás módulos elevados (evita el fallo de
  // ordenamiento BSP de Chromium con planos casi paralelos). La perspectiva la aporta la cámara.
  const calY = track(f, [[344, 0], [362, 70, 'outCubic'], [384, 0, (x) => ease.spring(x, 0.55, 1.1)]]);
  const calS = track(f, [[344, 1], [362, 0.965, 'outCubic'], [384, 1, (x) => ease.spring(x, 0.55, 1.1)]]);
  els.cal.style.transform = `translate3d(0px, ${calY.toFixed(2)}px, ${calZ.toFixed(2)}px) scale(${calS.toFixed(4)})`;
  const calFocus = smoothstep(346, 372, f);
  els.cal.style.setProperty('--fog', (dashFog * (1 - calFocus)).toFixed(3));
  for (let i = 0; i < 7; i++) {
    const w = invLerp(E.calendarLand - 2 + i * 3, E.calendarLand + 20 + i * 3, f);
    const z = 26 * Math.sin(Math.PI * w) * (1 - w * 0.3);
    els.days[i].style.transform = `translateZ(${(z + (i === 2 ? 1 : 0)).toFixed(2)}px)`;
  }
  const selPop = ease.spring(invLerp(E.daySelect - 6, E.daySelect + 26, f), 0.4, 1.6);
  const selZ = 26 * Math.sin(Math.PI * invLerp(E.calendarLand + 4, E.calendarLand + 26, f)) * 0.7;
  els.daySel.style.transform = `translateZ(${(selZ + 0.5).toFixed(2)}px) scale(${(f >= E.daySelect - 6 ? 0.94 + 0.06 * selPop : 1).toFixed(4)})`;
  els.daySel.style.setProperty('--g', (pulse(f, E.daySelect, 3, 24) + 0.15 * smoothstep(E.daySelect, E.daySelect + 20, f) * (1 - smoothstep(460, 500, f))).toFixed(3));
  const AUDT = [E.audience1, E.audience2];
  const AUDZ = [92, 20];
  for (let i = 0; i < 2; i++) {
    const t = invLerp(AUDT[i] - 14, AUDT[i] + 20, f);
    let z = AUDZ[i] * ease.spring(t, 0.55, 1.2);
    z = lerp(z, 0, bezier(0.45, 0, 0.15, 1)(invLerp(468, 502, f)));
    const x = (i === 0 ? -10 : 14) * ease.inOutSine(t) * (1 - smoothstep(468, 502, f));
    els.auds[i].style.transform = `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px)`;
    const face = els.auds[i].firstElementChild;
    face.style.setProperty('--rr', (13 * clamp(z / 16)).toFixed(2) + 'px');
    face.style.boxShadow = z > 1 ? `0 ${(z * 0.45).toFixed(1)}px ${(z * 1.1).toFixed(1)}px rgba(25,41,44,${(0.2 * clamp(z / 40)).toFixed(3)})` : 'none';
    els.btnAud[i].style.setProperty('--bg', pulse(f, AUDT[i] + 3, 3, 16).toFixed(3));
  }
  setOpacity(els.calEdge, pulse(f, E.calendarLand, 3, 26) * 0.45 + 0.16 * smoothstep(E.calendarLand, E.calendarLand + 20, f) * (1 - smoothstep(455, 480, f)) + pulse(f, E.converge, 2, 22) * 0.4);
  const csw = invLerp(E.calendarLand, E.calendarLand + 70, f);
  els.calSweep.style.setProperty('--ang', (200 + 360 * ease.inOutSine(csw)) + 'deg');
  setOpacity(els.calSweep, Math.sin(Math.PI * csw) * 0.7);

  // ---------------- Escena 6: convergencia ----------------
  const lock = pulse(f, E.converge, 2, 26);
  setOpacity(els.dashEdge, lock * 0.9 + 0.12 * smoothstep(E.converge, E.converge + 10, f) * (1 - smoothstep(530, 560, f)));
  setOpacity(els.flash, lock * 0.75 + pulse(f, E.ignite, 2, 14) * 0.35 + pulse(f, E.logo, 3, 30) * 0.25);

  // ---------------- Escena 7: revelación de marca ----------------
  const out = ease.inOutSine(invLerp(522, 548, f));
  els.fade.style.opacity = (1 - out).toFixed(4);
  els.fade.style.filter = out > 0.001 ? `blur(${(out * 7).toFixed(2)}px)` : 'none';
  const lt = invLerp(E.logo, E.logo + 26, f);
  setOpacity(els.brandLogo, ease.outCubic(lt));
  const ls = 0.94 + 0.06 * ease.outQuint(invLerp(E.logo, E.logo + 50, f));
  const ly = 16 * (1 - ease.outQuint(invLerp(E.logo, E.logo + 44, f)));
  els.brandLogo.style.transform = `translateY(${ly.toFixed(3)}px) scale(${ls.toFixed(5)})`; // escala uniforme
  const tg = invLerp(E.tagline, E.tagline + 30, f);
  setOpacity(els.tagline, ease.outCubic(tg));
  els.tagline.style.transform = `translateY(${(18 * (1 - ease.outQuint(tg))).toFixed(3)}px)`;
  els.tagline.style.letterSpacing = (0.05 * (1 - ease.outQuint(invLerp(E.tagline, E.tagline + 40, f))) - 0.005).toFixed(4) + 'em';
  setOpacity(els.brandHalo, smoothstep(530, 585, f) * 0.9 + pulse(f, E.logo, 3, 40) * 0.25);
  els.brandHalo.style.transform = `scale(${(0.85 + 0.15 * ease.outCubic(invLerp(530, 600, f))).toFixed(4)})`;
  setOpacity(els.brandArcs, smoothstep(E.logo + 2, E.logo + 20, f));
  els.arcs.forEach((p, k) => {
    const L = +p.dataset.len;
    const t = ease.outCubic(invLerp(E.logo + 4 + k * 3, E.logo + 46 + k * 3, f));
    p.style.strokeDashoffset = (L * (1 - t)).toFixed(2);
    p.style.opacity = (k < 2 ? 0.55 : 0.28).toString();
  });
  els.brandArcs.style.transform = `scale(${(0.97 + 0.03 * ease.outQuint(invLerp(E.logo, E.logo + 60, f))).toFixed(4)})`;
}

window.__ready = init().then(() => true);
window.renderFrame = (f) => { renderFrame(f); return true; };
window.__camera = camera;
window.__cardPose = cardPose;
// Vista plana de control de fidelidad (no se usa en el render)
window.renderFlat = () => { renderFrame(100); els.cam.style.transform = 'scale(0.54) translate3d(-1000px, -540px, 0px)'; ['hDate','hTitle','hSub','hCta'].forEach((k) => (els[k].style.transform = 'none')); };
