import { drawAlley, poles, proj } from "./lib/alley";
import { sideWalker, standingFigure } from "./lib/figures";
import {
  flicker,
  glow,
  groundSplashes,
  haze,
  lightning,
  neonSign,
  PAL,
  rain,
  reflection,
  windowGlow,
} from "./lib/fx";
import { clamp, Ctx, curve, easeIn, easeOut, H, hash, lerp, mix, Pt, rimFill, rng, W } from "./lib/util";

// Cámara 2D: zoom alrededor de (cx, cy) + desplazamiento
const cam = (ctx: Ctx, s: number, cx: number, cy: number, dx = 0, dy = 0) => {
  ctx.translate(cx + dx, cy + dy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
};

const rainLayers = (ctx: Ctx, f: number, k = 1, seed = 1) => {
  rain(ctx, f, { seed: seed * 11, count: Math.round(420 * k), len: 46, speed: 64, width: 1.2, alpha: 0.22 });
  rain(ctx, f, { seed: seed * 23, count: Math.round(120 * k), len: 120, speed: 120, width: 2, alpha: 0.32 });
};
const rainFront = (ctx: Ctx, f: number, k = 1, seed = 1) => {
  rain(ctx, f, { seed: seed * 37, count: Math.round(40 * k), len: 260, speed: 210, width: 3.5, alpha: 0.28 });
};

// Reflejo de una figura en el suelo mojado (espejo vertical, tenue)
const mirrored = (ctx: Ctx, gy: number, a: number, draw: () => void) => {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(0, gy * 2);
  ctx.scale(1, -1);
  draw();
  ctx.restore();
};

// ───────────────────────── A · Callejón desde arriba ─────────────────────────
export const shotA = (ctx: Ctx, f: number, n: number) => {
  const t = f / n;
  ctx.save();
  cam(ctx, lerp(1.0, 1.07, easeOut(t)), 540, 900, 0, lerp(0, -30, t));
  const o = {
    cam: { vx: 540, vy: 300, fl: 900, eye: 6.2 },
    seed: 7,
    half: 1.6,
    zNear: 1.2,
    zFar: 42,
    sky: ["#071014", "#16303a"] as [string, string],
    litProb: 0.22,
    f,
  };
  const { P } = drawAlley(ctx, o);
  // letrero en la pared derecha
  const I = flicker(f, 3);
  const st = P(o.half - 0.38, 4.4, 9);
  const sb = P(o.half - 0.38 + 0.5, 2.3, 9);
  reflection(ctx, f, { x: (st[0] + sb[0]) / 2, y: P(0, 0, 9)[1], w: (sb[0] - st[0]) * 1.4, len: 520, color: PAL.neon, alpha: 0.55 * I, seed: 4, step: 6 });
  neonSign(ctx, st[0], st[1], sb[0] - st[0], sb[1] - st[1], I);
  poles(ctx, o, [
    { side: -1, z: 3.6 },
    { side: 1, z: 7.5 },
    { side: -1, z: 12 },
    { side: 1, z: 19 },
    { side: -1, z: 28 },
  ]);
  // personaje diminuto que camina hacia cámara
  const z = lerp(15, 13.6, t);
  const feet = P(0.15, 0, z);
  const hpx = (1.85 * o.cam.fl) / z;
  mirrored(ctx, feet[1], 0.25, () => standingFigure(ctx, feet[0], feet[1], hpx, { walk: f / 15, rimL: 0.2, rimR: 0.7 }));
  standingFigure(ctx, feet[0], feet[1], hpx, { walk: f / 15, rimL: 0.2, rimR: 0.7 });
  groundSplashes(ctx, f, { seed: 3, count: 90, y0: 900, y1: H, x0: 250, x1: 830, size: 22, alpha: 0.5 });
  haze(ctx, 150, 1000, 0.16);
  ctx.restore();
  rainLayers(ctx, f, 1.1, 1);
  rainFront(ctx, f, 0.8, 1);
};

// ───────────────────────── B · Paso lateral junto al neón ─────────────────────────
export const shotB = (ctx: Ctx, f: number) => {
  const sx = -f * 5; // la cámara acompaña: el fondo se desplaza
  const gy = 1480;
  const I = flicker(f + 30, 5);
  ctx.save();
  cam(ctx, 1.02, 540, 960);
  // muro
  const wg = ctx.createLinearGradient(0, 0, 0, gy);
  wg.addColorStop(0, "#081115");
  wg.addColorStop(1, "#0f1e24");
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, gy);
  ctx.save();
  ctx.translate(sx, 0);
  const r = rng(12);
  for (let i = 0; i < 9; i++) {
    const x = -200 + i * 230;
    ctx.fillStyle = mix("#0b171c", "#13252d", r() * 0.6);
    ctx.fillRect(x, 0, 226, gy);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 224, 0, 6, gy);
    // manchas de humedad
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.12})`;
      ctx.fillRect(x + r() * 200, r() * 600, 4 + r() * 20, 300 + r() * 900);
    }
  }
  // tuberías
  for (const px of [120, 470, 560]) {
    const pg = ctx.createLinearGradient(px, 0, px + 34, 0);
    pg.addColorStop(0, "#05090b");
    pg.addColorStop(0.7, "#1a2c33");
    pg.addColorStop(1, "#070c0e");
    ctx.fillStyle = pg;
    ctx.fillRect(px, 0, 34, gy);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    for (let y = 120; y < gy; y += 340) ctx.fillRect(px - 6, y, 46, 14);
  }
  // caja eléctrica y cajas apiladas
  ctx.fillStyle = "#0a1418";
  ctx.fillRect(40, 1150, 200, 330);
  ctx.strokeStyle = "rgba(255,140,60,0.18)";
  ctx.strokeRect(40, 1150, 200, 330);
  for (const [bx, by, bw, bh] of [
    [820, 1250, 190, 230],
    [1010, 1310, 150, 170],
    [850, 1120, 140, 130],
  ]) {
    ctx.fillStyle = "#0c1519";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = `rgba(255,120,40,${0.35 * I})`;
    ctx.fillRect(bx, by, bw, 5);
  }
  // letrero
  glow(ctx, 860, 520, 700, PAL.neon, 0.22 * I);
  neonSign(ctx, 770, 160, 190, 540, I);
  ctx.restore();

  // suelo mojado
  const fg = ctx.createLinearGradient(0, gy, 0, H);
  fg.addColorStop(0, "#14262d");
  fg.addColorStop(0.2, "#091216");
  fg.addColorStop(1, "#040708");
  ctx.fillStyle = fg;
  ctx.fillRect(0, gy, W, H - gy);
  reflection(ctx, f, { x: 865 + sx, y: gy + 4, w: 190, len: 430, color: PAL.neon, alpha: 0.75 * I, seed: 2, step: 7 });
  reflection(ctx, f, { x: 140 + sx * 0.5, y: gy + 4, w: 80, len: 200, color: "#3f6f7c", alpha: 0.35, seed: 9 });

  // personaje
  const x = 300 + f * 4.4;
  const s = 520;
  const p = 0.1 + f / 26;
  rainLayers(ctx, f + 30, 0.8, 2);
  ctx.save();
  ctx.filter = "blur(5px)";
  mirrored(ctx, gy, 0.16, () => sideWalker(ctx, x, gy, s, p, I));
  ctx.restore();
  sideWalker(ctx, x, gy, s, p, I);
  // salpicaduras en cada paso (local 4, 17, 30)
  for (const sf of [4, 17, 30]) {
    const tt = f - sf;
    if (tt < 0 || tt > 8) continue;
    const r2 = rng(sf * 17);
    const fx = x + 0.3 * s * (sf === 17 ? 0.9 : 1);
    ctx.save();
    ctx.lineCap = "round";
    for (let k = 0; k < 22; k++) {
      const a = -Math.PI * (0.15 + 0.7 * r2());
      const v = 9 + r2() * 14;
      const px = fx + Math.cos(a) * v * tt;
      const py = gy + Math.sin(a) * v * tt + 1.6 * tt * tt;
      if (py > gy + 10) continue;
      ctx.strokeStyle = r2() < 0.3 ? `rgba(255,160,90,${0.7 * (1 - tt / 8)})` : `rgba(210,230,236,${0.75 * (1 - tt / 8)})`;
      ctx.lineWidth = 2 + r2() * 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - Math.cos(a) * v * 0.7, py - (Math.sin(a) * v + 3.2 * tt) * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
  groundSplashes(ctx, f + 30, { seed: 8, count: 70, y0: gy + 10, y1: H, size: 30, alpha: 0.55 });
  ctx.restore();
  rainFront(ctx, f + 30, 1, 2);
  // brillo naranja de la lluvia junto al letrero
  ctx.save();
  ctx.beginPath();
  ctx.rect(560 + sx, 0, 600, 1100);
  ctx.clip();
  rain(ctx, f + 30, { seed: 77, count: 90, len: 90, speed: 110, width: 1.6, alpha: 0, color: `rgba(255,160,90,${0.35 * I})` });
  ctx.restore();
};

// ───────────────────────── C · Zapato en el charco ─────────────────────────
export const shotC = (ctx: Ctx, f: number, n: number) => {
  const contact = 6;
  const T = Math.max(0, (f - contact) * 0.7); // cámara lenta tras el impacto
  const shake = f >= contact ? Math.sin(T * 2.6) * 8 * Math.exp(-T * 0.35) : 0;
  const gyLine = 1080;
  const cy = 1360; // apoyo de la suela
  const I = flicker(f + 63, 2);
  ctx.save();
  cam(ctx, lerp(1.05, 1.0, f / n), 540, 1250, 0, shake);
  // fondo con bokeh de neón y ventanas
  const bg = ctx.createLinearGradient(0, 0, 0, gyLine);
  bg.addColorStop(0, "#04080a");
  bg.addColorStop(1, "#0d1c22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const rb = rng(31);
  const bokeh: { x: number; y: number; r: number; c: string; a: number }[] = [];
  for (let i = 0; i < 18; i++) {
    bokeh.push({ x: rb() * W + f * 1.2, y: 620 + rb() * 480, r: 26 + rb() * 80, c: rb() < 0.72 ? PAL.neon : "#5aa0b0", a: 0.22 + rb() * 0.35 });
  }
  bokeh.forEach((b) => {
    glow(ctx, b.x, b.y, b.r * 1.7, b.c, b.a * (b.c === PAL.neon ? I : 1));
    ctx.strokeStyle = mix(b.c, b.c, 0, b.a * 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  });
  // agua: horizonte claro y reflejos alargados del bokeh
  const fg = ctx.createLinearGradient(0, gyLine, 0, H);
  fg.addColorStop(0, "#1a3640");
  fg.addColorStop(0.12, "#08121a");
  fg.addColorStop(1, "#020405");
  ctx.fillStyle = fg;
  ctx.fillRect(0, gyLine, W, H - gyLine);
  bokeh.forEach((b, i) =>
    reflection(ctx, f + 63, { x: b.x, y: gyLine + (b.y - 620) * 0.25, w: b.r * 1.4, len: 640, color: b.c, alpha: b.a, seed: i * 2.7, step: 8 }),
  );
  groundSplashes(ctx, f + 63, { seed: 21, count: 70, y0: gyLine + 20, y1: H, size: 44, alpha: 0.55 });

  // la otra pierna, desenfocada al fondo (derecha)
  ctx.save();
  ctx.filter = "blur(10px)";
  ctx.fillStyle = "#0a0809";
  ctx.beginPath();
  curve(ctx, [[860, -40], [1040, -40], [1010, 1000], [930, 1060], [840, 1000]], true, 0.3);
  ctx.fill();
  ctx.fillStyle = "#050405";
  ctx.beginPath();
  ctx.ellipse(940, 1070, 150, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // faldón de la gabardina (arriba), ondeando
  const wv = (k: number) => Math.sin(f * 0.35 + k) * 12;
  const hem: Pt[] = [
    [180, -60],
    [1140, -60],
    [1140, 280],
    [1000, 360 + wv(0)],
    [840, 330],
    [700, 400 + wv(1)],
    [520, 350],
    [360, 420 + wv(2)],
    [180, 330],
  ];
  const hg = ctx.createLinearGradient(180, 0, 1140, 0);
  hg.addColorStop(0, "#1a0a06");
  hg.addColorStop(0.6, PAL.coat);
  hg.addColorStop(1, "#4d2316");
  rimFill(ctx, () => curve(ctx, hem, true, 0.3), hg, mix(PAL.coat, PAL.rim, I), 0, -9);
  ctx.strokeStyle = "rgba(8,3,1,0.6)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (const [x0, x1] of [[420, 360], [610, 700], [880, 840]]) {
    ctx.moveTo(x0, 0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 20, 200, x1, 360);
  }
  ctx.stroke();

  // pie que baja: inclinado (punta arriba) hasta el contacto
  const down = f < contact ? 1 - easeIn(f / contact) : 0;
  const sx = 560;
  const sy = cy - 320 * down;
  const tilt = -0.22 * down;
  // pernera con quiebre sobre el zapato
  const ankle: Pt = [sx + 90, sy - 170];
  ctx.fillStyle = "#0e0c0e";
  ctx.beginPath();
  curve(ctx, [[430, 300], [700, 300], [ankle[0] + 150, ankle[1] - 40], [ankle[0] + 120, ankle[1] + 20], [ankle[0] - 120, ankle[1] + 30], [ankle[0] - 150, ankle[1] - 30]], true, 0.25);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,150,80,${0.35 * I})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(690, 320);
  ctx.quadraticCurveTo(ankle[0] + 160, (320 + ankle[1]) / 2, ankle[0] + 140, ankle[1] - 30);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (const k of [0, 1, 2]) {
    const yy = ankle[1] - 60 - k * 70;
    ctx.moveTo(ankle[0] - 120 + k * 10, yy);
    ctx.quadraticCurveTo(ankle[0], yy + 30, ankle[0] + 120 - k * 10, yy - 6);
  }
  ctx.stroke();

  // zapato oxford de charol, 3/4 con la punta hacia la cámara-izquierda
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(tilt);
  const shoe: Pt[] = [
    [330, -10],
    [345, -150],
    [250, -205],
    [120, -215],
    [-40, -175],
    [-200, -125],
    [-320, -75],
    [-370, -20],
    [-340, 10],
    [-120, 22],
    [150, 18],
  ];
  // reflejo del zapato en el agua
  ctx.save();
  ctx.globalAlpha = down > 0 ? 0.3 : 0.16;
  ctx.translate(0, 30 + 2 * 320 * down);
  ctx.scale(1, -0.85);
  ctx.fillStyle = "#1b1214";
  ctx.beginPath();
  curve(ctx, shoe, true, 0.35);
  ctx.fill();
  ctx.restore();
  rimFill(ctx, () => curve(ctx, shoe, true, 0.35), "#07080a", mix("#07080a", PAL.rim, I), 8, 7);
  // suela y tacón
  ctx.fillStyle = "#1d1412";
  ctx.beginPath();
  curve(ctx, [[-360, -8], [-120, 14], [150, 12], [335, -6], [335, 18], [150, 34], [-120, 36], [-350, 14]], true, 0.3);
  ctx.fill();
  // pala y cordones
  ctx.strokeStyle = "rgba(40,40,46,0.9)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-60, -170);
  ctx.quadraticCurveTo(40, -150, 120, -205);
  ctx.stroke();
  ctx.strokeStyle = "rgba(10,10,12,1)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    ctx.moveTo(20 + k * 30, -200 + k * 6);
    ctx.lineTo(70 + k * 30, -168 + k * 6);
  }
  ctx.stroke();
  // puntera (costura) y brillos especulares
  ctx.strokeStyle = "rgba(30,30,36,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-250, -105);
  ctx.quadraticCurveTo(-200, -60, -235, -12);
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(240,244,248,0.85)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-330, -60);
  ctx.quadraticCurveTo(-230, -135, -60, -165);
  ctx.stroke();
  ctx.strokeStyle = "rgba(240,244,248,0.5)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(200, -195);
  ctx.quadraticCurveTo(300, -170, 330, -120);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,160,90,${0.75 * I})`;
  ctx.beginPath();
  ctx.ellipse(-250, -80, 55, 15, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,150,80,${0.9 * I})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-360, -14);
  ctx.quadraticCurveTo(-120, 4, 320, -12);
  ctx.stroke();
  ctx.restore();

  // salpicadura
  if (f >= contact) {
    const r = rng(99);
    const cx0 = sx - 80;
    ctx.save();
    ctx.lineCap = "round";
    // neblina del impacto
    glow(ctx, cx0, cy - 60, 260 + T * 30, "#cfe6ee", clamp(0.35 - T * 0.03));
    // ondas
    for (let k = 0; k < 4; k++) {
      const tt = T - k * 2.2;
      if (tt <= 0) continue;
      const rx = 200 + tt * 60;
      ctx.strokeStyle = `rgba(190,220,230,${clamp(0.6 - tt * 0.045)})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(cx0, cy + 18, rx, rx * 0.13, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // corona de agua
    for (let k = 0; k < 46; k++) {
      const a = (k / 46) * Math.PI * 2;
      const rx = 260 + T * 30;
      const lift = Math.sin(Math.min(Math.PI, T / 5.5)) * (80 + 90 * hash(k));
      const px = cx0 + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * rx * 0.13 - lift;
      if (Math.sin(a) < 0 && px > sx - 370 && px < sx + 330) continue; // detrás del zapato
      ctx.fillStyle = `rgba(218,236,242,${clamp(0.9 - T * 0.06)})`;
      ctx.beginPath();
      ctx.ellipse(px, py, 5 + 4 * hash(k + 9), 12 + 10 * hash(k + 3), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // gotas proyectadas
    for (let k = 0; k < 170; k++) {
      const a = -Math.PI * (0.05 + 0.9 * r());
      const v = 12 + r() * 36;
      const ox = cx0 + (r() - 0.5) * 640;
      const orange = r() < 0.3;
      const w = 2 + r() * 6;
      const vx = Math.cos(a) * v;
      const vy = Math.sin(a) * v;
      const px = ox + vx * T;
      const py = cy + vy * T + 1.15 * T * T;
      if (py > cy + 50) continue;
      const al = clamp(1 - T / 14);
      ctx.strokeStyle = orange ? `rgba(255,150,70,${al})` : `rgba(222,238,244,${al})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - vx * 0.65, py - (vy + 2.3 * T) * 0.65);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  rainLayers(ctx, f + 63, 0.7, 3);
  rainFront(ctx, f + 63, 1.2, 3);
};

