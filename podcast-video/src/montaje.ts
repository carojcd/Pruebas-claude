// Decisiones de montaje (ver estilo-podcast.md). Datos calculados por scripts/plan.py; tiempos en fotogramas a 30 fps.
import edit from "./data/edit.json";
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
export const CAPTION_Y = Math.round(HEIGHT * 0.62);
// Origen del zoom: sobre la cara del ponente
export const ZOOM_ORIGIN = { x: 0.5, y: 0.24 };
