import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { Dip, useFonts } from './fx';
import { Intro } from './Intro';
import { Outro } from './Outro';
import { StepCard } from './StepCard';
import { stepFrames } from './steps';
import { CUTS, INTRO, OUTRO, P1, P2, P3, START } from './timeline';

const Clip: React.FC<{ src: string; dur: number }> = ({ src, dur }) => (
  <OffthreadVideo src={staticFile(`lavado/${src}.mp4`)} volume={(f) => Math.min(1, f / 5, (dur - f) / 5)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
);

export const Lavado: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Sequence from={START.intro} durationInFrames={INTRO}><Intro /></Sequence>
      <Sequence from={START.p1} durationInFrames={P1}><Clip src="p1" dur={P1} /></Sequence>
      <Sequence from={START.p2} durationInFrames={P2}><Clip src="p2" dur={P2} /></Sequence>
      <Sequence from={START.p3} durationInFrames={P3}><Clip src="p3" dur={P3} /></Sequence>
      <Sequence from={START.outro} durationInFrames={OUTRO}><Outro /></Sequence>
      {stepFrames.map((s, i) => (
        <Sequence key={i} from={s.f0} durationInFrames={s.f1 - s.f0}><StepCard step={s} dur={s.f1 - s.f0} index={i} /></Sequence>
      ))}
      {CUTS.map((c) => <Dip key={c} at={c} />)}
      <Sequence from={0} durationInFrames={INTRO + 10}><Audio src={staticFile('lavado/sfx_intro.wav')} volume={0.9} /></Sequence>
      <Sequence from={START.outro - 4} durationInFrames={OUTRO + 4}><Audio src={staticFile('lavado/sfx_outro.wav')} volume={0.9} /></Sequence>
      {CUTS.slice(0, 3).map((c) => <Sequence key={c} from={c - 8} durationInFrames={30}><Audio src={staticFile('lavado/sfx_whoosh.wav')} volume={0.5} /></Sequence>)}
      {stepFrames.map((s, i) => <Sequence key={`p${i}`} from={s.f0} durationInFrames={30}><Audio src={staticFile('lavado/sfx_pop.wav')} volume={0.7} /></Sequence>)}
    </AbsoluteFill>
  );
};
