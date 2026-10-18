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
  return { knee, ankle, sa, th, toeLift };
};

// Capa de sombra propia (cel shading): se recorta a la forma y se pinta una zona más oscura
const celShadow = (ctx: Ctx, clipPath: () => void, shadePath: () => void, color: string) => {
  ctx.save();
  ctx.beginPath();
  clipPath();
  ctx.clip();
  ctx.beginPath();
  shadePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

/**
 * Personaje caminando de perfil (mirando a la derecha): gabardina larga con solapas,
 * cinturón con el extremo suelto, faldón que ondea, manos en los bolsillos, fedora.
 * x, gy: posición en pantalla (gy = suelo). s: píxeles por metro (altura ≈ 1,85 m). p: fase del paso 0..1.
 * rim: intensidad de la luz del neón por delante (lado derecho).
 */
export const sideWalker = (ctx: Ctx, x: number, gy: number, s: number, p: number, rim = 1) => {
  const A = leg(p);
  const B = leg(p + 0.5);
  const footH = 0.07;
  const hipY = -Math.max(A.ankle[1], B.ankle[1]) - footH;
  const P = (u: Pt): Pt => [x + u[0] * s, gy + (hipY + u[1]) * s];
  const rimC = mix(PAL.coatShade, PAL.rim, rim);
  const rimW = 0.012 * s * rim;

  const drawLeg = (L: ReturnType<typeof leg>, cloth: string, lit: number) => {
    const hip = P([0.02, 0]);
    const k = P(L.knee);
    const a = P(L.ankle);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // pantalón con un ligero acampanado
    const legPath = () => {
      const n1: Pt = [-Math.cos(L.th), Math.sin(L.th)];
      const sa = L.sa;
      const n2: Pt = [-Math.cos(sa), Math.sin(sa)];
      const w1 = 0.085 * s;
      const w2 = 0.065 * s;
      const w3 = 0.06 * s;
      ctx.moveTo(hip[0] + n1[0] * w1, hip[1] + n1[1] * w1);
      ctx.lineTo(k[0] + n1[0] * w2, k[1] + n1[1] * w2);
      ctx.lineTo(a[0] + n2[0] * w3, a[1] + n2[1] * w3 - 0.02 * s);
      ctx.lineTo(a[0] - n2[0] * w3, a[1] - n2[1] * w3 - 0.02 * s);
      ctx.lineTo(k[0] - n1[0] * w2, k[1] - n1[1] * w2);
      ctx.lineTo(hip[0] - n1[0] * w1, hip[1] - n1[1] * w1);
      ctx.closePath();
    };
    rimFill(ctx, legPath, cloth, mix(cloth, PAL.rim, 0.55 * lit), -rimW * 0.7);
    // raya del pantalón
    ctx.strokeStyle = `rgba(255,150,90,${0.12 * lit})`;
    ctx.lineWidth = 0.006 * s;
    ctx.beginPath();
    ctx.moveTo(k[0], k[1]);
    ctx.lineTo(a[0], a[1] - 0.03 * s);
    ctx.stroke();
    // zapato de charol
    ctx.translate(a[0], a[1]);
    ctx.rotate(-L.toeLift);
    const shoe = () =>
      curve(ctx, [
        [-0.08 * s, -0.05 * s],
        [0.04 * s, -0.07 * s],
        [0.2 * s, -0.03 * s],
        [0.25 * s, 0.03 * s],
        [0.22 * s, 0.065 * s],
        [-0.09 * s, 0.065 * s],
      ]);
    rimFill(ctx, shoe, PAL.black, mix(PAL.black, PAL.rim, 0.9 * lit), -rimW * 0.6);
    ctx.strokeStyle = `rgba(255,190,140,${0.55 * lit})`;
    ctx.lineWidth = 0.009 * s;
    ctx.beginPath();
    ctx.moveTo(0.05 * s, -0.06 * s);
    ctx.quadraticCurveTo(0.17 * s, -0.045 * s, 0.225 * s, 0.0);
    ctx.stroke();
    ctx.fillStyle = "#1a1210";
    ctx.fillRect(-0.09 * s, 0.05 * s, 0.31 * s, 0.015 * s);
    ctx.restore();
  };

  const back = A.knee[0] < B.knee[0] ? A : B;
  const front = back === A ? B : A;
  drawLeg(back, "#070608", 0.25);

  // --- gabardina
  const fk = front.knee[0];
  const bk = back.knee[0];
  const flut = 0.03 * Math.sin(TAU * p * 2 + 1.2);
  const hem = 0.66; // largo: media pantorrilla
  const coat: Pt[] = [
    [-0.07, -0.69], // cuello alzado detrás
    [-0.16, -0.6],
    [-0.2, -0.45],
    [-0.19, -0.22],
    [-0.17, -0.03],
    [bk - 0.22 + flut, hem - 0.06],
    [bk - 0.18 + flut * 1.5, hem + 0.02],
    [(bk + fk) / 2 - 0.02, hem + 0.01],
    [fk + 0.06, hem - 0.03 - flut],
    [fk + 0.12, hem - 0.08],
    [fk + 0.07, 0.3],
    [0.16, 0.02],
    [0.19, -0.2],
    [0.2, -0.4],
    [0.17, -0.55],
    [0.13, -0.66],
    [0.07, -0.72], // punta del cuello delante
  ];
  const coatPx = coat.map(P);
  drawLeg(front, PAL.legs, 1);
  const cg = ctx.createLinearGradient(x - 0.22 * s, 0, x + 0.22 * s, 0);
  cg.addColorStop(0, "#1c0b07");
  cg.addColorStop(0.55, PAL.coat);
  cg.addColorStop(1, "#4a2216");
  rimFill(ctx, () => curve(ctx, coatPx, true, 0.32), cg, rimC, -rimW);
  // sombra propia: espalda y bajo el brazo
  celShadow(
    ctx,
    () => curve(ctx, coatPx, true, 0.32),
    () => curve(ctx, [P([-0.25, -0.75]), P([-0.02, -0.5]), P([0.02, 0.05]), P([bk - 0.05, hem + 0.1]), P([bk - 0.4, hem + 0.1])], true, 0.3),
    "rgba(12,4,2,0.55)",
  );
  // pliegues tirados por la pierna delantera
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(10,3,1,0.6)";
  ctx.lineWidth = 0.012 * s;
  ctx.beginPath();
  for (const [u0, v0, u1, v1] of [
    [0.04, 0.05, fk + 0.02, hem - 0.05],
    [-0.04, 0.08, (bk + fk) / 2 - 0.05, hem - 0.02],
    [-0.12, 0.05, bk - 0.12 + flut, hem - 0.04],
  ]) {
    const a = P([u0, v0]);
    const b = P([u1, v1]);
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo((a[0] + b[0]) / 2 + 0.03 * s, (a[1] + b[1]) / 2, b[0], b[1]);
  }
  ctx.stroke();
  // borde delantero del abrigo (cruce)
  ctx.strokeStyle = `rgba(255,140,70,${0.35 * rim})`;
  ctx.lineWidth = 0.007 * s;
  ctx.beginPath();
  const e0 = P([0.15, -0.55]);
  const e1 = P([0.12, 0.05]);
  const e2 = P([fk + 0.09, hem - 0.07]);
  ctx.moveTo(e0[0], e0[1]);
  ctx.quadraticCurveTo(e1[0] + 0.02 * s, e1[1], e2[0], e2[1]);
  ctx.stroke();
  ctx.restore();

  // cinturón con hebilla y extremo suelto que se balancea
  const b1 = P([-0.19, -0.06]);
  const b2 = P([0.18, -0.03]);
  ctx.save();
  ctx.strokeStyle = "#160806";
  ctx.lineWidth = 0.04 * s;
  ctx.beginPath();
  ctx.moveTo(b1[0], b1[1]);
  ctx.lineTo(b2[0], b2[1]);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,150,80,${0.4 * rim})`;
  ctx.lineWidth = 0.004 * s;
  ctx.beginPath();
  ctx.moveTo(b1[0], b1[1] - 0.02 * s);
  ctx.lineTo(b2[0], b2[1] - 0.02 * s);
  ctx.stroke();
  const tail0 = P([0.04, -0.04]);
  const sway = Math.sin(TAU * p + 0.6) * 0.06;
  const tail1 = P([0.02 + sway, 0.2]);
  ctx.strokeStyle = "#1a0907";
  ctx.lineWidth = 0.032 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tail0[0], tail0[1]);
  ctx.quadraticCurveTo(tail0[0] + sway * 0.5 * s, (tail0[1] + tail1[1]) / 2, tail1[0], tail1[1]);
  ctx.stroke();
  ctx.fillStyle = "#3a2a20";
  ctx.fillRect(tail0[0] - 0.03 * s, tail0[1] - 0.025 * s, 0.05 * s, 0.045 * s);
  ctx.restore();

  // brazo: manga hasta el bolsillo
  const sw = 0.018 * Math.sin(TAU * p);
  const arm = (
    [
      [-0.09, -0.6],
      [0.06, -0.6],
      [0.12 + sw, -0.3],
      [0.15 + sw, -0.02],
      [0.14 + sw, 0.12],
      [0.02 + sw, 0.13],
      [-0.03, -0.1],
      [-0.08, -0.35],
    ] as Pt[]
  ).map(P);
  rimFill(ctx, () => curve(ctx, arm, true, 0.35), "#2a120c", rimC, -rimW * 0.8);
  celShadow(ctx, () => curve(ctx, arm, true, 0.35), () => curve(ctx, [P([-0.2, -0.6]), P([0.0, -0.6]), P([0.04, 0.2]), P([-0.2, 0.2])], true, 0.2), "rgba(8,3,1,0.5)");
  // boca del bolsillo + puño
  ctx.strokeStyle = "rgba(6,2,1,0.8)";
  ctx.lineWidth = 0.01 * s;
  ctx.beginPath();
  const pk0 = P([0.02 + sw, 0.11]);
  const pk1 = P([0.15 + sw, 0.1]);
  ctx.moveTo(pk0[0], pk0[1]);
  ctx.lineTo(pk1[0], pk1[1]);
  ctx.stroke();

  // solapa y cuello alzado
  const lapel = ([[0.02, -0.72], [0.15, -0.66], [0.17, -0.52], [0.08, -0.5], [0.05, -0.62]] as Pt[]).map(P);
  rimFill(ctx, () => curve(ctx, lapel, true, 0.3), "#33170f", rimC, -rimW * 0.8);
  const collar = ([[-0.1, -0.66], [-0.08, -0.8], [0.02, -0.79], [0.05, -0.7], [-0.02, -0.64]] as Pt[]).map(P);
  rimFill(ctx, () => curve(ctx, collar, true, 0.3), "#1e0c08", rimC, -rimW * 0.6);

  // cabeza de perfil: mandíbula, nariz y barbilla que reciben la luz
  const face = ([[-0.03, -0.9], [0.06, -0.9], [0.1, -0.84], [0.125, -0.8], [0.11, -0.78], [0.115, -0.74], [0.09, -0.7], [0.03, -0.68], [-0.04, -0.74]] as Pt[]).map(P);
  rimFill(ctx, () => curve(ctx, face, true, 0.4), "#150b08", mix("#150b08", "#ff9a55", rim), -0.008 * s * rim);
  hatSide(ctx, P([0.03, -0.9]), s, rim);
};

const hatSide = (ctx: Ctx, c: Pt, s: number, rim: number) => {
  const rimC = mix(PAL.hat, PAL.rim, rim);
  const crown: Pt[] = [
    [c[0] - 0.105 * s, c[1] + 0.005 * s],
    [c[0] - 0.1 * s, c[1] - 0.1 * s],
    [c[0] - 0.06 * s, c[1] - 0.135 * s],
    [c[0] + 0.01 * s, c[1] - 0.115 * s], // pellizco
    [c[0] + 0.06 * s, c[1] - 0.13 * s],
    [c[0] + 0.1 * s, c[1] - 0.1 * s],
    [c[0] + 0.11 * s, c[1] + 0.005 * s],
  ];
  rimFill(ctx, () => curve(ctx, crown, true, 0.3), PAL.hat, rimC, -0.008 * s * rim);
  ctx.fillStyle = "#2a130d";
  ctx.fillRect(c[0] - 0.103 * s, c[1] - 0.03 * s, 0.208 * s, 0.026 * s);
  // ala: baja por delante
  const brim: Pt[] = [
    [c[0] - 0.19 * s, c[1] - 0.005 * s],
    [c[0] - 0.05 * s, c[1] - 0.02 * s],
    [c[0] + 0.12 * s, c[1] - 0.005 * s],
    [c[0] + 0.23 * s, c[1] + 0.045 * s],
    [c[0] + 0.12 * s, c[1] + 0.03 * s],
    [c[0] - 0.05 * s, c[1] + 0.02 * s],
  ];
  rimFill(ctx, () => curve(ctx, brim, true, 0.45), PAL.hat, rimC, -0.007 * s * rim, 0.004 * s);
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
