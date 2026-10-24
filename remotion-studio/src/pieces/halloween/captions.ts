// Subtítulos: SOLO el texto de la voz en off que entregó el cliente. Tiempos por palabra detectados en el audio (tools/syllables.py).
export type Word = { text: string; start: number; end: number; hot: boolean };
export type Chunk = { words: Word[]; start: number; end: number };

import WT from './wordtimes.json';
// Cuántas palabras lleva cada bloque de subtítulo (por grupo de frases), siguiendo el guion del cliente.
const SIZES: number[][] = [
  [2, 1, 3, 3],
  [2, 2, 2, 2, 2, 2, 3, 1, 2, 3, 4, 3],
  [3, 2, 2, 4],
];
// Palabras en naranja (resto en blanco)
const HOT = new Set(['halloween', 'vitto', 'santa', 'marta', 'octubre', 'productos', 'pasabocas', 'frescura', 'alegría', 'familias', 'creciendo', 'ti']);

export const CHUNKS: Chunk[] = (WT as { text: string; start: number; end: number }[][]).flatMap((g, gi) => {
  const words: Word[] = g.map((w) => ({ ...w, hot: HOT.has(w.text.toLowerCase().replace(/[¡!¿?.,]/g, '')) }));
  let k = 0;
  return SIZES[gi].map((n) => { const ws = words.slice(k, k + n); k += n; return { words: ws, start: ws[0].start, end: ws[ws.length - 1].end }; });
});
