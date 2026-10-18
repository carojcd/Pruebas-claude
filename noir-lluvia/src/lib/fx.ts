import { clamp, Ctx, H, hash, mix, Pt, rng, W } from "./util";

export const PAL = {
  bg0: "#04080a",
  bg1: "#0a1418",
  bg2: "#10202a",
  bg3: "#183039",
  fog: "#22414c",
  neon: "#ff7a1c",
  neonHot: "#ffe2b8",
  window: "#e3772a",
  windowHot: "#ffb766",
  coat: "#3a1b13",
  coatShade: "#200d08",
  rim: "#ff8a3a",
  black: "#060709",
  hat: "#121214",
  legs: "#0c0b0d",
};

type RainOpts = {
  seed: number;
  count: number;
  len: number;
  speed: number;
  width: number;
  alpha: number;
  slant?: number; // dx por px de caída (+ = hacia la derecha)
  color?: string;
};

// Lluvia: trazos finos en diagonal, posición = función pura del fotograma
export const rain = (ctx: Ctx, f: number, o: RainOpts) => {
  const r = rng(o.seed);
  const slant = o.slant ?? -0.12;
  ctx.save();
  ctx.strokeStyle = o.color ?? `rgba(176,205,214,${o.alpha})`;
  ctx.lineWidth = o.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < o.count; i++) {
    const x = r() * (W + 500) - 250;
    const ph = r();
    const sp = o.speed * (0.75 + 0.5 * r());
    const L = o.len * (0.6 + 0.8 * r());
    const span = H + L * 2;
    const y = ((ph * span + f * sp) % span) - L;
    ctx.moveTo(x + slant * y, y);
    ctx.lineTo(x + slant * (y + L), y + L);
  }
  ctx.stroke();
  ctx.restore();
};

// Gotas que rebotan en el suelo: coronas pequeñas que nacen y se apagan en 5 fotogramas
export const groundSplashes = (
  ctx: Ctx,
  f: number,
  o: { seed: number; count: number; y0: number; y1: number; x0?: number; x1?: number; size: number; alpha: number },
) => {
  ctx.save();
  ctx.strokeStyle = `rgba(200,222,230,${o.alpha})`;
  ctx.lineCap = "round";
  for (let i = 0; i < o.count; i++) {
    const period = 9 + Math.floor(hash(o.seed + i) * 10);
    const off = Math.floor(hash(o.seed + i * 3.1) * period);
    const cycle = Math.floor((f + off) / period);
    const ph = (f + off) % period;
    if (ph > 4) continue;
    const r = rng(o.seed * 31 + i * 131 + cycle * 7);
    const y = o.y0 + (o.y1 - o.y0) * Math.pow(r(), 0.7);
    const x = (o.x0 ?? 0) + ((o.x1 ?? W) - (o.x0 ?? 0)) * r();
    const depth = (y - o.y0) / Math.max(1, o.y1 - o.y0);
    const s = o.size * (0.35 + depth) * (0.6 + 0.6 * r());
    const t = ph / 4;
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = Math.max(1, s * 0.18);
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) {
      const a = -Math.PI / 2 + k * 0.45;
      ctx.moveTo(x + Math.cos(a) * s * 0.2 * t, y + Math.sin(a) * s * 0.2 * t);
      ctx.lineTo(x + Math.cos(a) * s * (0.3 + 0.7 * t), y + Math.sin(a) * s * (0.25 + 0.75 * t));
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, s * (0.4 + t), s * (0.12 + 0.25 * t), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

export const glow = (ctx: Ctx, x: number, y: number, r: number, color: string, a: number) => {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, mix(color, color, 0, a));
  g.addColorStop(0.35, mix(color, color, 0, a * 0.45));
  g.addColorStop(1, mix(color, color, 0, 0));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

// Parpadeo del neón: casi siempre encendido, con caídas puntuales deterministas
export const flicker = (f: number, seed = 1) => {
  const n = hash(Math.floor(f / 2) + seed * 1000);
  if (n > 0.93) return 0.25;
  if (n > 0.86) return 0.7;
  return 0.94 + 0.06 * Math.sin(f * 1.7 + seed);
};

// Letrero vertical 酒場
export const neonSign = (ctx: Ctx, x: number, y: number, w: number, h: number, I: number) => {
  const cx = x + w / 2;
  glow(ctx, cx, y + h / 2, Math.max(w, h) * 1.25, PAL.neon, 0.5 * I);
  ctx.save();
  // soporte
  ctx.fillStyle = "#0a0c0d";
  ctx.fillRect(x - w * 0.12, y - h * 0.06, w * 1.24, h * 0.04);
  // panel
  ctx.shadowColor = mix(PAL.neon, PAL.neon, 0, 0.95 * I);
  ctx.shadowBlur = w * 0.55 * I;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, mix("#2a1006", "#e0621c", I));
  g.addColorStop(1, mix("#1c0a04", "#a8400e", I));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.06);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, w * 0.035);
  ctx.strokeStyle = mix("#3a1a0c", "#ffb37a", I);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.strokeStyle = mix("#200c06", "#7a2a08", I);
  ctx.beginPath();
  ctx.roundRect(x + w * 0.08, y + w * 0.08, w * 0.84, h - w * 0.16, w * 0.04);
  ctx.stroke();
  // texto
  ctx.font = `900 ${w * 0.66}px NoirJP`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = mix(PAL.neon, "#ffb066", 0.5, I);
  ctx.shadowBlur = w * 0.3 * I;
  ctx.fillStyle = mix("#5a2008", PAL.neonHot, I);
  ctx.fillText("酒", cx, y + h * 0.29);
  ctx.fillText("場", cx, y + h * 0.71);
  ctx.restore();
};

