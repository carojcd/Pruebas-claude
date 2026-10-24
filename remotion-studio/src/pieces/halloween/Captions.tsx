import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHUNKS } from './captions';
import { CUTS } from './cuts';
// Planos de fondo (sin foto): ahí el subtítulo es el protagonista, grande y centrado
const BG_SHOTS = [0, 3, 6].map((i) => [CUTS[i], CUTS[i + 1]]);

const MONT = "'Montserrat', system-ui, sans-serif";
// Subtítulo dinámico: cada palabra salta al decirse; blanco / naranja; el bloque se cambia sin parpadeo.
export const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const i = CHUNKS.findIndex((c, k) => t >= c.start - 0.04 && t < (CHUNKS[k + 1]?.start ?? 99) - 0.04);
  if (i < 0) return null;
  const c = CHUNKS[i], nextStart = CHUNKS[i + 1]?.start ?? c.end + 0.4;
  const gap = nextStart - c.end > 0.5, hold = gap ? c.end + 0.35 : nextStart - 0.04, local = f - Math.round((c.start - 0.04) * fps);
  const inn = spring({ frame: local, fps, config: { damping: 14, stiffness: 190, mass: .6 } });
  const out = gap ? interpolate(t, [hold - 0.08, hold], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const bg = BG_SHOTS.some(([a, b]) => f >= a && f < b);
  const size = (c.words.length >= 4 ? 84 : c.words.length === 3 ? 96 : 112) * (bg ? 1.3 : 1);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: bg ? 'center' : 'flex-end', paddingBottom: bg ? 0 : 330, opacity: out }}>
      <div style={{ width: 980, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.26}px`, textAlign: 'center', transform: `translateY(${(1 - inn) * 40}px)` }}>
        {c.words.map((w, k) => {
          const p = spring({ frame: f - Math.round(w.start * fps), fps, config: { damping: 9, stiffness: 210, mass: .55 } });
          const on = t >= w.start - 0.02;
          return <span key={k} style={{ display: 'inline-block', font: `800 ${size}px/1.12 ${MONT}`, textTransform: 'uppercase', color: w.hot ? '#FF8A00' : '#fff', opacity: on ? 1 : 0,
            WebkitTextStroke: `${size * 0.11}px #120A1A`, paintOrder: 'stroke fill', textShadow: `0 ${size * .07}px 0 rgba(18,10,26,.9), 0 ${size * .12}px ${size * .25}px rgba(0,0,0,.55)`,
            transform: `scale(${on ? 0.82 + 0.18 * p + (p > 1 ? 0 : 0) : 0.6}) rotate(${(1 - Math.min(p, 1)) * (k % 2 ? 4 : -4)}deg)` }}>{w.text}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
