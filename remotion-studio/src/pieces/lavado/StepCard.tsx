import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from './fx';
import { C, Icon } from './Icons';
import { Step } from './steps';

// Tarjeta de paso: entra con resorte, el icono "salta", barra de progreso y salida suave.
export const StepCard: React.FC<{ step: Step; dur: number; index: number }> = ({ step, dur, index }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const inn = spring({ frame: f, fps, config: { damping: 14, stiffness: 130 } });
  const out = interpolate(f, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ic = spring({ frame: f - 7, fps, config: { damping: 8, stiffness: 150 } });
  const tx = spring({ frame: f - 10, fps, config: { damping: 18, stiffness: 120 } });
  const prog = interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 330, opacity: out * Math.min(1, inn * 1.5) }}>
      <div style={{ width: 960, height: 210, borderRadius: 44, position: 'relative', overflow: 'hidden', transform: `translateY(${(1 - inn) * 90 + (1 - out) * 30}px) scale(${0.94 + 0.06 * inn})`,
        background: 'rgba(255,255,255,.93)', boxShadow: '0 22px 60px rgba(7,50,99,.35), inset 0 0 0 2px rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 34, padding: '0 40px' }}>
        <div style={{ width: 138, height: 138, borderRadius: 38, flex: 'none', background: `linear-gradient(155deg, ${C.mid}, ${C.blue})`, display: 'grid', placeItems: 'center',
          transform: `scale(${ic}) rotate(${(1 - ic) * -18}deg)`, boxShadow: '0 12px 26px rgba(30,136,229,.45)' }}><Icon name={step.icon} size={92} /></div>
        <div style={{ transform: `translateX(${(1 - tx) * 50}px)`, opacity: Math.min(1, tx * 1.3) }}>
          <div style={{ font: `700 26px ${FONT}`, letterSpacing: 5, color: C.mid }}>PASO {step.n ?? index + 1}</div>
          <div style={{ font: `800 52px/1.1 ${FONT}`, color: C.deep, marginTop: 4 }}>{step.title}</div>
          {step.sub && <div style={{ font: `600 29px/1.2 ${FONT}`, color: '#4C6F96', marginTop: 8 }}>{step.sub}</div>}
        </div>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 9, width: `${prog * 100}%`, background: `linear-gradient(90deg, ${C.sky}, ${C.blue})` }} />
      </div>
    </AbsoluteFill>
  );
};
