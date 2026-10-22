import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './Icons';
import { H, W } from './timeline';

export const useFonts = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all([600, 700, 800].map((w) => new FontFace('Montserrat', `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load()))
      .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};
export const FONT = "'Montserrat', system-ui, sans-serif";

// Fondo claro azul con degradado suave
export const Sky: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1000px at ${50 + 6 * Math.sin(f / 60)}% ${30 + 4 * Math.cos(f / 70)}%, #F4FBFF 0%, #CDEBFD 45%, #8FD0FA 100%)` }}>
      {children}
    </AbsoluteFill>
  );
};

// Burbujas de jabón que suben (deterministas)
export const Bubbles: React.FC<{ count?: number; seed?: number; opacity?: number }> = ({ count = 26, seed = 1, opacity = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => random(`b${seed}-${i}-${k}`);
        const size = 24 + r(1) * 120, sp = 1.4 + r(2) * 2.6, span = H + size * 2;
        const y = H + size - ((f * sp + r(3) * span) % span);
        const x = r(4) * W + Math.sin(f / (26 + r(5) * 30) + r(6) * 6) * (14 + r(7) * 26);
        return (
          <div key={i} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
            background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0 9%, rgba(255,255,255,.28) 22%, rgba(150,210,250,.16) 62%, rgba(255,255,255,.55) 100%)',
            boxShadow: 'inset 0 0 14px rgba(255,255,255,.7), 0 0 18px rgba(80,160,230,.18)' }} />
        );
      })}
    </AbsoluteFill>
  );
};

// Texto animado letra por letra
export const Letters: React.FC<{ text: string; delay?: number; size: number; color?: string; weight?: number; gap?: number; stagger?: number; shadow?: string }> =
  ({ text, delay = 0, size, color = C.deep, weight = 800, stagger = 2, shadow }) => {
    const f = useCurrentFrame(); const { fps } = useVideoConfig();
    return (
      <div style={{ display: 'flex', justifyContent: 'center', whiteSpace: 'pre', font: `${weight} ${size}px ${FONT}`, color, letterSpacing: -1, textShadow: shadow }}>
        {[...text].map((ch, i) => {
          const p = spring({ frame: f - delay - i * stagger, fps, config: { damping: 13, stiffness: 140, mass: 0.7 } });
          const o = interpolate(f - delay - i * stagger, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * -9}deg) scale(${0.7 + 0.3 * p})`, filter: `blur(${(1 - Math.min(p, 1)) * 10}px)` }}>{ch}</span>;
        })}
      </div>
    );
  };

export const Words: React.FC<{ text: string; delay?: number; size: number; color?: string; weight?: number; stagger?: number; width?: number }> =
  ({ text, delay = 0, size, color = C.blue, weight = 700, stagger = 5, width = 900 }) => {
    const f = useCurrentFrame(); const { fps } = useVideoConfig();
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.3}px`, width, font: `${weight} ${size}px/1.3 ${FONT}`, color, textAlign: 'center' }}>
        {text.split(' ').map((w, i) => {
          const p = spring({ frame: f - delay - i * stagger, fps, config: { damping: 16, stiffness: 120 } });
          return <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 36}px)`, filter: `blur(${(1 - Math.min(p, 1)) * 8}px)` }}>{w}</span>;
        })}
      </div>
    );
  };

// Línea ondulada que se dibuja
export const Wave: React.FC<{ delay?: number; width?: number }> = ({ delay = 0, width = 760 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 26], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg width={width} height="46" viewBox="0 0 760 46">
      <path d="M6 24 C50 2 94 46 138 24 S226 2 270 24 S358 46 402 24 S490 2 534 24 S622 46 666 24 S730 10 754 24" fill="none" stroke={C.blue} strokeWidth="8" strokeLinecap="round"
        strokeDasharray="900" strokeDashoffset={900 * (1 - p)} />
    </svg>
  );
};

// Transición: velo azul claro con destello en cada corte
export const Dip: React.FC<{ at: number; half?: number }> = ({ at, half = 9 }) => {
  const f = useCurrentFrame(); const d = Math.abs(f - at);
  if (d > half) return null;
  const o = Math.pow(1 - d / half, 1.4);
  return <AbsoluteFill style={{ opacity: o, background: 'radial-gradient(900px 900px at 50% 50%, #FFFFFF 0%, #CDEBFD 55%, #6FBDF3 100%)' }} />;
};
