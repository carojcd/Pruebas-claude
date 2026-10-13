// Sección "Audiencias" por capas: título, indicadores (con conteo), próxima audiencia y filtros
// entran a su tiempo, se reúnen y "Ver audiencia" se activa.
import { EV, invLerp, smoothstep, outCubic, outQuint, inOutSine, inOutCubic, pulse, clamp } from './timeline.js';

const card = document.getElementById('card');
const L = [], fx = {};
const SVG = (d, w = 18) => `<svg viewBox="0 0 24 24" style="width:${w}px;height:${w}px"><path d="${d}"/></svg>`;
const CHEV_D = 'M6.5 9.5l5.5 5.5 5.5-5.5', CHEV_R = 'M9.5 6.5L15 12l-5.5 5.5', CHEV_L = 'M14.5 6.5L9 12l5.5 5.5';

function add(cls, html, style, layer) {
  const el = document.createElement('div');
  el.className = cls; el.innerHTML = html || ''; Object.assign(el.style, style || {});
  card.appendChild(el);
  if (layer) L.push({ el, dy: 14, base: 1, ...layer });
  return el;
}

function build() {
  fx.shadow = add('shadow'); fx.hglow = add('hglow'); fx.face = add('face');
  fx.edge = add('edge'); fx.sweep = add('sweep');
  add('h1', 'Audiencias', null, { t0: EV.title, dur: 44, z: 40, dy: 18 });
  add('h2', 'Consulta y organiza las audiencias de tus procesos.', null, { t0: EV.title + 14, dur: 40, z: 24, dy: 12 });
  add('pn', '', { top: '104px', height: '82px' }, { t0: EV.stats, dur: 42, z: 14, dy: 16 });
  fx.nums = [];
  [[5, 'Próximas audiencias', 38], [2, 'Audiencias hoy', 337], [3, 'Esta semana', 637], [3, 'Audiencias pasadas', 936]].forEach(([n, t, x], i) => {
    const el = add('st tx', `<b>0</b><span>${t}</span>`, { left: x + 'px' }, { t0: EV.stats + 10 + i * 7, dur: 36, z: 34, dy: 10 });
    fx.nums.push({ el: el.querySelector('b'), n, t0: EV.stats + 10 + i * 7 });
  });
  add('pn bn', '', { top: '207px', height: '96px' }, { t0: EV.banner, dur: 44, z: 18, dy: 16 });
  add('k tx', 'PRÓXIMA AUDIENCIA', null, { t0: EV.banner + 12, dur: 36, z: 36, dy: 8 });
  add('l1 tx', '10 SEP · 10:00 a. m. · María García López', null, { t0: EV.banner + 20, dur: 40, z: 44, dy: 10 });
  add('l2 tx', 'Audiencia de negociación de deudas', null, { t0: EV.banner + 28, dur: 36, z: 32, dy: 8 });
  fx.vb = add('vb', 'Ver audiencia', null, { t0: EV.banner + 36, dur: 34, z: 50, dy: 0, kind: 'pop' });
  add('pn', '', { top: '324px', height: '78px' }, { t0: EV.filters, dur: 42, z: 12, dy: 16 });
  add('box', SVG('M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13zM15.4 15.4L20.5 20.5', 21) + '<span class="ph">Buscar por persona, proceso o radicado</span>', { left: '39px', width: '548px' }, { t0: EV.filters + 12, dur: 36, z: 30, dy: 10 });
  [['Todos los tipos', 600, 150], ['Todos los estados', 758, 150], ['Todos los periodos', 916, 160]].forEach(([t, x, w], i) =>
    add('box dd', `<span>${t}</span>` + SVG(CHEV_D, 16), { left: x + 'px', width: w + 'px' }, { t0: EV.filters + 20 + i * 6, dur: 34, z: 26, dy: 10 }));
  add('box mf', SVG('M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4', 20) + 'Más filtros', { left: '1084px', width: '140px' }, { t0: EV.filters + 38, dur: 34, z: 34, dy: 10 });
}

