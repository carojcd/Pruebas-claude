import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Bubbles, Letters, Sky, Wave } from './fx';
import { C, HeartDrop } from './Icons';
import { OUTRO } from './timeline';

export const Outro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 2, fps, config: { damping: 8, stiffness: 110 } });
  const beat = 1 + 0.045 * Math.sin(Math.max(0, f - 20) / 5) * Math.min(1, (f - 20) / 20);
  const fadeEnd = interpolate(f, [OUTRO - 12, OUTRO], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <Sky>
      <Bubbles count={30} seed={9} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fadeEnd }}>
        <div style={{ position: 'absolute', top: 300, transform: `scale(${pop * beat}) rotate(${(1 - pop) * 20}deg)`, filter: 'drop-shadow(0 26px 40px rgba(30,136,229,.45))' }}><HeartDrop size={380} /></div>
        <div style={{ position: 'absolute', top: 760 }}><Letters text="¡El lavado de" delay={12} size={120} /></div>
        <div style={{ position: 'absolute', top: 905 }}><Letters text="manos salva" delay={26} size={120} /></div>
        <div style={{ position: 'absolute', top: 1050 }}><Letters text="vidas!" delay={42} size={190} color={C.blue} shadow="0 8px 0 rgba(255,255,255,.75)" /></div>
        <div style={{ position: 'absolute', top: 1320 }}><Wave delay={70} /></div>
      </AbsoluteFill>
    </Sky>
  );
};
