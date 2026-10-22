import { FPS, START } from './timeline';

export type Clip = 'p1' | 'p2' | 'p3';
export type Card = { clip: Clip; kind: 'momento' | 'paso'; n: number; total: number; icon: string; text: string; f0: number; f1: number };

const MOMENTOS: [string, string][] = [
  ['bed', 'Antes de tocar al paciente.'],
  ['syringe', 'Antes de realizar una tarea limpia o aséptica.'],
  ['fluid', 'Después del riesgo de exposición a líquidos corporales.'],
  ['person', 'Después de tocar al paciente.'],
  ['monitor', 'Después del contacto con el entorno del paciente.'],
];
const PASOS: [string, string][] = [
  ['faucet', 'Mojar las manos con agua.'],
  ['soap', 'Aplicar jabón suficiente.'],
  ['hands', 'Frotar palmas entre sí para generar espuma.'],
  ['back', 'Frotar la palma de una mano contra el dorso de la otra.'],
  ['interlace', 'Frotar palmas entre sí con los dedos entrelazados.'],
  ['padlock', 'Frotar el dorso de los dedos ("candadito").'],
  ['thumb', 'Frotar los pulgares con movimientos de rotación.'],
  ['fingertips', 'Frotar las puntas de los dedos contra las palmas.'],
  ['rinse', 'Enjuagar las manos con abundante agua.'],
  ['towel', 'Secar con una toalla desechable.'],
  ['towelfaucet', 'Usar la misma toalla para cerrar el grifo (y abrir la puerta si es necesario).'],
  ['bin', 'Desechar la toalla en la caneca roja.'],
];

// Segundos de inicio de cada tarjeta, RELATIVOS a cada clip, y fin de la última.
// p1: la instructora señala el cartel · p2: gestos y pausas de la explicación · p3: una ráfaga de voz por paso.
// Para ajustar un tiempo basta cambiar el número correspondiente.
const T = {
  p1: { starts: [3.9, 7.3, 10.6, 13.9, 16.9], end: 19.3 },
  p2: { starts: [1.2, 5.5, 9.5, 14.4, 19.5, 26.0, 33.7, 37.1, 40.2, 45.6, 47.6, 54.8], end: 58.0 },
  p3: { starts: [0.7, 3.5, 6.4, 10.2, 14.0, 17.6, 24.0, 30.0, 32.7, 41.3, 48.3, 53.6], end: 56.2 },
};
const build = (clip: Clip, kind: 'momento' | 'paso', list: [string, string][]): Card[] => {
  const { starts, end } = T[clip];
  return list.map(([icon, text], i) => {
    const a = starts[i], b = i + 1 < starts.length ? starts[i + 1] : end;
    return { clip, kind, n: i + 1, total: list.length, icon, text, f0: START[clip] + Math.round(a * FPS), f1: START[clip] + Math.round(b * FPS) };
  });
};
export const CARDS: Card[] = [...build('p1', 'momento', MOMENTOS), ...build('p2', 'paso', PASOS), ...build('p3', 'paso', PASOS)];
export const SECTIONS: { clip: Clip; label: string }[] = [
  { clip: 'p1', label: 'LOS 5 MOMENTOS DE LA HIGIENE DE MANOS' },
  { clip: 'p2', label: 'TÉCNICA DE LAVADO DE MANOS' },
  { clip: 'p3', label: 'TÉCNICA DE LAVADO DE MANOS' },
];
