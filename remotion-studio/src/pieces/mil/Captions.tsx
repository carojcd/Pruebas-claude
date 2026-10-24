import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHUNKS } from './captions';

const MONT = "'Montserrat', system-ui, sans-serif";
// Subtítulo dinámico: cada palabra salta cuando se dice; blanco / rojo de marca; "1.000" más grande. Posición: borde inferior al 35 % de la altura (672 px desde abajo).
export const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const i = CHUNKS.findIndex((c, k) => t >= c.start - 0.04 && t < (CHUNKS[k + 1]?.start ?? 99) - 0.04);
  if (i < 0) return null;
  const c = CHUNKS[i], nextStart = CHUNKS[i + 1]?.start ?? c.end + 0.5;
  const gap = nextStart - c.end > 0.5, hold = gap ? c.end + 0.4 : nextStart - 0.04, local = f - Math.round((c.start - 0.04) * fps);
  const inn = spring({ frame: local, fps, config: { damping: 14, stiffness: 190, mass: .6 } });
  const out = gap ? interpolate(t, [hold - 0.1, hold], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const hero = c.words.length === 1 && c.words[0].text === '1.000';
  const size = hero ? 150 : c.words.length >= 3 ? 62 : c.words.length === 2 ? 72 : 84;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 672, opacity: out }}>
      <div style={{ width: 980, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.24}px`, textAlign: 'center', transform: `translateY(${(1 - inn) * 40}px) scale(${hero ? 0.9 + 0.1 * inn : 1})` }}>
        {c.words.map((w, k) => {
          const p = spring({ frame: f - Math.round(w.start * fps), fps, config: { damping: 9, stiffness: 210, mass: .55 } });
          const on = t >= w.start - 0.02;
          return <span key={k} style={{ display: 'inline-block', font: `800 ${size}px/1.1 ${MONT}`, textTransform: 'uppercase', color: w.hot ? '#FF4D4D' : '#fff', opacity: on ? 1 : 0,
            WebkitTextStroke: `${size * 0.1}px #05070D`, paintOrder: 'stroke fill', textShadow: `0 ${size * .06}px 0 rgba(5,7,13,.9), 0 0 ${size * .3}px ${w.hot ? 'rgba(255,60,60,.65)' : 'rgba(80,200,255,.35)'}`,
            transform: `scale(${on ? 0.8 + 0.2 * p : 0.6}) rotate(${(1 - Math.min(p, 1)) * (k % 2 ? 3 : -3)}deg)` }}>{w.text}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