function renderFrame(f) {
  // Tabla: llegada lenta desde la profundidad y deriva orbital suave
  const e = outQuint(invLerp(0, 110, f)), d = inOutSine(invLerp(30, 360, f));
  const z = -1900 * (1 - e) - 400 + 50 * d, y = 160 * (1 - e) - 10 * d;
  const rx = 34 * (1 - e) + 16 - 6 * d, ry = 30 * (1 - e) + 13 - 7 * d, rz = -6 * (1 - e) - 2.5 + 1.5 * d;
  card.style.transform = `translate3d(${(22 - 10 * d).toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;

  // Capas: entran separadas en profundidad y se reúnen al final
  const together = inOutCubic(invLerp(EV.collapse, EV.settle, f));
  for (const c of L) {
    const p = outCubic(invLerp(c.t0, c.t0 + c.dur, f));
    const zz = (2.4 * c.z + 60 * (1 - p)) * (1 - together) + c.base * together;
    const sc = c.kind === 'pop' ? 0.7 + 0.3 * p : 1, sx = c.kind === 'line' ? Math.max(0.001, inOutSine(p)) : 1;
    if (c.kind === 'line') c.el.style.transform = '';
    c.el.style.opacity = p.toFixed(4);
    c.el.style.transform = `translate3d(${((c.dx || 0) * (1 - p)).toFixed(2)}px, ${(c.dy * (1 - p)).toFixed(2)}px, ${zz.toFixed(2)}px)` + (sc !== 1 ? ` scale(${sc.toFixed(4)})` : '') + (sx !== 1 ? ` scaleX(${sx.toFixed(4)})` : '');
  }
  // Indicadores: cuentan hasta su valor
  for (const m of fx.nums) m.el.textContent = Math.round(m.n * outCubic(invLerp(m.t0, m.t0 + 40, f)));
  // Cierre: "Ver audiencia" se activa
  const ch = smoothstep(EV.choose - 6, EV.choose + 14, f);
  fx.vb.style.background = `rgba(220,246,243,${ch.toFixed(3)})`;
  fx.vb.style.boxShadow = ch > 0.01 ? `0 0 0 ${(1.5 * ch).toFixed(2)}px rgba(62,152,145,${(0.7 * ch).toFixed(3)}), 0 0 ${(30 * ch).toFixed(1)}px rgba(99,194,200,${(0.5 * ch).toFixed(3)})` : '';

  // Resplandor exterior Aqua
  document.getElementById('halo').style.opacity = (0.25 + 0.6 * smoothstep(0, 100, f) + 0.2 * pulse(f, EV.settle, 4, 50)).toFixed(3);
  document.getElementById('arcs').style.opacity = (0.7 * smoothstep(30, 130, f)).toFixed(3);
  document.getElementById('arcs').style.transform = `rotate(${(f * 0.015).toFixed(3)}deg) scale(${(0.97 + 0.03 * d).toFixed(4)})`;
  fx.shadow.style.opacity = (0.8 * e).toFixed(3);
  fx.edge.style.opacity = clamp(0.75 * smoothstep(44, 100, f) + 0.35 * pulse(f, EV.settle, 3, 40)).toFixed(3);
  fx.hglow.style.opacity = clamp(0.6 * smoothstep(44, 110, f) + 0.4 * pulse(f, EV.settle, 3, 50)).toFixed(3);
  const a = f < EV.settle - 10, s = a ? invLerp(26, 126, f) : invLerp(EV.settle - 10, EV.settle + 60, f);
  fx.sweep.style.setProperty('--ang', (360 * inOutSine(s) + (a ? 0 : 140)).toFixed(2) + 'deg');
  fx.sweep.style.opacity = Math.sin(Math.PI * s).toFixed(3);
}

window.__ready = document.fonts.ready.then(() => { build(); return true; });
window.renderFrame = (f) => { renderFrame(f); return true; };
