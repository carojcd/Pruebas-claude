import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion';

const OR = '#FF7A00', YL = '#FFC21A', PU = '#6B2FA0', BK = '#120A1A';

// ---------- piezas de dibujo
export const Pumpkin: React.FC<{ x: number; y: number; s: number; rot?: number; glow?: number; color?: string }> = ({ x, y, s, rot = 0, glow = 1, color = OR }) => (
  <svg width={220 * s} height={200 * s} viewBox="0 0 220 200" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, overflow: 'visible', filter: `drop-shadow(0 0 ${30 * glow}px rgba(255,150,30,.65))` }}>
    <rect x="98" y="6" width="26" height="40" rx="8" fill="#3C7A1E" transform="rotate(8 110 26)" />
    <ellipse cx="62" cy="112" rx="56" ry="82" fill="#E66A00" /><ellipse cx="158" cy="112" rx="56" ry="82" fill="#E66A00" />
    <ellipse cx="110" cy="112" rx="62" ry="88" fill={color} /><ellipse cx="110" cy="112" rx="30" ry="88" fill="#FF9420" opacity=".55" />
    <path d="M62 92 L86 112 L50 116Z M158 92 L134 112 L170 116Z" fill={BK} /><path d="M96 130 L110 112 L124 130Z" fill={BK} />
    <path d="M50 138 Q70 176 110 160 Q150 176 170 138 L150 146 L136 134 L122 150 L110 138 L98 150 L84 134 L70 146Z" fill={BK} />
    <path d="M62 94 L82 110 L56 114Z M158 94 L138 110 L164 114Z M104 130 L110 120 L116 130Z" fill="#FFD84A" opacity={.9 * glow} />
  </svg>
);
export const Ghost: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <svg width={150 * s} height={190 * s} viewBox="0 0 150 190" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 0 28px rgba(190,160,255,.8))' }}>
    <path d="M10 180 V70 C10 30 40 6 75 6 C110 6 140 30 140 70 V180 L118 158 L96 182 L75 158 L54 182 L32 158Z" fill="#fff" opacity=".93" />
    <ellipse cx="55" cy="72" rx="11" ry="16" fill={BK} /><ellipse cx="95" cy="72" rx="11" ry="16" fill={BK} /><ellipse cx="75" cy="112" rx="13" ry="18" fill={BK} />
  </svg>
);
export const Web: React.FC<{ corner: 'tl' | 'tr'; size?: number; op?: number }> = ({ corner, size = 700, op = .55 }) => {
  const rays = Array.from({ length: 7 }, (_, i) => (i / 6) * (Math.PI / 2));
  const rings = [.22, .42, .64, .86];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, [corner === 'tl' ? 'left' : 'right']: 0, transform: corner === 'tr' ? 'scaleX(-1)' : undefined, opacity: op }}>
      <g stroke="#fff" strokeWidth=".45" fill="none">
        {rays.map((a, i) => <line key={i} x1="0" y1="0" x2={Math.cos(a) * 110} y2={Math.sin(a) * 110} />)}
        {rings.map((r, i) => <path key={i} d={rays.map((a, k) => `${k ? 'Q' : 'M'}${Math.cos(a) * r * 100 * (k ? .93 : 1)},${Math.sin(a) * r * 100 * (k ? .93 : 1)} ${Math.cos(a) * r * 100},${Math.sin(a) * r * 100}`).join(' ')} />)}
      </g>
    </svg>
  );
};
export const Fog: React.FC<{ y: number; tint?: string; seed?: string; op?: number }> = ({ y, tint = '#B79CFF', seed = 'f', op = .35 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ top: y, height: 700, overflow: 'visible' }}>{Array.from({ length: 5 }, (_, i) => {
    const r = (k: number) => random(`${seed}${i}${k}`), x = ((f * (0.5 + r(1)) + r(2) * 1500) % 1700) - 350;
    return <div key={i} style={{ position: 'absolute', left: x, top: r(3) * 380, width: 800, height: 280, borderRadius: '50%', background: `radial-gradient(closest-side, ${tint}, transparent)`, opacity: op, filter: 'blur(30px)' }} />;
  })}</AbsoluteFill>;
};
export const Stars: React.FC<{ n?: number }> = ({ n = 70 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill>{Array.from({ length: n }, (_, i) => { const r = (k: number) => random(`st${i}${k}`);
    return <div key={i} style={{ position: 'absolute', left: r(1) * 1080, top: r(2) * 1100, width: 3 + r(3) * 5, height: 3 + r(3) * 5, borderRadius: '50%', background: '#fff', opacity: .35 + .65 * Math.abs(Math.sin(f / (12 + r(4) * 20) + r(5) * 6)) }} />; })}</AbsoluteFill>;
};
const Flyer: React.FC<{ seed: string; n?: number }> = ({ seed, n = 4 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill>{Array.from({ length: n }, (_, i) => { const r = (k: number) => random(`${seed}${i}${k}`), p = ((f / 70) * (0.7 + r(1) * .6) + r(2)) % 1.3, flap = Math.abs(Math.sin(f / 1.5 + i * 2)), s = .6 + r(3) * .7;
    return <svg key={i} width={140 * s} height={70 * s} viewBox="0 0 140 70" style={{ position: 'absolute', left: -200 + p * 1500, top: 200 + r(4) * 700 + Math.sin(f / 7 + i) * 40 - p * 140 }}>
      <g fill={BK} transform={`translate(70 36) scale(1 ${.55 + .45 * flap}) translate(-70 -36)`}><path d="M70 18 C60 4 40 8 8 14 C22 22 22 36 30 44 C40 36 50 40 56 52 C62 44 66 36 70 36 C74 36 78 44 84 52 C90 40 100 36 110 44 C118 36 118 22 132 14 C100 8 80 4 70 18Z" /></g>
      <circle cx="64" cy="26" r="2.4" fill="#FFD84A" /><circle cx="76" cy="26" r="2.4" fill="#FFD84A" /></svg>; })}</AbsoluteFill>;
};
const useEnter = () => { const f = useCurrentFrame(); return { f, scale: interpolate(f, [0, 9], [1.12, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }) }; };

// ---------- Fondo A: noche embrujada con luna y calabazas
export const BgNight: React.FC<{ dur: number }> = ({ dur }) => {
  const { f, scale } = useEnter();
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0B0620 0%, #2A0F4D 48%, #8A2E1B 82%, #FF7A00 100%)', overflow: 'hidden', transform: `scale(${scale})` }}>
      <Stars />
      <div style={{ position: 'absolute', left: 540 - 300, top: 330 - Math.min(f, 40) * .6, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #FFF8D0, #FFE48A 60%, #F2C14E)', boxShadow: '0 0 160px 60px rgba(255,220,120,.45)', transform: `scale(${1 + .03 * (f / dur)})` }}>
        {[[70, 90, 70], [380, 160, 52], [250, 380, 90], [440, 400, 40]].map(([x, y, r], i) => <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: 'rgba(210,170,70,.35)' }} />)}
      </div>
      <Flyer seed="n" n={5} />
      <Fog y={1020} tint="#C9A8FF" seed="fa" op={.3} />
      <svg width="1080" height="420" viewBox="0 0 1080 420" style={{ position: 'absolute', bottom: 0, left: 0 }}><path d="M0 420 V250 C120 210 200 260 320 230 C460 190 560 270 700 236 C840 200 960 250 1080 220 V420Z" fill="#0A0414" /></svg>
      <Pumpkin x={90} y={1560 - Math.sin(f / 10) * 6} s={1.25} rot={-6} /><Pumpkin x={430} y={1620} s={1.7} rot={3} /><Pumpkin x={800} y={1570 + Math.sin(f / 9) * 6} s={1.15} rot={8} />
    </AbsoluteFill>
  );
};
// ---------- Fondo B: telarañas moradas, fantasmas y arañas
export const BgWeb: React.FC<{ dur: number }> = ({ dur }) => {
  const { f, scale } = useEnter();
  const sp = (x: number, len: number, ph: number) => { const d = len + Math.sin(f / 9 + ph) * 26; return (
    <svg width="120" height={d + 90} viewBox={`0 0 120 ${d + 90}`} style={{ position: 'absolute', left: x, top: 0, overflow: 'visible' }}><line x1="60" y1="0" x2="60" y2={d} stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
      <g transform={`translate(60 ${d + 26})`} stroke={BK} strokeWidth="6" strokeLinecap="round" fill="none">{[-1, 1].flatMap((sx) => [0, 1, 2, 3].map((i) => <path key={`${sx}${i}`} d={`M0 0 Q${sx * (30 + i * 5)} ${-22 + i * 12} ${sx * (48 + i * 4)} ${6 + i * 15}`} />))}<ellipse rx="22" ry="25" fill={BK} stroke="none" /><circle cx="-8" cy="-7" r="4" fill="#FF3B3B" stroke="none" /><circle cx="8" cy="-7" r="4" fill="#FF3B3B" stroke="none" /></g></svg>); };
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(1000px 1100px at 50% 45%, #5B2A9E 0%, #2A1050 55%, #0E0620 100%)', overflow: 'hidden', transform: `scale(${scale})` }}>
      <Web corner="tl" size={760} /><Web corner="tr" size={760} /><Stars n={40} />
      <Ghost x={110 + Math.sin(f / 14) * 24} y={420 + Math.cos(f / 11) * 30} s={1.3} rot={-8} /><Ghost x={760 + Math.cos(f / 13) * 24} y={1150 + Math.sin(f / 12) * 30} s={1.6} rot={9} />
      <Ghost x={420 + Math.sin(f / 9) * 18} y={1450 + Math.cos(f / 10) * 26} s={.9} />
      {sp(250, 360, 0)}{sp(840, 260, 2)}
      <Fog y={1100} tint="#9B6BFF" seed="fb" op={.38} /><Flyer seed="w" n={3} />
    </AbsoluteFill>
  );
};
// ---------- Fondo C: naranja energético con calabazas flotando y rayos
export const BgPumpkins: React.FC<{ dur: number }> = ({ dur }) => {
  const { f, scale } = useEnter();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(1100px 1100px at 50% 48%, #FFB22E 0%, #FF7A00 45%, #B33A00 100%)', overflow: 'hidden', transform: `scale(${scale})` }}>
      <AbsoluteFill style={{ opacity: .28, background: `repeating-conic-gradient(from ${f * 1.4}deg at 50% 48%, #fff 0 5deg, transparent 5deg 15deg)`, WebkitMaskImage: 'radial-gradient(circle at 50% 48%, #000 0, transparent 70%)' }} />
      {Array.from({ length: 9 }, (_, i) => { const r = (k: number) => random(`pk${i}${k}`), t = (f / 90 + r(1)) % 1;
        return <Pumpkin key={i} x={r(2) * 900 - 40} y={2000 - t * 2300} s={.55 + r(3) * .8} rot={Math.sin(f / 10 + i) * 14} color={i % 3 === 0 ? '#FF9A1A' : OR} glow={.6} />; })}
      <Flyer seed="c" n={4} />
    </AbsoluteFill>
  );
};
