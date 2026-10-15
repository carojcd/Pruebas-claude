// Decisiones de montaje (ver estilo.md). Todos los tiempos en fotogramas de salida a 30 fps.
import edit from "./data/edit.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const BRAND = {
  turquesa: "#00F0BF",
  cyan: "#36C8F7",
  azul: "#3B82F6",
  morado: "#704DFF",
  azulOscuro: "#111827",
  grisClaro: "#F3F4F6",
  gradiente: "linear-gradient(90deg, #00F0BF 0%, #36C8F7 35%, #3B82F6 68%, #704DFF 100%)",
};

export type Word = { text: string; startMs: number; endMs: number };
export const WORDS: Word[] = edit.words;
export const wordFrame = (i: number) => Math.round((WORDS[i].startMs / 1000) * FPS);
export const wordEndFrame = (i: number) => Math.round((WORDS[i].endMs / 1000) * FPS);

// --- Tramos de origen que sobreviven al corte de silencios (> 0,3 s) ---
type Segment = { srcStartFrame: number; srcEndFrame: number; outStartFrame: number };
const SEGMENTS: Segment[] = edit.segments;
const TAIL = 14; // aire tras «la práctica.» antes del cierre
export const EDIT_END = edit.durationInFrames + TAIL;
export const END_CARD = 66; // 2,2 s de cierre con logotipo
export const DURATION = EDIT_END + END_CARD;

// fotograma de salida → fotograma de origen
export const outToSrc = (f: number) => {
  let seg = SEGMENTS[0];
  for (const s of SEGMENTS) if (s.outStartFrame <= f) seg = s;
  return seg.srcStartFrame + (f - seg.outStartFrame);
};

// --- Planos ---
// El original cambia de plano general a plano medio en el fotograma de origen 188 (6,27 s).
export type Framing = "general" | "medio";
export type ShotDef = {
  from: number;
  to: number;
  framing: Framing;
  zoom: number;
  dark?: boolean; // plano de énfasis (−38 % de luz)
};

const CAMERA_CUT_OUT = (() => {
  for (const s of SEGMENTS) {
    if (s.srcStartFrame <= 188 && 188 < s.srcEndFrame) return s.outStartFrame + 188 - s.srcStartFrame;
  }
  return 0;
})();

// Puntos de corte: los cortes de silencio + cambio de cámara + cortes editoriales
export const EMPHASIS_FROM = wordFrame(54) - 2; // «letra muerta»: 2 fot. antes de la palabra
export const GLITCH_AT = wordEndFrame(55) + 2;
export const CARD_DARK_FROM = wordFrame(65) - 1; // «eficacia simbólica»
export const CARD_LIGHT_FROM = wordFrame(67) - 1; // «pero no una eficacia real,»
export const CARD_TO = SEGMENTS[SEGMENTS.length - 1].outStartFrame; // vuelta al ponente: «la práctica.»
const EXTRA_CUT = wordFrame(43) - 2; // parte el plano largo (5,8 s) en «rápida»

const cutPoints = Array.from(
  new Set([
    ...SEGMENTS.map((s) => s.outStartFrame),
    CAMERA_CUT_OUT,
    EXTRA_CUT,
    EMPHASIS_FROM,
    GLITCH_AT,
  ]),
)
  .filter((f) => f >= 0 && f < EDIT_END)
  .sort((a, b) => a - b);

export const SHOTS: ShotDef[] = cutPoints.map((from, i) => {
  const to = cutPoints[i + 1] ?? EDIT_END;
  const framing: Framing = from < CAMERA_CUT_OUT ? "general" : "medio";
  const isLast = to === EDIT_END;
  const dark = from === EMPHASIS_FROM;
  // Jump cuts: se alterna 100 % / 108 % (general 100 / 112 %); énfasis 118 %; remate final 114 %
  let zoom = i % 2 === 0 ? 1 : framing === "general" ? 1.12 : 1.08;
  if (dark) zoom = 1.18;
  if (isLast) zoom = 1.14;
  return { from, to, framing, zoom, dark };
});

// --- Subtítulos ---
export type Block = {
  lines: number[][]; // índices de palabra por línea
  hl: number | null; // palabra destacada (DM Sans 800 + degradado)
  kind?: "normal" | "enfasis" | "tarjetaOscura" | "tarjetaClara";
};

export const BLOCKS: Block[] = [
  { lines: [[0, 1], [2, 3, 4], [5]], hl: 5 }, // Una norma / puede ser muy / virtuosa,
  { lines: [[6, 7], [8, 9], [10]], hl: 10 }, // puede estar / muy bien / redactada,
  { lines: [[11, 12], [13], [14, 15]], hl: 15 }, // puede tener / características / muy modernas,
  { lines: [[16], [17, 18]], hl: 18 }, // funcionar / muy bien
  { lines: [[19, 20, 21], [22, 23]], hl: 23 }, // en distintas partes / del mundo,
  { lines: [[24, 25, 26], [27]], hl: 27 }, // pero si no / encuentra
  { lines: [[28, 29], [30]], hl: 30 }, // una efectividad / real
  { lines: [[31, 32], [33]], hl: 33 }, // en la / práctica,
  { lines: [[34, 35, 36, 37], [38]], hl: 38 }, // si no encuentra una / infraestructura
  { lines: [[39], [40, 41], [42]], hl: 42 }, // institucional / que pueda / reaccionar
  { lines: [[43, 44], [45]], hl: 45 }, // rápida y / adecuadamente
  { lines: [[46, 47], [48]], hl: 48 }, // a esas / disposiciones,
  { lines: [[49, 50], [51, 52, 53]], hl: null }, // pues realmente / se convierte en
  { lines: [[54], [55]], hl: 55, kind: "enfasis" }, // letra / muerta
  { lines: [[56, 57, 58, 59]], hl: null }, // y a lo sumo
  { lines: [[60, 61], [62]], hl: 62 }, // será una / guía,
  { lines: [[63, 64]], hl: null }, // tendrá una
  { lines: [[65], [66]], hl: 66, kind: "tarjetaOscura" }, // eficacia / simbólica
  { lines: [[67, 68, 69], [70, 71]], hl: 71, kind: "tarjetaClara" }, // pero no una / eficacia real,
  { lines: [[72], [73]], hl: 73 }, // la / práctica.
];

const HOLD_AFTER = 18; // el bloque se mantiene 0,6 s tras su última palabra si no llega otro
export const blockWindow = (b: number) => {
  const lastLine = BLOCKS[b].lines[BLOCKS[b].lines.length - 1];
  const last = lastLine[lastLine.length - 1];
  const kind = BLOCKS[b].kind ?? "normal";
  // el bloque posterior al énfasis espera al glitch
  const startOf = (k: number) =>
    BLOCKS[k - 1]?.kind === "enfasis" ? Math.max(wordFrame(BLOCKS[k].lines[0][0]), GLITCH_AT) : wordFrame(BLOCKS[k].lines[0][0]);
  const from = startOf(b);
  const nextFrom = b + 1 < BLOCKS.length ? startOf(b + 1) : EDIT_END;
  let to = Math.min(nextFrom, Math.max(wordEndFrame(last) + HOLD_AFTER, from + 12), EDIT_END);
  if (kind === "enfasis") to = GLITCH_AT;
  if (kind === "tarjetaOscura") to = CARD_LIGHT_FROM;
  if (kind === "tarjetaClara") to = CARD_TO;
  return { from, to };
};
