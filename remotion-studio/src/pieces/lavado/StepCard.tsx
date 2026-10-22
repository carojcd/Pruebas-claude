import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from './fx';
import { C, Icon } from './Icons';
import { Card } from './steps';

// Tarjeta: entra con resorte, el icono "salta", el texto se desliza y hay puntos de avance (1..N).
export const StepCard: React.FC<{ card: Card; dur: number }> = ({ card, dur }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const inn = spring({ frame: f, fps, config: { damping: 15, stiffness: 140 } });
  const out = interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ic = spring({ frame: f - 6, fps, config: { damping: 8, stiffness: 150 } });
  const tx = spring({ frame: f - 9, fps, config: { damping: 18, stiffness: 120 } });
  const prog = interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp' });
  const label = card.kind === 'momento' ? 'MOMENTO' : 'PASO';
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300, opacity: out * Math.min(1, inn * 1.5) }}>
      <div style={{ width: 980, minHeight: 200, borderRadius: 44, position: 'relative', overflow: 'hidden', transform: `translateY(${(1 - inn) * 90 + (1 - out) * 24}px) scale(${0.95 + 0.05 * inn})`,
        background: 'rgba(255,255,255,.94)', boxShadow: '0 22px 60px rgba(7,50,99,.38), inset 0 0 0 2px rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 32, padding: '30px 38px 36px' }}>
        <div style={{ width: 136, height: 136, borderRadius: 38, flex: 'none', background: `linear-gradient(155deg, ${C.mid}, ${C.blue})`, display: 'grid', placeItems: 'center',
          transform: `scale(${ic}) rotate(${(1 - ic) * -18}deg)`, boxShadow: '0 12px 26px rgba(30,136,229,.45)' }}><Icon name={card.icon} size={90} /></div>
        <div style={{ flex: 1, transform: `translateX(${(1 - tx) * 50}px)`, opacity: Math.min(1, tx * 1.3) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ font: `800 30px ${FONT}`, letterSpacing: 5, color: C.mid }}>{label} {card.n}</div>
            <div style={{ display: 'flex', gap: 7 }}>{Array.from({ length: card.total }, (_, i) => (
              <div key={i} style={{ width: i + 1 === card.n ? 26 : 11, height: 11, borderRadius: 6, background: i + 1 <= card.n ? C.blue : '#C9E3F8' }} />))}</div>
          </div>
          <div style={{ font: `700 ${card.text.length > 60 ? 38 : 43}px/1.22 ${FONT}`, color: C.deep, marginTop: 8 }}>{card.text}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 9, width: `${prog * 100}%`, background: `linear-gradient(90deg, ${C.sky}, ${C.blue})` }} />
      </div>
    </AbsoluteFill>
  );
};

// Etiqueta de sección arriba, con entrada suave
export const SectionTag: React.FC<{ label: string; dur: number }> = ({ label, dur }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f - 6, fps, config: { damping: 16, stiffness: 120 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 78, opacity: Math.min(1, p) * out }}>
      <div style={{ transform: `translateY(${(1 - p) * -30}px)`, background: 'rgba(11,60,117,.88)', color: '#fff', font: `700 26px ${FONT}`, letterSpacing: 4, padding: '16px 34px', borderRadius: 40,
        boxShadow: '0 10px 30px rgba(7,50,99,.4)' }}>{label}</div>
    </AbsoluteFill>
  );
};