// ───────────────────────── D · Espalda frente al neón ─────────────────────────
export const shotD = (ctx: Ctx, f: number, n: number) => {
  const I = flicker(f + 84, 7);
  ctx.save();
  cam(ctx, lerp(1.0, 1.06, easeOut(f / n)), 540, 950);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#09141a");
  bg.addColorStop(1, "#060c0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // edificios lejanos con ventanas
  const r = rng(54);
  for (let b = 0; b < 4; b++) {
    const bx = -40 + b * 170;
    const top = 120 + r() * 300;
    ctx.fillStyle = mix("#0d1b21", "#1a323c", r() * 0.5);
    ctx.fillRect(bx, top, 160, H);
    for (let wy = top + 40; wy < 1500; wy += 95) {
      for (let wx = bx + 18; wx < bx + 140; wx += 52) {
        const lit = r() < 0.3 ? 0.55 + r() * 0.4 : 0;
        windowGlow(ctx, [[wx, wy], [wx + 30, wy], [wx + 30, wy + 46], [wx, wy + 46]], lit, wx * 3 + wy);
      }
    }
  }
  haze(ctx, 300, 1400, 0.22);
  // muro derecho con el letrero
  ctx.fillStyle = "#0b161b";
  ctx.fillRect(560, 0, 520, H);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(560, 0, 14, H);
  // cables
  ctx.strokeStyle = "#020405";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(-20, 160 + k * 40);
    ctx.quadraticCurveTo(300, 300 + k * 40, 620, 190 + k * 30);
  }
  ctx.stroke();
  glow(ctx, 760, 640, 820, PAL.neon, 0.32 * I);
  neonSign(ctx, 640, 300, 250, 680, I);
  rainLayers(ctx, f + 84, 0.9, 4);
  // lluvia encendida por el neón
  ctx.save();
  ctx.beginPath();
  ctx.rect(440, 100, 640, 1200);
  ctx.clip();
  rain(ctx, f + 84, { seed: 88, count: 140, len: 80, speed: 100, width: 1.8, alpha: 0, color: `rgba(255,160,90,${0.45 * I})` });
  ctx.restore();
  // personaje de espaldas
  const sway = 0.006 * Math.sin(f * 0.25);
  standingFigure(ctx, 360, 3300, 2600, { back: true, rimL: 0.12, rimR: 0.95 * I, sway });
  ctx.restore();
  rainFront(ctx, f + 84, 1.1, 4);
};

