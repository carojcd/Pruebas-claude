import { START, FPS } from './timeline';

export type IconName = 'drop' | 'soap' | 'hands' | 'faucet' | 'clock' | 'towel';
export type Step = { clip: 'p1' | 'p2' | 'p3'; from: number; to: number; icon: IconName; n?: number; title: string; sub?: string };

// Tiempos en segundos RELATIVOS al clip (p1/p2/p3 ya recortados).
// PROVISIONAL: textos y tiempos deducidos solo de lo que se ve. Se reemplazan con la transcripción del audio.
export const STEPS: Step[] = [
  { clip: 'p3', from: 34.4, to: 37.0, icon: 'soap', title: 'Aplicar jabón', sub: 'Sobre las manos mojadas' },
  { clip: 'p3', from: 37.2, to: 50.0, icon: 'faucet', title: 'Enjuagar con agua', sub: 'Bajo el chorro, sin tocar el grifo' },
];
export const stepFrames = STEPS.map((s) => ({ ...s, f0: START[s.clip] + Math.round(s.from * FPS), f1: START[s.clip] + Math.round(s.to * FPS) }));
