// Línea de tiempo compartida por la escena y el sintetizador. 60 FPS · 300 fotogramas = 5.000 s.
export const FPS = 60;
export const FRAMES = 300;
export const TEXT = 'litivo.com';

// Fotograma en que aparece cada carácter (ritmo humano: intervalos irregulares, pausa antes del punto).
export const KEYS = [62, 71, 79, 89, 97, 107, 122, 132, 140, 150];
export const ENTER = 184;   // 3.07 s: pulsación de Enter
export const ENTRY = [0, 40]; // el buscador llega desde la profundidad

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smoothstep = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const outQuint = (t) => 1 - Math.pow(1 - t, 5);
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const pulse = (f, at, attack = 2, decay = 20) => (f < at - attack ? 0 : f < at ? outCubic((f - (at - attack)) / attack) : Math.exp(-(f - at) / decay));
