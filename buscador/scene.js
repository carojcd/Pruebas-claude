// Estado completo de cada fotograma (acepta fracciones para el motion blur). Sin relojes ni aleatoriedad.
import { TEXT, KEYS, ENTER, clamp, invLerp, smoothstep, outCubic, outQuint, inOutSine, pulse } from './timeline.js';

const $ = (id) => document.getElementById(id);
const op = (el, v) => { el.style.opacity = clamp(v).toFixed(4); };
let spans = [];

async function init() {
  const typed = $('typed');
  spans = [...TEXT].map((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    if (i >= TEXT.indexOf('.')) s.className = 'dom';
    typed.appendChild(s);
    return s;
  });
  await document.fonts.ready;
}

function renderFrame(f) {
  // --- Buscador en perspectiva: llega desde la profundidad y luego deriva lentamente ---
  const e = outQuint(invLerp(0, 46, f));
  const drift = inOutSine(invLerp(30, 300, f));
  const z = -1300 * (1 - e) + 100 + 130 * drift;
  const y = 140 * (1 - e) - 10 * drift;
  const x = 70 - 40 * (1 - e) - 20 * drift;
  const rx = 30 * (1 - e) + 14 - 4 * drift;
  const ry = 26 * (1 - e) + 34 - 10 * drift;
  const rz = -6 * (1 - e) - 4 + 1.5 * drift;
  const press = f < ENTER - 3 ? 0 : f < ENTER ? outCubic((f - ENTER + 3) / 3) : Math.exp(-(f - ENTER) / 6);
  $('bar').style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${(z - 14 * press).toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;

  // --- Entorno ---
  op($('halo'), 0.25 + 0.55 * smoothstep(0, 45, f) + 0.25 * pulse(f, ENTER, 3, 40));
  op($('arcs'), 0.7 * smoothstep(20, 80, f));
  $('arcs').style.transform = `scale(${(0.96 + 0.04 * drift).toFixed(4)}) rotate(${(f * 0.02).toFixed(3)}deg)`;
  op($('shadow'), 0.8 * e);

  // --- Resplandor exterior Aqua (línea + halo + barrido) ---
  const keyFlick = KEYS.reduce((a, k) => a + 0.12 * pulse(f, k, 1, 8), 0);
  const glow = 0.85 * smoothstep(22, 44, f) + keyFlick + 0.5 * pulse(f, ENTER, 2, 26);
  op($('edge'), glow);
  op($('barHalo'), 0.75 * smoothstep(22, 50, f) + 0.6 * pulse(f, ENTER, 2, 30));
  const s1 = invLerp(8, 70, f), s2 = invLerp(ENTER, ENTER + 56, f);
  const sweepAng = f < ENTER ? 360 * inOutSine(s1) : 360 * inOutSine(s2) + 120;
  $('sweep').style.setProperty('--ang', sweepAng.toFixed(2) + 'deg');
  op($('sweep'), f < ENTER ? Math.sin(Math.PI * s1) : Math.sin(Math.PI * s2));
  const sp = invLerp(ENTER + 2, ENTER + 40, f);
  $('spec').style.setProperty('--spec', (-60 + 120 * inOutSine(sp)) + '%');
  $('spec').style.setProperty('--specO', (Math.sin(Math.PI * sp) * 0.9).toFixed(3));

  // --- Escritura de "litivo.com" ---
  op($('placeholder'), 1 - smoothstep(KEYS[0] - 3, KEYS[0], f));
  spans.forEach((s, i) => {
    const t = invLerp(KEYS[i], KEYS[i] + 5, f);
    s.style.display = f < KEYS[i] ? 'none' : ''; // el cursor queda tras el último carácter escrito
    s.style.opacity = t.toFixed(3);
    s.style.transform = `translateY(${(10 * (1 - outCubic(t))).toFixed(2)}px) scale(${(0.9 + 0.1 * outCubic(t)).toFixed(4)})`;
  });
  const typing = f >= KEYS[0] - 6 && f < KEYS[KEYS.length - 1] + 12;
  const blink = Math.floor(f / 30) % 2 === 0 ? 1 : 0; // parpadeo a 1 Hz ligado al fotograma
  op($('caret'), f < 24 ? 0 : f >= ENTER ? 0 : typing ? 1 : blink);

  // --- Enter: compresión del botón y respuesta luminosa ---
  $('btn').style.transform = `scale(${(1 - 0.09 * press).toFixed(4)})`;
  op($('btnGlow'), pulse(f, ENTER, 2, 22));
}

window.__ready = init().then(() => true);
window.renderFrame = (f) => { renderFrame(f); return true; };
