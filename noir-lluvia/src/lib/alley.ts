import { PAL, reflection, windowGlow } from "./fx";
import { clamp, Ctx, H, hash, mix, Pt, rng, W } from "./util";

// Cámara de proyección simple: el ojo mira al fondo del callejón (eje Z); Y positivo hacia abajo
export type Cam = { vx: number; vy: number; fl: number; eye: number }; // eye = altura del ojo sobre el suelo
// h = altura sobre el suelo (m): el suelo (h=0) cae eye·fl/Z por debajo del horizonte
export const proj = (c: Cam, X: number, h: number, Z: number): Pt => [c.vx + (X * c.fl) / Z, c.vy + ((c.eye - h) * c.fl) / Z];

type Light = { x: number; y: number; w: number; z: number; color: string; a: number };

export type AlleyOpts = {
  cam: Cam;
  seed: number;
  half: number; // media anchura del callejón (m)
  zNear: number;
  zFar: number;
  sky: [string, string];
  skyFlash?: number;
  litProb?: number;
  f: number;
  afterSky?: () => void; // p. ej. el relámpago, que debe quedar detrás de los edificios
};

// Color de fachada: dos tonos alternos, perdiéndose en la bruma con la distancia
const wallColor = (side: number, z: number, o: AlleyOpts, k: number) => {
  const base = hash(o.seed + k) > 0.5 ? "#10202a" : side < 0 ? "#0c181d" : "#0a1519";
  return mix(base, PAL.fog, clamp(z / o.zFar) * 0.75);
};

