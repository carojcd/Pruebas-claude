// Panel de notificaciones por capas: encabezado, avisos y botón flotan a su profundidad,
// se reúnen y el botón inferior se activa.
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

const ICON = {
  cal: '<rect x="3.5" y="4.5" width="17" height="16" rx="2.6"/><path d="M8 2.8v3.6M16 2.8v3.6M3.5 9.6h17M8.2 13.3h.01M12 13.3h.01M15.8 13.3h.01M8.2 16.9h.01M12 16.9h.01M15.8 16.9h.01"/>',
  file: '<path d="M14 2.8H7.2a2.1 2.1 0 0 0-2.1 2.1v14.2a2.1 2.1 0 0 0 2.1 2.1h9.6a2.1 2.1 0 0 0 2.1-2.1V7.7z"/><path d="M13.8 2.8v5.1h5.1M9 12.6h6M9 16.3h6M9 9h2"/>',
  task: '<path d="M3.5 6.5l1.6 1.6 2.9-3M3.5 14.5l1.6 1.6 2.9-3M11.5 7h9M11.5 15h9M11.5 11h6"/>',
};
function build() {
  fx.shadow = add('shadow'); fx.hglow = add('hglow'); fx.face = add('face');
  fx.edge = add('edge'); fx.sweep = add('sweep');
  add('hd', 'Notificaciones (4)', null, { t0: EV.head, dur: 40, z: 34, dy: 14 });
  add('mt', 'Marcar todas', null, { t0: EV.head + 10, dur: 36, z: 22, dy: 10 });
  add('hr', '', null, { t0: EV.head + 10, dur: 40, z: 4, dy: 0, kind: 'line' });
  add('sb', '', null, { t0: EV.items + 70, dur: 36, z: 10, dy: 0 });
  [['cal', 'Audiencia próxima hoy', 'María García López · Insolvencia', 'Hoy · 7:15 a. m.', ['Ver audiencia', 115], 266],
   ['file', 'Documento pendiente de revisión', 'Daniela Ramírez · Insolvencia', 'Hoy · 6:40 a. m.', ['Revisar documento', 115], 314],
   ['task', 'Tarea pendiente por vencer', 'Carlos Rodríguez · Conciliación', 'Ayer · 5:20 p. m.', ['Ver proceso', 115], 251]].forEach(([ic, t, s, h, [a1, x1], x2], i) => {
    const t0 = EV.items + i * 24, top = [84, 272, 454][i], ht = [188, 182, 183][i];
    add('it', `<div class="ib"><svg viewBox="0 0 24 24">${ICON[ic]}</svg></div><div class="t">${t}<i></i></div><div class="s">${s}</div><div class="h">${h}</div><div class="a" style="left:${x1}px">${a1}</div><div class="a" style="left:${x2}px">Marcar como leída</div>`,
      { top: top + 'px', height: ht + 'px', borderRadius: i ? '0' : '0' }, { t0, dur: 46, z: 44 - i * 8, dy: 0, dx: 30 });
  });
  fx.bt = add('bt', 'Ver todas las notificaciones', null, { t0: EV.foot, dur: 44, z: 36, dy: 16 });
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
    c.el.style.transform = `translate3d(${((c.dx || 0) * (1 - p)).toFixed(2)}px, ${(c.dy * (1 - p)).toFixed(2)}px, ${zz.toFixed(2)}px)` + (sc !== 1 ? ` scale(${sc.toFixed(4)})` : '');
  }
  // Cierre: el botón inferior se activa
  const ch = smoothstep(EV.choose - 6, EV.choose + 14, f);
  fx.bt.style.background = `rgba(220,246,243,${(0.8 * ch).toFixed(3)})`;
  fx.bt.style.boxShadow = ch > 0.01 ? `0 0 0 ${(1.5 * ch).toFixed(2)}px rgba(62,152,145,${(0.7 * ch).toFixed(3)}), 0 0 ${(34 * ch).toFixed(1)}px rgba(99,194,200,${(0.5 * ch).toFixed(3)})` : '';

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
