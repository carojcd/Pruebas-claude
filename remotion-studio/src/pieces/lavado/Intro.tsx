import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Bubbles, Letters, Sky, Wave, Words, FONT } from './fx';
import { C, Icon } from './Icons';
import { INTRO } from './timeline';

export const Intro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 4, fps, config: { damping: 9, stiffness: 120 } });
  const out = interpolate(f, [INTRO - 14, INTRO], [1, 0], { extrapolateLeft: 'clamp' });
  const scaleOut = 1 + 0.06 * (1 - out);
  return (
    <Sky>
      <Bubbles count={30} seed={3} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: out, transform: `scale(${scaleOut})` }}>
        <div style={{ position: 'absolute', top: 330, width: 230, height: 230, borderRadius: '50%', background: `linear-gradient(160deg, ${C.mid}, ${C.blue})`,
          transform: `scale(${pop}) rotate(${(1 - pop) * -25}deg)`, boxShadow: '0 24px 60px rgba(30,136,229,.4), inset 0 6px 14px rgba(255,255,255,.4)', display: 'grid', placeItems: 'center' }}>
          <Icon name="hands" size={150} />
        </div>
        <div style={{ position: 'absolute', top: 640 }}><Letters text="Higiene" delay={14} size={176} shadow="0 6px 0 rgba(255,255,255,.7)" /></div>
        <div style={{ position: 'absolute', top: 830 }}><Letters text="de manos" delay={30} size={176} color={C.blue} shadow="0 6px 0 rgba(255,255,255,.7)" /></div>
        <div style={{ position: 'absolute', top: 1060 }}><Wave delay={52} /></div>
        <div style={{ position: 'absolute', top: 1160 }}><Words text="Seguridad del paciente, un compromiso de todos" delay={66} size={58} color={C.deep} /></div>
        <div style={{ position: 'absolute', bottom: 150, font: `700 34px ${FONT}`, letterSpacing: 8, color: C.mid, opacity: interpolate(f, [100, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>PASO A PASO</div>
      </AbsoluteFill>
    </Sky>
  );
};
