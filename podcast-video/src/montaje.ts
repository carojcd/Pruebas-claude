// Decisiones de montaje (ver estilo-podcast.md). Datos calculados por scripts/plan.py; tiempos en fotogramas a 30 fps.
import edit from "./data/edit.json";
import faceJson from "./data/face.json";
import planJson from "./data/plan.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type ShotDef = { from: number; to: number; zoom: number };
export type BlockDef = {
  from: number;
  to: number;
  keyFrame: number;
  key: number;
  lines: number[][];
  text: string[][];
  emoji?: string;
};

export const PLAN = planJson as {
  durationInFrames: number;
  punchFrame: number;
  shots: ShotDef[];
  blocks: BlockDef[];
  emojiFrames: number[];
};
export const DURATION = PLAN.durationInFrames;
export const WORDS = edit.words;
export const wordFrame = (i: number) => Math.round((WORDS[i].startMs / 1000) * FPS);

// fotograma de salida → fotograma de origen (clip a 30 fps)
const SEGMENTS = edit.segments;
export const outToSrc = (f: number) => {
  let seg = SEGMENTS[0];
  for (const s of SEGMENTS) if (s.outStartFrame <= f) seg = s;
  return seg.srcStartFrame + (f - seg.outStartFrame);
};

// Zona segura de Reels/TikTok (estilo-podcast.md §3)
export const SAFE_TOP = 200;
export const SAFE_BOTTOM = 250;

// Seguimiento de la boca (fracción de la altura del original, por segundo de origen; face.json, medido por clip)
const FACE = faceJson as { zoomOriginX: number; zoomOriginY: number | null; mouth: number[][]; captionOffset: number };
const mouthAtSrc = (sec: number) => {
  const m = FACE.mouth;
  if (sec <= m[0][0]) return m[0][1];
  for (let i = 1; i < m.length; i++) {
    if (sec <= m[i][0]) return m[i - 1][1] + ((m[i][1] - m[i - 1][1]) * (sec - m[i - 1][0])) / (m[i][0] - m[i - 1][0]);
  }
  return m[m.length - 1][1];
};
const mouthAtOut = (f: number) => mouthAtSrc(outToSrc(f) / FPS);
// Origen del zoom: x sobre la cara; y fija o, si es null, a la altura de la boca (así el zoom no la baja)
export const zoomOrigin = (f: number) => ({ x: FACE.zoomOriginX, y: FACE.zoomOriginY ?? mouthAtOut(f) });
// Centro del bloque de subtítulos (px): 62 % de la altura o, si la boca baja, debajo de la barbilla; máx. 80 %
export const captionY = (f: number) => Math.round(HEIGHT * Math.min(0.8, Math.max(0.62, mouthAtOut(f) + FACE.captionOffset)));
