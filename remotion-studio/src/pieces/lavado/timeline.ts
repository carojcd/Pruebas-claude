// Línea de tiempo (30 fps). Duraciones de los clips preparados con tools/prep_lavado.py.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const INTRO = 150;           // 5.0 s
export const P1 = 588;              // video 1  (19.6 s)
export const P2 = 1749;             // video 2  (58.3 s) con seguimiento de cámara
export const P3 = 1693;             // video 3  (56.4 s) completo, incluye secado y caneca roja
export const OUTRO = 135;           // 4.5 s
export const START = { intro: 0, p1: INTRO, p2: INTRO + P1, p3: INTRO + P1 + P2, outro: INTRO + P1 + P2 + P3 };
export const TOTAL = START.outro + OUTRO;
export const CUTS = [START.p1, START.p2, START.p3, START.outro];   // puntos de transición
