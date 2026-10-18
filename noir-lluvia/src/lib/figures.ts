import { PAL } from "./fx";
import { clamp, Ctx, curve, mix, Pt, rimFill } from "./util";

const TAU = Math.PI * 2;

// --- Pierna (vista lateral, mirando a la derecha). q = fase de la pierna 0..1; q=0.25 → talón apoya delante
const leg = (q: number) => {
  const thigh = 0.46;
  const shin = 0.47;
  const th = 0.42 * Math.sin(TAU * q); // ángulo del muslo (+ adelante)
  const swing = Math.cos(TAU * (q + 0.04)); // > 0: la pierna avanza en el aire
  const bend = 0.08 + 0.95 * Math.pow(Math.max(0, swing), 1.6) * Math.max(0, 1 - Math.max(0, Math.sin(TAU * q)) * 0.9);
  const knee: Pt = [Math.sin(th) * thigh, Math.cos(th) * thigh];
  const sa = th - bend;
  const ankle: Pt = [knee[0] + Math.sin(sa) * shin, knee[1] + Math.cos(sa) * shin];
  const toeLift = Math.max(0, swing) * 0.25 - Math.max(0, -Math.sin(TAU * q)) * 0.1;
  return { knee, ankle, sa, toeLift };
};

/**
 * Personaje caminando de perfil (mirando a la derecha).
 * x, gy: posición en pantalla (gy = suelo). s: píxeles por metro (altura total ≈ 1,85 m). p: fase del paso 0..1.
 */
export const sideWalker = (ctx: Ctx, x: number, gy: number, s: number, p: number, rimW = 6) => {
  const A = leg(p);
  const B = leg(p + 0.5);
  const footH = 0.07;
  const hipY = -Math.max(A.ankle[1], B.ankle[1]) - footH; // la pierna de apoyo toca el suelo
  const P = (u: Pt): Pt => [x + u[0] * s, gy + (hipY + u[1]) * s];

  const drawLeg = (L: ReturnType<typeof leg>, shade: string) => {
    const hip = P([0, 0]);
    const k = P(L.knee);
    const a = P(L.ankle);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = shade;
    ctx.lineWidth = 0.15 * s;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.lineTo(k[0], k[1]);
    ctx.lineTo(a[0], a[1]);
    ctx.stroke();
    // zapato
    const ang = -L.toeLift;
    ctx.translate(a[0], a[1]);
    ctx.rotate(ang);
    ctx.beginPath();
    curve(ctx, [
      [-0.07 * s, -0.04 * s],
      [0.05 * s, -0.06 * s],
      [0.21 * s, -0.01 * s],
      [0.23 * s, 0.05 * s],
      [-0.08 * s, 0.06 * s],
    ]);
    ctx.fillStyle = PAL.black;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,150,80,0.55)";
    ctx.lineWidth = 0.008 * s;
    ctx.beginPath();
    ctx.moveTo(0.02 * s, -0.05 * s);
    ctx.quadraticCurveTo(0.16 * s, -0.04 * s, 0.215 * s, 0.01 * s);
    ctx.stroke();
    ctx.restore();
  };

  // pierna trasera primero
  const back = A.knee[0] < B.knee[0] ? A : B;
  const front = back === A ? B : A;
  drawLeg(back, "#08070a");

  // gabardina
  const frontKneeX = Math.max(A.knee[0], B.knee[0]);
  const backKneeX = Math.min(A.knee[0], B.knee[0]);
  const flut = 0.025 * Math.sin(TAU * p * 2 + 1);
  const coat: Pt[] = [
    [-0.06, -0.66], // cuello detrás
    [-0.17, -0.55],
    [-0.19, -0.3],
    [-0.17, -0.02],
    [backKneeX - 0.2 + flut, 0.5],
    [backKneeX - 0.1, 0.57],
    [(backKneeX + frontKneeX) / 2, 0.55],
    [frontKneeX + 0.1, 0.52 - flut],
    [frontKneeX + 0.06, 0.34],
    [0.15, 0.02],
    [0.18, -0.3],
    [0.16, -0.52],
    [0.11, -0.68], // solapa
  ];
  const coatPx = coat.map(P);
  drawLeg(front, PAL.legs);
  rimFill(
    ctx,
    () => curve(ctx, coatPx, true, 0.35),
    (() => {
      const g = ctx.createLinearGradient(x - 0.2 * s, 0, x + 0.2 * s, 0);
      g.addColorStop(0, PAL.coatShade);
      g.addColorStop(1, PAL.coat);
      return g;
    })(),
    PAL.rim,
    -rimW,
  );
  // pliegues y cinturón
  ctx.save();
  ctx.strokeStyle = "rgba(10,4,2,0.55)";
  ctx.lineWidth = 0.012 * s;
  ctx.beginPath();
  const b1 = P([-0.18, -0.05]);
  const b2 = P([0.16, -0.03]);
  ctx.moveTo(b1[0], b1[1]);
  ctx.lineTo(b2[0], b2[1]);
  const f1 = P([0.02, 0.02]);
  const f2 = P([(backKneeX + frontKneeX) / 2 + 0.02, 0.52]);
  ctx.moveTo(f1[0], f1[1]);
  ctx.quadraticCurveTo(f1[0] + 0.05 * s, (f1[1] + f2[1]) / 2, f2[0], f2[1]);
  ctx.stroke();
  ctx.restore();

  // brazo (mano en el bolsillo)
  const sw = 0.02 * Math.sin(TAU * p);
  const arm: Pt[] = [
    [-0.06, -0.55],
    [0.05, -0.56],
    [0.1 + sw, -0.2],
    [0.13 + sw, 0.05],
    [0.04 + sw, 0.06],
    [-0.04, -0.2],
  ].map((u) => P(u as Pt));
  rimFill(ctx, () => curve(ctx, arm, true, 0.4), mix(PAL.coatShade, PAL.coat, 0.6), PAL.rim, -rimW * 0.7);

  // cabeza (casi oculta) + sombrero
  const head = P([0.03, -0.75]);
  ctx.fillStyle = "#140c0a";
  ctx.beginPath();
  ctx.ellipse(head[0], head[1], 0.085 * s, 0.1 * s, 0, 0, TAU);
  ctx.fill();
  const chin = P([0.1, -0.69]);
  ctx.strokeStyle = "rgba(255,140,70,0.6)";
  ctx.lineWidth = 0.008 * s;
  ctx.beginPath();
  ctx.moveTo(chin[0], chin[1] - 0.06 * s);
  ctx.lineTo(chin[0], chin[1]);
  ctx.stroke();
  hatSide(ctx, P([0.03, -0.83]), s, rimW);
};

