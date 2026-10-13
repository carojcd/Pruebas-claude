// Tarjeta de calendario reconstruida por capas. Cada capa entra a su tiempo, flota a su profundidad
// (vista "explosionada" que deja ver de qué se compone) y al final las capas vuelven a unirse.
import { EV, invLerp, smoothstep, outCubic, outQuint, inOutSine, inOutCubic, pulse, clamp } from './timeline.js';

const card = document.getElementById('card');
const L = [];        // capas animadas: { el, t0, dur, z, base, dy, kind }
const fx = {};
const CAL = '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2.6"/><path d="M8 2.8v3.6M16 2.8v3.6M3.5 9.6h17"/><path d="M8.2 13.3h.01M12 13.3h.01M15.8 13.3h.01M8.2 16.9h.01M12 16.9h.01M15.8 16.9h.01" stroke-width="2.2"/></svg>';

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
  add('head', '<svg viewBox="0 0 24 24"><path d="M14.5 6.5L9 12l5.5 5.5"/></svg><span>Septiembre 2026</span><svg viewBox="0 0 24 24"><path d="M9.5 6.5L15 12l-5.5 5.5"/></svg>', null, { t0: EV.header, dur: 40, z: 34 });
  ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'].forEach((d, c) => add('wd', d, { left: 19 + c * 124 + 'px' }, { t0: EV.header + 10 + c * 3, dur: 34, z: 24, dy: 8 }));
  const weeks = [[31, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12, 13], [14, 15, 16, 17, 18, 19, 20], [21, 22, 23, 24, 25, 26, 27], [28, 29, 30, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11]];
  const events = { 12: '2:30 p. m.', 16: '9:00 a. m.', 24: '11:00 a. m.' };
  weeks.forEach((w, r) => w.forEach((d, c) => {
    const out = (r === 0 && d > 7) || (r >= 4 && (r === 5 || d < 7));
    const ev = !out && events[d];
    const sel = !out && d === 10;
    const style = { left: 19 + c * 124 + 'px', top: 100 + r * 80 + 'px' };
    let html = `<b>${d}</b>`, cls = 'cell';
    if (out) cls += ' out';
    if (ev) { cls += ' ev'; html += `<div class="pill">${ev}</div>`; }
    if (sel) { cls += ' sel'; html += '<i style="top:36px">10:00 a. m.</i><i style="top:55px">+1 más</i>'; }
    const el = add(cls, html, style, { t0: EV.grid + (r + c) * 5, dur: 36, z: sel ? 46 : ev ? 30 : out ? 8 : 16, base: sel ? 2 : 1, kind: sel ? 'sel' : ev ? 'ev' : '' });
    if (ev) fx['pill' + d] = el.querySelector('.pill');
    if (sel) { fx.selTxt = [...el.querySelectorAll('i')]; fx.selCell = el; }
  }));
  fx.ring = add('ring', '', { left: 19 + 3 * 124 + 'px', top: '180px', width: '118px', height: '74px' });
  L.push({ el: fx.ring, t0: EV.select, dur: 1, z: 46, base: 3, dy: 0, kind: 'ring' });
  fx.div = add('div', '', null, { t0: EV.divider, dur: 50, z: 10, dy: 0, kind: 'line' });
  add('hoy', 'HOY · 10 SEPTIEMBRE', null, { t0: EV.divider + 8, dur: 36, z: 20, dy: 8 });
  const aud = [['10:00 a. m.', 'María García López', 'Audiencia de negociación de deudas · Insolvencia'], ['2:30 p. m.', 'Daniela Ramírez', 'Audiencia de verificación documental · Insolvencia']];
  aud.forEach(([t, n, s], i) => add('aud', `<div class="ib">${CAL}</div><div class="t">${t}</div><div class="n">${n}</div><div class="s">${s}</div><div class="badge">PROGRAMADA</div>`,
    { top: 640 + i * 88 + 'px' }, { t0: i ? EV.aud2 : EV.aud1, dur: 46, z: 50 + i * 10, dy: 22 }));
}

