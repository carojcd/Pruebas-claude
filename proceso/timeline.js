// Línea de tiempo compartida (escena + sonido). 60 FPS · 360 fotogramas = 6.000 s. Ritmo lento y elegante.
export const FPS = 60;
export const FRAMES = 360;
export const EV = {
  label: 46, title: 58, sub: 76, close: 88, // encabezado
  opt1: 104, opt2: 122,                      // tarjetas de opción (contenido interno +34 / +46 / +60)
  collapse: 232, settle: 276,                // las capas se reúnen
  choose: 300,                               // Conciliación se resalta como opción elegida
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smoothstep = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const outQuint = (t) => 1 - Math.pow(1 - t, 5);
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const pulse = (f, at, attack = 3, decay = 30) => (f < at - attack ? 0 : f < at ? outCubic((f - (at - attack)) / attack) : Math.exp(-(f - at) / decay));