const hatSide = (ctx: Ctx, c: Pt, s: number, rimW: number) => {
  const brim: Pt[] = [
    [c[0] - 0.2 * s, c[1] + 0.012 * s],
    [c[0], c[1] - 0.02 * s],
    [c[0] + 0.21 * s, c[1] + 0.03 * s],
    [c[0], c[1] + 0.025 * s],
  ];
  const crown: Pt[] = [
    [c[0] - 0.11 * s, c[1]],
    [c[0] - 0.1 * s, c[1] - 0.12 * s],
    [c[0] - 0.02 * s, c[1] - 0.14 * s],
    [c[0] + 0.03 * s, c[1] - 0.12 * s],
    [c[0] + 0.1 * s, c[1] - 0.13 * s],
    [c[0] + 0.11 * s, c[1]],
  ];
  rimFill(ctx, () => curve(ctx, crown, true, 0.3), PAL.hat, PAL.rim, -rimW * 0.6);
  ctx.fillStyle = "#2a1410";
  ctx.fillRect(c[0] - 0.105 * s, c[1] - 0.03 * s, 0.21 * s, 0.025 * s);
  rimFill(ctx, () => curve(ctx, brim, true, 0.5), PAL.hat, PAL.rim, -rimW * 0.6);
};

// Relleno con borde de luz a ambos lados que sigue el contorno:
// la forma entera en color de luz y encima la misma forma estrechada (escala X) con el color base
const twoSideRim = (
  ctx: Ctx,
  path: () => void,
  cx: number,
  halfW: number,
  base: string | CanvasGradient,
  rimL: number,
  rimR: number,
  band: number,
) => {
  ctx.save();
  ctx.beginPath();
  path();
  ctx.clip();
  const rg = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
  rg.addColorStop(0, mix(PAL.coatShade, PAL.rim, rimL));
  rg.addColorStop(0.5, PAL.coatShade);
  rg.addColorStop(1, mix(PAL.coatShade, PAL.rim, rimR));
  ctx.fillStyle = rg;
  ctx.fillRect(cx - halfW * 2, -1e4, halfW * 4, 2e4);
  const k = Math.max(0.5, 1 - band / halfW);
  ctx.translate(cx, 0);
  ctx.scale(k, 1);
  ctx.translate(-cx, band * 0.4);
  ctx.beginPath();
  path();
  ctx.fillStyle = base;
  ctx.fill();
  ctx.restore();
};

/**
 * Silueta de frente/espaldas (simétrica). gy = suelo, h = altura total en px.
 * walk: fase del paso (o null para quieto). rimL/rimR: intensidad del borde de luz izquierdo/derecho.
 */
