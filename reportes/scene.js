// Tarjeta "Reportes de facturación" por capas: icono, título y enlace flotan a su profundidad,
// se reúnen y el enlace se activa.
import { EV, invLerp, smoothstep, outCubic, outQuint, inOutSine, inOutCubic, pulse, clamp } from './timeline.js';

const card = document.getElementById('card');
const L = [], fx = {};
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
  add('ic', '<svg viewBox="0 0 24 24"><path d="M14 2.8H7.2a2.1 2.1 0 0 0-2.1 2.1v14.2a2.1 2.1 0 0 0 2.1 2.1h9.6a2.1 2.1 0 0 0 2.1-2.1V7.7z"/><path d="M13.8 2.8v5.1h5.1M9 12.6h6M9 16.3h6M9 9h2"/></svg>', null, { t0: EV.icon, dur: 40, z: 60, dy: 0, kind: 'pop' });
  add('tt', 'Reportes de facturación', null, { t0: EV.title, dur: 46, z: 40, dy: 18 });
  const lk = add('lk', 'Consultar reportes <svg viewBox="0 0 24 24"><path d="M4.5 12h14.5M13.5 6.5L19 12l-5.5 5.5"/></svg>', null, { t0: EV.link, dur: 44, z: 30, dy: 12 });
  fx.go = lk.querySelector('svg');
}

function renderFrame(f) {
  // Tarjeta: llegada lenta desde la profundidad y deriva orbital suave
  const e = outQuint(invLerp(0, 110, f)), d = inOutSine(invLerp(30, 360, f));
  const z = -1700 * (1 - e) - 90 + 50 * d, y = 160 * (1 - e) - 10 * d;
  const rx = 34 * (1 - e) + 16 - 6 * d, ry = 30 * (1 - e) + 20 - 13 * d, rz = -6 * (1 - e) - 2.5 + 1.5 * d;
  card.style.transform = `translate3d(${(-5 - 10 * d).toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;

  // Capas: entran separadas en profundidad y se reúnen al final
  const together = inOutCubic(invLerp(EV.collapse, EV.settle, f));
  for (const c of L) {
    const p = outCubic(invLerp(c.t0, c.t0 + c.dur, f));
    const zz = (2.4 * c.z + 60 * (1 - p)) * (1 - together) + c.base * together;
    const sc = c.kind === 'pop' ? 0.7 + 0.3 * p : 1;
    c.el.style.opacity = p.toFixed(4);
    c.el.style.transform = `translate3d(0px, ${(c.dy * (1 - p)).toFixed(2)}px, ${zz.toFixed(2)}px)` + (sc !== 1 ? ` scale(${sc.toFixed(4)})` : '');
  }
  // Cierre: el enlace se activa y su flecha avanza
  fx.go.style.transform = `translateX(${(10 * Math.sin(Math.PI * invLerp(EV.choose, EV.choose + 40, f))).toFixed(2)}px)`;

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
