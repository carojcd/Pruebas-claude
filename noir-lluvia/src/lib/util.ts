export const W = 1080;
export const H = 1920;
export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];

// PRNG determinista (mulberry32): el mismo fotograma siempre se dibuja igual
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const hash = (n: number) => rng(Math.floor(n * 7919) + 104729)();

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 2.2);
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

const hexRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number, alpha = 1) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
};
export const rgba = (h: string, a: number) => mix(h, h, 0, a);

// Curva suave cerrada/abierta que pasa por los puntos (Catmull-Rom → Bézier)
export const curve = (ctx: Ctx, pts: Pt[], closed = true, k = 0.5) => {
  const n = pts.length;
  const p = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    ctx.bezierCurveTo(
      p1[0] + ((p2[0] - p0[0]) * k) / 3,
      p1[1] + ((p2[1] - p0[1]) * k) / 3,
      p2[0] - ((p3[0] - p1[0]) * k) / 3,
      p2[1] - ((p3[1] - p1[1]) * k) / 3,
      p2[0],
      p2[1],
    );
  }
  if (closed) ctx.closePath();
};

export const poly = (ctx: Ctx, pts: Pt[]) => {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};

// Relleno con borde de luz (rim light): la forma en color de luz y encima la misma forma desplazada en color base
export const rimFill = (ctx: Ctx, path: () => void, base: string | CanvasGradient, rim: string, dx: number, dy = 0) => {
  ctx.save();
  ctx.beginPath();
  path();
  ctx.clip();
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.translate(dx, dy);
  ctx.beginPath();
  path();
  ctx.fillStyle = base;
  ctx.fill();
  ctx.restore();
};