export const standingFigure = (
  ctx: Ctx,
  x: number,
  gy: number,
  h: number,
  o: { walk?: number | null; sway?: number; rimL?: number; rimR?: number; back?: boolean },
) => {
  const P = (u: number, v: number): Pt => [x + u * h, gy - v * h];
  const sway = o.sway ?? 0;
  const rimL = clamp(o.rimL ?? 0.3);
  const rimR = clamp(o.rimR ?? 0.8);
  const walk = o.walk ?? null;
  const band = Math.max(1.2, 0.011 * h);

  // piernas y zapatos
  for (const side of [-1, 1]) {
    const lift = walk === null ? 0 : Math.max(0, Math.sin(TAU * walk + (side > 0 ? Math.PI : 0))) * 0.03;
    const top = P(side * 0.045, 0.34);
    const bot = P(side * 0.052, lift);
    ctx.fillStyle = PAL.legs;
    ctx.beginPath();
    ctx.moveTo(top[0] - 0.036 * h, top[1]);
    ctx.lineTo(top[0] + 0.036 * h, top[1]);
    ctx.lineTo(bot[0] + 0.03 * h, bot[1] - 0.014 * h);
    ctx.lineTo(bot[0] - 0.03 * h, bot[1] - 0.014 * h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.black;
    ctx.beginPath();
    ctx.ellipse(bot[0], bot[1] - 0.01 * h, 0.038 * h, 0.014 * h, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(255,140,70,${0.5 * (side < 0 ? rimL : rimR)})`;
    ctx.fillRect(bot[0] + side * 0.02 * h, bot[1] - 0.02 * h, side * 0.016 * h, 0.006 * h);
  }

  // gabardina (hombros redondeados, cuello alzado, vuelo hasta media pierna)
  const coat: Pt[] = [
    P(-0.06, 0.875),
    P(-0.115, 0.83),
    P(-0.148, 0.795),
    P(-0.152, 0.7),
    P(-0.142, 0.56),
    P(-0.15 + sway * 0.4, 0.44),
    P(-0.168 + sway, 0.31),
    P(-0.06 + sway, 0.295),
    P(0.06 + sway, 0.295),
    P(0.168 + sway, 0.31),
    P(0.15 + sway * 0.4, 0.44),
    P(0.142, 0.56),
    P(0.152, 0.7),
    P(0.148, 0.795),
    P(0.115, 0.83),
    P(0.06, 0.875),
  ];
  const cg = ctx.createLinearGradient(x - 0.16 * h, 0, x + 0.16 * h, 0);
  cg.addColorStop(0, PAL.coatShade);
  cg.addColorStop(0.55, PAL.coat);
  cg.addColorStop(1, mix(PAL.coat, PAL.rim, rimR * 0.25));
  twoSideRim(ctx, () => curve(ctx, coat, true, 0.3), x, 0.16 * h, cg, rimL, rimR, band);

  // costuras: abertura trasera, cinturón, pliegues, canesú
  ctx.save();
  ctx.strokeStyle = "rgba(8,3,2,0.55)";
  ctx.lineWidth = Math.max(1, 0.005 * h);
  ctx.beginPath();
  const s1 = P(0, 0.56);
  const s2 = P(sway * 0.5, 0.3);
  ctx.moveTo(s1[0], s1[1]);
  ctx.lineTo(s2[0], s2[1]);
  const b1 = P(-0.143, 0.57);
  const b2 = P(0.143, 0.57);
  ctx.moveTo(b1[0], b1[1]);
  ctx.quadraticCurveTo(x, b1[1] + 0.012 * h, b2[0], b2[1]);
  for (const u of [-0.085, 0.075]) {
    const a = P(u, 0.54);
    const b = P(u * 1.35 + sway * 0.6, 0.31);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  if (o.back) {
    const y1 = P(-0.135, 0.755);
    const y2 = P(0.135, 0.755);
    ctx.moveTo(y1[0], y1[1]);
    ctx.quadraticCurveTo(x, y1[1] + 0.03 * h, y2[0], y2[1]);
  }
  ctx.stroke();
  ctx.restore();

  // nuca/cabeza entre el cuello y el ala
  const head = P(0, 0.9);
  ctx.fillStyle = "#0b0807";
  ctx.beginPath();
  ctx.ellipse(head[0], head[1], 0.046 * h, 0.052 * h, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(255,140,70,${0.6 * rimR})`;
  ctx.beginPath();
  ctx.ellipse(head[0] + 0.04 * h, head[1] + 0.01 * h, 0.006 * h, 0.03 * h, 0, 0, TAU);
  ctx.fill();
  // cuello alzado
  const collar: Pt[] = [P(-0.075, 0.83), P(-0.07, 0.895), P(-0.03, 0.88), P(0.03, 0.88), P(0.07, 0.895), P(0.075, 0.83)];
  twoSideRim(ctx, () => curve(ctx, collar, true, 0.4), x, 0.075 * h, PAL.coatShade, rimL, rimR, band * 0.7);

  // sombrero: ala ≈ 0,6 × hombros
  const bc = P(0, 0.938);
  const brimHalf = 0.092 * h;
  const crown: Pt[] = [P(-0.052, 0.94), P(-0.05, 0.99), P(-0.018, 1.0), P(0, 0.992), P(0.018, 1.0), P(0.05, 0.99), P(0.052, 0.94)];
  twoSideRim(ctx, () => curve(ctx, crown, true, 0.3), x, 0.052 * h, PAL.hat, rimL * 0.8, rimR * 0.8, band * 0.6);
  ctx.fillStyle = "#24110c";
  ctx.fillRect(x - 0.051 * h, bc[1] - 0.016 * h, 0.102 * h, 0.011 * h);
  twoSideRim(
    ctx,
    () => {
      ctx.ellipse(bc[0], bc[1], brimHalf, 0.016 * h, 0, 0, TAU);
    },
    x,
    brimHalf,
    PAL.hat,
    rimL * 0.8,
    rimR * 0.8,
    band * 0.6,
  );
};