function renderFrame(f) {
  // Tarjeta: llegada lenta desde la profundidad y deriva orbital suave
  const e = outQuint(invLerp(0, 130, f)), d = inOutSine(invLerp(40, 480, f));
  const z = -1700 * (1 - e) - 110 + 50 * d, y = 160 * (1 - e) - 10 * d;
  const rx = 34 * (1 - e) + 15 - 6 * d, ry = 30 * (1 - e) + 20 - 13 * d, rz = -6 * (1 - e) - 2.5 + 1.5 * d;
  card.style.transform = `translate3d(${(-5 - 10 * d).toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;

  // Profundidad "explosionada": las capas se separan al entrar y se reúnen en la recolocación
  const together = inOutCubic(invLerp(EV.collapse, EV.settle, f));
  for (const c of L) {
    const p = outCubic(invLerp(c.t0, c.t0 + c.dur, f));
    let o = p, zz = (2.4 * c.z + 60 * (1 - p)) * (1 - together) + c.base * together, ty = c.dy * (1 - p), sx = 1;
    if (c.kind === 'line') { o = 1; sx = Math.max(0.001, inOutSine(invLerp(c.t0, c.t0 + c.dur, f))); }
    if (c.kind === 'ring') { o = smoothstep(EV.select - 4, EV.select + 10, f) * (0.35 + 0.65 * pulse(f, EV.select, 3, 50) + 0.5 * pulse(f, EV.settle, 3, 30)); zz = 2.4 * 46 * (1 - together) + 3 * together; }
    c.el.style.opacity = clamp(o).toFixed(4);
    c.el.style.transform = `translate3d(0px, ${ty.toFixed(2)}px, ${zz.toFixed(2)}px)` + (sx !== 1 ? ` scaleX(${sx.toFixed(4)})` : '');
  }
  // Horarios: se dibujan de izquierda a derecha, escalonados
  [12, 16, 24].forEach((k, i) => {
    const t = outCubic(invLerp(EV.pills + i * 8, EV.pills + i * 8 + 30, f));
    fx['pill' + k].style.opacity = t.toFixed(3);
    fx['pill' + k].style.transform = `scaleX(${(0.3 + 0.7 * t).toFixed(4)})`;
  });
  fx.selTxt.forEach((el, i) => { el.style.opacity = smoothstep(EV.select + 6 + i * 8, EV.select + 26 + i * 8, f).toFixed(3); });

  // Resplandor exterior Aqua
  document.getElementById('halo').style.opacity = (0.25 + 0.6 * smoothstep(0, 110, f) + 0.2 * pulse(f, EV.settle, 4, 60)).toFixed(3);
  document.getElementById('arcs').style.opacity = (0.7 * smoothstep(30, 140, f)).toFixed(3);
  document.getElementById('arcs').style.transform = `rotate(${(f * 0.015).toFixed(3)}deg) scale(${(0.97 + 0.03 * d).toFixed(4)})`;
  fx.shadow.style.opacity = (0.8 * e).toFixed(3);
  fx.edge.style.opacity = clamp(0.75 * smoothstep(50, 110, f) + 0.35 * pulse(f, EV.settle, 3, 40)).toFixed(3);
  fx.hglow.style.opacity = clamp(0.6 * smoothstep(50, 120, f) + 0.4 * pulse(f, EV.settle, 3, 50)).toFixed(3);
  const s1 = invLerp(30, 140, f), s2 = invLerp(EV.settle - 10, EV.settle + 70, f);
  const s = f < EV.settle - 10 ? s1 : s2;
  fx.sweep.style.setProperty('--ang', (360 * inOutSine(s) + (f < EV.settle - 10 ? 0 : 140)).toFixed(2) + 'deg');
  fx.sweep.style.opacity = Math.sin(Math.PI * s).toFixed(3);
}

window.__ready = document.fonts.ready.then(() => { build(); return true; });
window.renderFrame = (f) => { renderFrame(f); return true; };