export const drawAlley = (ctx: Ctx, o: AlleyOpts) => {
  const { cam } = o;
  const P = (X: number, h: number, Z: number) => proj(cam, X, h, Z);
  const lights: Light[] = [];

  // cielo
  const sg = ctx.createLinearGradient(0, 0, 0, cam.vy);
  sg.addColorStop(0, o.sky[0]);
  sg.addColorStop(1, o.sky[1]);
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
  if (o.skyFlash) {
    ctx.fillStyle = `rgba(190,215,255,${0.55 * o.skyFlash})`;
    ctx.fillRect(0, 0, W, cam.vy + 200);
  }
  o.afterSky?.();

  // edificio del fondo
  const fz = o.zFar;
  const backH = 14;
  const bl = P(-o.half * 1.6, 0, fz);
  const tr = P(o.half * 1.6, backH, fz);
  ctx.fillStyle = mix("#0f1f26", PAL.fog, 0.8);
  ctx.fillRect(bl[0], tr[1], tr[0] - bl[0], bl[1] - tr[1]);

  // fachadas: segmentos de fondo a frente
  for (const side of [-1, 1]) {
    const r = rng(o.seed + (side > 0 ? 991 : 17));
    const segs: { z0: number; z1: number; h: number; k: number }[] = [];
    let z = o.zNear;
    let k = 0;
    while (z < o.zFar) {
      const len = 3 + r() * 6;
      segs.push({ z0: z, z1: Math.min(o.zFar, z + len), h: 6 + r() * 9, k: k++ });
      z += len;
    }
    segs.reverse().forEach((sg2) => {
      const X = side * o.half;
      const quad: Pt[] = [P(X, 0, sg2.z0), P(X, sg2.h, sg2.z0), P(X, sg2.h, sg2.z1), P(X, 0, sg2.z1)];
      ctx.fillStyle = wallColor(side, (sg2.z0 + sg2.z1) / 2, o, sg2.k + side * 50);
      ctx.beginPath();
      ctx.moveTo(quad[0][0], quad[0][1]);
      quad.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
      // cornisa
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = Math.max(1, 30 / sg2.z0);
      ctx.beginPath();
      ctx.moveTo(quad[1][0], quad[1][1]);
      ctx.lineTo(quad[2][0], quad[2][1]);
      ctx.stroke();
      // ventanas
      const rw = rng(o.seed * 7 + sg2.k * 13 + (side > 0 ? 5 : 0));
      for (let zz = sg2.z0 + 0.5; zz < sg2.z1 - 0.8; zz += 1.7) {
        for (let hy = 2.2; hy < sg2.h - 0.8; hy += 1.55) {
          const lit = rw() < (o.litProb ?? 0.2) ? 0.75 + 0.25 * rw() : 0;
          const wz0 = zz;
          const wz1 = zz + 0.75;
          const pts = [P(X, hy, wz0), P(X, hy + 0.85, wz0), P(X, hy + 0.85, wz1), P(X, hy, wz1)];
          windowGlow(ctx, pts, lit, sg2.k * 100 + zz + hy);
          if (lit && hy < 5) lights.push({ x: (pts[0][0] + pts[2][0]) / 2, y: 0, w: Math.abs(pts[2][0] - pts[0][0]) * 1.4, z: zz, color: PAL.window, a: 0.22 });
        }
      }
      // bajantes
      ctx.strokeStyle = "rgba(4,8,10,0.8)";
      ctx.lineWidth = Math.max(1, 40 / sg2.z1);
      const pz = (sg2.z0 + sg2.z1) / 2;
      const p0 = P(X - side * 0.05, 0, pz);
      const p1 = P(X - side * 0.05, sg2.h, pz);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    });
  }

  // suelo mojado
  const g0 = P(-o.half, 0, o.zNear);
  const g1 = P(o.half, 0, o.zNear);
  const g2 = P(o.half, 0, o.zFar);
  const g3 = P(-o.half, 0, o.zFar);
  const gg = ctx.createLinearGradient(0, g3[1], 0, Math.min(H, g0[1]));
  gg.addColorStop(0, mix("#1e3a44", o.sky[1], 0.5));
  gg.addColorStop(0.25, "#0d1b20");
  gg.addColorStop(1, "#05090b");
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.lineTo(g3[0], g3[1]);
  ctx.closePath();
  ctx.fill();
  // reflejo del cielo en el agua
  if (o.skyFlash) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(150,190,240,${0.25 * o.skyFlash})`;
    ctx.fill();
    ctx.restore();
  }
  // reflejos de ventanas iluminadas
  lights.forEach((l, i) => {
    const gy = P(0, 0, l.z)[1];
    reflection(ctx, o.f, { x: l.x, y: gy, w: l.w, len: Math.min(500, 2600 / l.z), color: l.color, alpha: l.a, seed: i * 3.3 + o.seed, step: Math.max(3, 30 / l.z) });
  });

  return { P, lights };
};

// Postes con cables (en orden de profundidad, llamar después de las fachadas)
export const poles = (ctx: Ctx, o: AlleyOpts, list: { side: number; z: number }[]) => {
  const P = (X: number, h: number, Z: number) => proj(o.cam, X, h, Z);
  const tops: Pt[] = [];
  [...list].sort((a, b) => b.z - a.z).forEach((pl) => {
    const X = pl.side * (o.half - 0.25);
    const b = P(X, 0, pl.z);
    const t = P(X, 9.5, pl.z);
    const w = Math.max(2, 160 / pl.z);
    ctx.fillStyle = "#05090b";
    ctx.fillRect(b[0] - w / 2, t[1], w, b[1] - t[1]);
    // travesaños y transformador
    for (const hh of [8.6, 9.2]) {
      const a = P(X - 0.5, hh, pl.z);
      const c = P(X + 0.5, hh, pl.z);
      ctx.fillRect(a[0], a[1], c[0] - a[0], Math.max(1.5, w * 0.35));
    }
    const tr = P(X - pl.side * 0.22, 7.4, pl.z);
    ctx.fillRect(tr[0] - w * 0.9, tr[1], w * 1.8, w * 2.4);
    tops.push(P(X, 8.9, pl.z));
  });
  // cables entre postes (y cruzando el callejón)
  ctx.strokeStyle = "rgba(3,6,8,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < tops.length - 1; i++) {
    const a = tops[i];
    const b = tops[i + 1];
    for (let k = 0; k < 3; k++) {
      const sag = 40 + k * 25;
      ctx.moveTo(a[0], a[1] + k * 6);
      ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1] + k * 6);
    }
  }
  ctx.stroke();
};
