import WT from './wordtimes.json';
// Subtítulos: solo el texto entregado por el cliente. Tiempos por palabra detectados en la voz (tools/align_words.py).
export const VO_START = 48;   // la voz empieza a 1.6 s (30 fps)
export type Word = { text: string; start: number; end: number; hot: boolean };
export type Chunk = { words: Word[]; start: number; end: number };
const SIZES = [[2, 1, 2, 2, 3, 3], [2, 1, 2, 2, 1, 2, 2], [2, 2]];
const HOT = new Set(['1.000', 'instagram!', 'familia.', 'calidad', 'sabor', 'más!']);
export const CHUNKS: Chunk[] = (WT as { text: string; start: number; end: number }[][]).flatMap((g, gi) => {
  const words: Word[] = g.map((w) => ({ ...w, start: w.start + VO_START / 30, end: w.end + VO_START / 30, hot: HOT.has(w.text.toLowerCase()) }));
  let k = 0;
  return SIZES[gi].map((n) => { const ws = words.slice(k, k + n); k += n; return { words: ws, start: ws[0].start, end: ws[ws.length - 1].end }; });
});