// Reflejo en suelo mojado: trazos horizontales rotos que ondulan
export const reflection = (
  ctx: Ctx,
  f: number,
  o: { x: number; y: number; w: number; len: number; color: string; alpha: number; seed: number; step?: number },
) => {
  const step = o.step ?? 7;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const rows = Math.floor(o.len / step);
  for (let k = 0; k < rows; k++) {
    const yy = o.y + k * step;
    const fall = Math.pow(1 - k / rows, 1.4);
    const n1 = hash(o.seed + k * 1.37 + Math.floor(f / 3) * 0.01);
    const wob = Math.sin(f * 0.32 + k * 1.9 + o.seed) * o.w * 0.22;
    const ww = o.w * (0.35 + 0.9 * n1) * (0.7 + 0.3 * fall);
    ctx.fillStyle = mix(o.color, o.color, 0, o.alpha * fall * (0.5 + 0.5 * hash(o.seed + k)));
    ctx.fillRect(o.x - ww / 2 + wob, yy, ww, step * (0.35 + 0.4 * n1));
  }
  ctx.restore();
};

// Relámpago por desplazamiento de punto medio, con ramas
const boltPts = (r: () => number, a: Pt, b: Pt, depth: number, disp: number): Pt[] => {
  if (depth === 0) return [a, b];
  const m: Pt = [(a[0] + b[0]) / 2 + (r() - 0.5) * disp, (a[1] + b[1]) / 2 + (r() - 0.5) * disp * 0.3];
  const left = boltPts(r, a, m, depth - 1, disp / 2);
  return [...left.slice(0, -1), ...boltPts(r, m, b, depth - 1, disp / 2)];
};
export const lightning = (ctx: Ctx, seed: number, a: Pt, b: Pt, I: number) => {
  if (I <= 0) return;
  const r = rng(seed);
  const main = boltPts(r, a, b, 7, Math.abs(b[1] - a[1]) * 0.45);
  const branches: Pt[][] = [];
  for (let i = 0; i < 6; i++) {
    const s = main[Math.floor(main.length * (0.15 + 0.6 * r()))];
    const len = 120 + r() * 260;
    const ang = Math.PI / 2 + (r() - 0.5) * 1.6;
    branches.push(boltPts(r, s, [s[0] + Math.cos(ang) * len, s[1] + Math.sin(ang) * len], 5, len * 0.5));
  }
  const stroke = (pts: Pt[], wdt: number, col: string, blur: number) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineWidth = wdt;
    ctx.strokeStyle = col;
    ctx.shadowBlur = blur;
    ctx.stroke();
  };
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.shadowColor = `rgba(150,190,255,${I})`;
  stroke(main, 14, `rgba(120,160,255,${0.35 * I})`, 60);
  branches.forEach((p) => stroke(p, 6, `rgba(120,160,255,${0.3 * I})`, 30));
  stroke(main, 4, `rgba(235,245,255,${I})`, 20);
  branches.forEach((p) => stroke(p, 2, `rgba(220,235,255,${0.8 * I})`, 10));
  ctx.restore();
};

// Grano de película (textura de ruido cacheada, desplazada cada fotograma)
let noise: HTMLCanvasElement | null = null;
export const grain = (ctx: Ctx, f: number, amount = 0.08) => {
  if (!noise) {
    noise = document.createElement("canvas");
    noise.width = noise.height = 256;
    const n = noise.getContext("2d")!;
    const img = n.createImageData(256, 256);
    const r = rng(42);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    n.putImageData(img, 0, 0);
  }
  const pat = ctx.createPattern(noise, "repeat")!;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = "overlay";
  ctx.translate(Math.floor(hash(f) * 256), Math.floor(hash(f + 0.5) * 256));
  ctx.fillStyle = pat;
  ctx.fillRect(-256, -256, W + 512, H + 512);
  ctx.restore();
};

export const vignette = (ctx: Ctx, a = 0.65) => {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.48, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

// Bruma de lluvia: velo vertical claro que da profundidad
export const haze = (ctx: Ctx, y0: number, y1: number, a: number) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(60,100,112,0)`);
  g.addColorStop(0.5, `rgba(60,100,112,${a})`);
  g.addColorStop(1, `rgba(60,100,112,0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
};

export const windowGlow = (ctx: Ctx, pts: Pt[], lit: number, seed: number) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
  ctx.closePath();
  if (lit > 0) {
    const tone = hash(seed);
    ctx.fillStyle = mix(PAL.window, PAL.windowHot, tone * 0.6, clamp(lit));
    ctx.shadowColor = PAL.neon;
    ctx.shadowBlur = 18 * lit;
  } else {
    ctx.fillStyle = "#081014";
    ctx.shadowBlur = 0;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
};
