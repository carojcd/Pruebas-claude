// Modal "Nuevo proceso" reconstruido por capas: entra, cada componente flota a su profundidad,
// las capas se reúnen y "Conciliación" se resalta como opción elegida.
import { EV, invLerp, smoothstep, outCubic, outQuint, inOutSine, inOutCubic, pulse, clamp } from './timeline.js';

const card = document.getElementById('card');
const L = [], fx = {};
const HAND = '<svg viewBox="0 0 24 24"><path d="M11 17.5l1.8 1.6a1.4 1.4 0 0 0 2-2"/><path d="M14 18.5l1 .8a1.4 1.4 0 0 0 2-2l-3.4-3.3"/><path d="M15.3 15.6l1.3 1.1a1.4 1.4 0 0 0 2-2l-4.3-4.3a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.9-2.8a3 3 0 0 1 3.6-.4l.4.2a3 3 0 0 0 1.6.4H21"/><path d="M21 15h-2.1M3 6.5h2.3l4.1 4.1M3 15h2l5.2 4.9"/></svg>';
const BANK = '<svg viewBox="0 0 24 24"><path d="M3 20.5h18M5.5 17.5v-7M9.8 17.5v-7M14.2 17.5v-7M18.5 17.5v-7M3 8.2L12 3.5l9 4.7z"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24"><path d="M9.5 6.5L15 12l-5.5 5.5"/></svg>';

function add(cls, html, style, layer) {
  const el = document.createElement('div');
  el.className = cls; el.innerHTML = html || ''; Object.assign(el.style, style || {});
  card.appendChild(el);
  if (layer) L.push({ el, dy: 14, base: 1, ...layer });
  return el;
}

function build() {
  fx.shadow = add('shadow'); fx.hglow = add('hglow'); add('face');
  fx.edge = add('edge'); fx.sweep = add('sweep');
  add('lbl', 'NUEVO PROCESO', null, { t0: EV.label, dur: 36, z: 22, dy: 10 });
  add('ttl', '¿Qué proceso quieres iniciar?', null, { t0: EV.title, dur: 44, z: 34, dy: 18 });
  add('sub', 'Selecciona una opción para comenzar una nueva solicitud.', null, { t0: EV.sub, dur: 40, z: 18, dy: 12 });
  add('x', '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>', null, { t0: EV.close, dur: 32, z: 26, dy: 0, kind: 'pop' });
  [['Conciliación', 'Inicia una solicitud de conciliación', HAND, EV.opt1, 49], ['Insolvencia', 'Inicia una solicitud de insolvencia', BANK, EV.opt2, 463]].forEach(([t, d, ic, t0, x], i) => {
    const o = add('opt', '', { left: x + 'px' }, { t0, dur: 46, z: 14, dy: 24 });
    if (!i) fx.opt = o;
    const at = (cls, html, top, l) => add(cls, html, { left: x + 27 + 'px', top: 217 + top + 'px' }, l);
    at('ib', ic, 27, { t0: t0 + 30, dur: 34, z: 52, dy: 0, kind: 'pop' });
    at('ot', t, 128, { t0: t0 + 42, dur: 38, z: 40, dy: 12 });
    at('od', d, 168, { t0: t0 + 52, dur: 38, z: 30, dy: 10 });
    const c = at('oc', 'Comenzar ' + CHEV, 214, { t0: t0 + 64, dur: 38, z: 36, dy: 10 });
    if (!i) fx.go = c.querySelector('svg');
  });
}

function renderFrame(f) {
  // Modal: llegada lenta desde la profundidad y deriva orbital suave
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
  // Cierre: Conciliación se resalta y su flecha avanza
  const ch = smoothstep(EV.choose - 6, EV.choose + 14, f);
  fx.opt.classList.toggle('on', ch > 0.01);
  fx.opt.style.boxShadow = ch > 0.01 ? `0 0 0 ${(1.5 * ch).toFixed(2)}px rgba(62,152,145,${(0.7 * ch).toFixed(3)}), 0 0 ${(40 * ch).toFixed(1)}px rgba(99,194,200,${(0.5 * ch).toFixed(3)})` : '';
  fx.go.style.transform = `translateX(${(6 * Math.sin(Math.PI * invLerp(EV.choose, EV.choose + 36, f))).toFixed(2)}px)`;

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
