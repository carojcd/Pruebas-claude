// Tabla de procesos reconstruida por capas: buscador, filtros, estados y filas entran a su tiempo,
// las barras de etapa se llenan, las capas se reúnen y la primera fila se resalta.
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
  fx.shadow = add('shadow'); fx.hglow = add('hglow'); add('face');
  fx.edge = add('edge'); fx.sweep = add('sweep');
  add('box', SVG('M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13zM15.4 15.4L20.5 20.5', 22) + '<span class="ph">Buscar por persona, identificación, radicado o ID</span>', { left: '26px', width: '449px' }, { t0: EV.search, dur: 40, z: 30, dy: 12 });
  [['Tipo de proceso', 487, 175], ['Estado', 671, 191], ['Etapa', 871, 207]].forEach(([t, x, w], i) =>
    add('box dd', `<span>${t}</span>` + SVG(CHEV_D, 16), { left: x + 'px', width: w + 'px' }, { t0: EV.filters + i * 6, dur: 36, z: 24, dy: 12 }));
  add('box mf', SVG('M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4', 20) + 'Más filtros', { left: '1087px', width: '140px' }, { t0: EV.filters + 18, dur: 36, z: 34, dy: 12 });
  add('hr', '', null, { t0: EV.chips - 6, dur: 40, z: 6, dy: 0, kind: 'line' });
  [['Todos', 26, 64], ['Activos', 98, 72], ['En proceso', 178, 94], ['Suspendidos', 281, 106], ['Acuerdo de pago', 395, 131], ['Liquidación patrimonial', 534, 168]].forEach(([t, x, w], i) =>
    add('chip' + (i ? '' : ' on'), t, { left: x + 'px', width: w + 'px' }, { t0: EV.chips + i * 5, dur: 32, z: i ? 18 : 30, dy: 8 }));
  add('th', [['PERSONA', 30], ['TIPO', 356], ['ETAPA', 508], ['ESTADO', 781], ['ÚLTIMA ACTIVIDAD', 963]].map(([t, x]) => `<span style="left:${x - 1}px">${t}</span>`).join(''), null, { t0: EV.head, dur: 36, z: 12, dy: 0 });
  fx.bars = [];
  [['MG', 'María García López', '123456', 'Insolvencia', 'Negociación de deudas', 0.72, 'ACTIVA', 'Hoy, 10:42 a. m.'],
   ['CR', 'Carlos Rodríguez', '123457', 'Conciliación', 'Audiencia', 0.55, 'EN PROCESO', 'Ayer, 4:18 p. m.'],
   ['AM', 'Ana Martínez', '123458', 'Conciliación', 'Solicitud radicada', 0.30, 'ACTIVA', '8 sep, 11:05 a. m.']].forEach(([ini, nm, rad, tp, et, v, bd, dt], i) => {
    const t0 = EV.rows + i * 18;
    const r = add('rw', `<div class="av">${ini}</div><div class="nm">${nm}</div><div class="rd">Radicado ${rad}</div><div class="tp">${tp}</div><div class="et">${et}</div><div class="bar"><i></i></div><div class="bd">${bd}</div><div class="dt">${dt}</div><div class="go">${SVG(CHEV_R)}</div>`,
      { top: 189 + i * 69 + 'px' }, { t0, dur: 44, z: 40 - i * 8, dy: 0, dx: 22 });
    fx.bars.push({ el: r.querySelector('.bar i'), v, t0: t0 + 26 });
    if (!i) { fx.row = r; fx.go = r.querySelector('.go'); }
  });
  add('ft', 'Mostrando 3 de 8 procesos', null, { t0: EV.footer, dur: 36, z: 14, dy: 8 });
  [[991, SVG(CHEV_L), 'background:#D9DFE2'], [1040, '1', 'border:1.5px solid #3E9891'], [1088, '2', ''], [1136, '3', ''], [1184, SVG(CHEV_R), '']].forEach(([x, c, st], i) => {
    const el = add('pg', c, { left: x + 'px' }, { t0: EV.footer + 8 + i * 4, dur: 30, z: i === 1 ? 30 : 18, dy: 8 });
    if (st) el.style.cssText += ';' + st;
  });
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
  // Barras de etapa: se llenan hasta su avance real
  for (const b of fx.bars) b.el.style.transform = `scaleX(${(b.v * inOutCubic(invLerp(b.t0, b.t0 + 50, f))).toFixed(4)})`;
  // Cierre: la primera fila se resalta y su flecha avanza
  const ch = smoothstep(EV.choose - 6, EV.choose + 14, f);
  fx.row.style.background = `rgba(220,246,243,${(0.6 * ch).toFixed(3)})`;
  fx.row.style.boxShadow = ch > 0.01 ? `inset 3px 0 0 rgba(62,152,145,${ch.toFixed(3)})` : '';
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
