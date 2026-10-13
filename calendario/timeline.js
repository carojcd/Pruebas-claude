// Línea de tiempo compartida (escena + sonido). 60 FPS · 480 fotogramas = 8.000 s. Ritmo lento y elegante.
export const FPS = 60;
export const FRAMES = 480;
export const EV = {
  header: 66,    // cabecera "Septiembre 2026"
  grid: 96,      // ola diagonal de días (96 → ~180)
  pills: 192,    // horarios de las audiencias
  select: 228,   // el día 10 se selecciona
  divider: 264,  // línea + "HOY · 10 SEPTIEMBRE"
  aud1: 282,     // tarjeta María García López
  aud2: 306,     // tarjeta Daniela Ramírez
  collapse: 390, // las capas vuelven a unirse (390 → 444)
  settle: 444,   // la tarjeta queda completa
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smoothstep = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const outQuint = (t) => 1 - Math.pow(1 - t, 5);
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const pulse = (f, at, attack = 3, decay = 30) => (f < at - attack ? 0 : f < at ? outCubic((f - (at - attack)) / attack) : Math.exp(-(f - at) / decay));