// ───────────────────────── E · Mirada bajo el ala ─────────────────────────
export const shotE = (ctx: Ctx, f: number, n: number) => {
  const glint = clamp(1 - Math.abs(f - 6) / 6);
  ctx.save();
  cam(ctx, lerp(1.0, 1.08, easeOut(f / n)), 470, 940);
  ctx.fillStyle = "#050708";
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1180, 760, 900, PAL.neon, 0.5);

  // cara
  const face: Pt[] = [
    [260, 560],
    [220, 880],
    [300, 1240],
    [470, 1520],
    [560, 1580],
    [720, 1420],
    [860, 1140],
    [910, 820],
    [880, 560],
  ];
  const fgd = ctx.createLinearGradient(220, 0, 910, 0);
  fgd.addColorStop(0, "#0b0605");
  fgd.addColorStop(0.55, "#2a150e");
  fgd.addColorStop(1, "#5a2c1a");
  rimFill(ctx, () => curve(ctx, face, true, 0.45), fgd, PAL.rim, -16, 0);
  // sombra del ala sobre la frente
  const sh = ctx.createLinearGradient(0, 560, 0, 1000);
  sh.addColorStop(0, "rgba(0,0,0,0.85)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.beginPath();
  curve(ctx, face, true, 0.45);
  ctx.clip();
  ctx.fillStyle = sh;
  ctx.fillRect(0, 500, W, 520);
  ctx.restore();
  // nariz y boca
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(585, 1020);
  ctx.quadraticCurveTo(620, 1150, 600, 1215);
  ctx.moveTo(560, 1380);
  ctx.lineTo(650, 1368);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,140,70,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(606, 1060);
  ctx.quadraticCurveTo(632, 1150, 612, 1205);
  ctx.stroke();
  // ojo
  ctx.fillStyle = "#120806";
  ctx.beginPath();
  ctx.ellipse(470, 935, 70, 26, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a0f06";
  ctx.beginPath();
  ctx.arc(478, 936, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020101";
  ctx.beginPath();
  ctx.arc(480, 936, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#020202";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(380, 935);
  ctx.quadraticCurveTo(450, 885, 560, 915);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(410, 958);
  ctx.quadraticCurveTo(470, 975, 540, 950);
  ctx.stroke();
  // destello en la pupila
  glow(ctx, 490, 928, 60 + 140 * glint, PAL.neon, 0.55 + 0.45 * glint);
  ctx.fillStyle = mix("#ff9a40", "#fff2dd", glint);
  ctx.beginPath();
  ctx.arc(490, 928, 7 + 3 * glint, 0, Math.PI * 2);
  ctx.fill();
  if (glint > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const lg = ctx.createLinearGradient(490 - 260 * glint, 0, 490 + 260 * glint, 0);
    lg.addColorStop(0, "rgba(255,150,60,0)");
    lg.addColorStop(0.5, `rgba(255,190,120,${0.8 * glint})`);
    lg.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(490 - 260 * glint, 925, 520 * glint, 6);
    ctx.restore();
  }
  // mechones de pelo
  const hr = rng(5);
  ctx.fillStyle = "#040405";
  for (let i = 0; i < 14; i++) {
    const bx = 200 + i * 52 + hr() * 20;
    const tip: Pt = [bx + (hr() - 0.6) * 90, 760 + hr() * 230 + (i > 3 && i < 7 ? 60 : 0)];
    ctx.beginPath();
    ctx.moveTo(bx - 40, 600);
    ctx.quadraticCurveTo(bx - 10, (600 + tip[1]) / 2, tip[0], tip[1]);
    ctx.quadraticCurveTo(bx + 20, (600 + tip[1]) / 2, bx + 50, 600);
    ctx.closePath();
    ctx.fill();
  }
  // ala del sombrero
  const brim: Pt[] = [
    [-100, -100],
    [1180, -100],
    [1180, 720],
    [900, 700],
    [600, 640],
    [300, 610],
    [-100, 640],
  ];
  const bgd = ctx.createLinearGradient(0, 0, 0, 720);
  bgd.addColorStop(0, "#0e1012");
  bgd.addColorStop(0.75, "#16191b");
  bgd.addColorStop(1, "#060707");
  rimFill(ctx, () => curve(ctx, brim, true, 0.3), bgd, PAL.rim, -12, -8);
  ctx.strokeStyle = "rgba(160,190,200,0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-50, 560);
  ctx.quadraticCurveTo(500, 520, 1100, 640);
  ctx.stroke();
  // gotas colgando del ala; una cae por la mejilla
  for (const [i, gx] of [
    [0, 330],
    [1, 690],
    [2, 905],
  ] as const) {
    const by = i === 0 ? 615 : i === 1 ? 655 : 712;
    const grow = clamp((f + i * 4) / 12);
    const falling = i === 1 && f > 9;
    const dy = falling ? easeIn((f - 9) / 9) * 700 : 0;
    const r2 = 7 + 9 * grow;
    ctx.fillStyle = "rgba(170,205,215,0.55)";
    ctx.beginPath();
    ctx.ellipse(gx, by + r2 + dy, r2 * 0.75, r2 * (falling ? 1.6 : 1.1), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,230,210,0.9)";
    ctx.beginPath();
    ctx.arc(gx - r2 * 0.25, by + r2 * 0.7 + dy, r2 * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  // regueros de agua en la mejilla
  ctx.strokeStyle = "rgba(170,200,210,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(380, 980);
  ctx.quadraticCurveTo(372, 1080, 392, 1180 + f * 4);
  ctx.stroke();
  // cuello de la gabardina
  rimFill(ctx, () => curve(ctx, [[-100, 1500], [380, 1620], [560, 2020], [-100, 2020]], true, 0.3), "#0f0705", PAL.rim, 10, 0);
  rimFill(ctx, () => curve(ctx, [[700, 1480], [1180, 1250], [1180, 2020], [620, 2020]], true, 0.3), PAL.coatShade, PAL.rim, 14, 0);
  ctx.restore();
  rain(ctx, f + 105, { seed: 61, count: 26, len: 360, speed: 260, width: 7, alpha: 0.09 });
  rain(ctx, f + 105, { seed: 62, count: 60, len: 140, speed: 160, width: 2, alpha: 0.18 });
};

// ───────────────────────── F · Relámpago ─────────────────────────
export const flashAt = (g: number) => {
  const bump = (c: number, dur: number, a: number) => (g >= c ? a * Math.exp(-(g - c) / dur) : 0);
  return clamp(bump(131, 1.6, 1) + bump(133, 1.2, 0.55) + bump(136, 2.2, 0.85));
};

export const shotF = (ctx: Ctx, f: number, n: number) => {
  const g = f + 124;
  const L = flashAt(g);
  const shake = L > 0.5 ? (hash(g) - 0.5) * 10 : 0;
  ctx.save();
  cam(ctx, lerp(1.0, 1.05, easeOut(f / n)), 540, 1100, shake, 0);
  const o = {
    cam: { vx: 540, vy: 1120, fl: 1000, eye: 1.55 },
    seed: 19,
    half: 1.75,
    zNear: 1.0,
    zFar: 46,
    sky: [mix("#121e26", "#6f8ea8", L), mix("#24404c", "#b8d0ea", L)] as [string, string],
    skyFlash: L,
    litProb: 0.16,
    f: g,
    // rayo en la franja de cielo: se dibuja antes que las fachadas
    afterSky: () => lightning(ctx, g < 134 ? 11 : 12, [640, -20], [560, 760], L),
  };
  const { P } = drawAlley(ctx, o);
  // ventana con silueta (pared izquierda)
  const X = -o.half;
  const wq = [P(X, 6.4, 6), P(X, 7.6, 6), P(X, 7.6, 6.9), P(X, 6.4, 6.9)];
  windowGlow(ctx, wq, 1, 3);
  const wc: Pt = [(wq[0][0] + wq[2][0]) / 2, (wq[0][1] + wq[1][1]) / 2];
  ctx.fillStyle = "#1a0a04";
  ctx.beginPath();
  ctx.arc(wc[0], wc[1] - 18, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(wc[0] - 26, wc[1] - 4, 52, 70);
  // letrero
  const I = flicker(g, 9);
  const st = P(o.half - 0.42, 6.2, 7);
  const sb = P(o.half - 0.42 + 0.55, 3.6, 7);
  reflection(ctx, g, { x: (st[0] + sb[0]) / 2, y: P(0, 0, 7)[1], w: (sb[0] - st[0]) * 1.3, len: 400, color: PAL.neon, alpha: 0.6 * I, seed: 6, step: 6 });
  neonSign(ctx, st[0], st[1], sb[0] - st[0], sb[1] - st[1], I);
  poles(ctx, o, [
    { side: 1, z: 5.5 },
    { side: -1, z: 10 },
    { side: 1, z: 16 },
    { side: -1, z: 24 },
  ]);
  // contenedor
  const d0 = P(-1.7, 0, 3.0);
  const d1 = P(-0.95, 1.15, 3.0);
  const d2 = P(-0.95, 1.15, 4.4);
  ctx.fillStyle = "#070d10";
  ctx.beginPath();
  ctx.moveTo(d1[0], d0[1]);
  ctx.lineTo(d1[0], d1[1]);
  ctx.lineTo(d2[0], d2[1]);
  ctx.lineTo(d2[0], proj(o.cam, -0.95, 0, 4.4)[1]);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b1418";
  ctx.fillRect(d0[0], d1[1], d1[0] - d0[0], d0[1] - d1[1]);
  ctx.fillStyle = `rgba(200,220,255,${0.6 * L})`;
  ctx.fillRect(d0[0], d1[1] - 4, d1[0] - d0[0], 6);
  // personaje de espaldas
  const z = 4.2;
  const feet = P(0.15, 0, z);
  const hpx = (1.85 * o.cam.fl) / z;
  glow(ctx, feet[0], feet[1] - hpx * 0.6, hpx * 0.9, "#9fc4ff", 0.5 * L);
  mirrored(ctx, feet[1], 0.28, () => standingFigure(ctx, feet[0], feet[1], hpx, { back: true, rimL: 0.35 + L, rimR: 0.55 + L * 0.5 }));
  standingFigure(ctx, feet[0], feet[1], hpx, { back: true, rimL: 0.35 + L * 0.6, rimR: 0.55 + L * 0.4, sway: 0.01 * Math.sin(g * 0.3) });
  groundSplashes(ctx, g, { seed: 44, count: 110, y0: 1200, y1: H, size: 26, alpha: 0.5 + 0.3 * L });
  haze(ctx, 500, 1300, 0.12 + 0.25 * L);
  ctx.restore();
  rainLayers(ctx, g, 1.2, 6);
  rainFront(ctx, g, 1.1, 6);
  // destello general
  if (L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(170,200,255,${0.32 * L})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // fundido final a negro
  const out = clamp((f - (n - 7)) / 7);
  if (out > 0) {
    ctx.fillStyle = `rgba(0,0,0,${out})`;
    ctx.fillRect(0, 0, W, H);
  }
};
