import { Captions } from './Captions';
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, getStaticFiles, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const FPS = 30, TOTAL = 529;
const CUTS = [0, 51, 103, 154, 206, 257, 309, 360, 411, 463, TOTAL];   // cortes cada 4 tiempos (140 BPM)
const OR = '#FF7A00', YL = '#FFC21A', LIME = '#9BFF3D', PU = '#6B2FA0', BK = '#120A1A';
const CREEP = "'Creepster', 'Montserrat', cursive", MONT = "'Montserrat', system-ui, sans-serif";
const HAS_LOGO = getStaticFiles().some((f) => f.name === 'halloween/logo.svg');

const useFonts = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    const load = (fam: string, file: string, w: string) => new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, { weight: w }).load();
    Promise.all([load('Creepster', 'creepster-latin-400-normal.woff2', '400'), load('Montserrat', 'montserrat-latin-800-normal.woff2', '800'), load('Montserrat', 'montserrat-latin-700-normal.woff2', '700')])
      .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

// ---------- movimiento base de cada plano: golpe de zoom al entrar + empuje lento + entrada "latigazo"
const useShot = (dur: number, dir = 1) => {
  const f = useCurrentFrame();
  const punch = interpolate(f, [0, 9], [1.16, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
  const push = 1 + 0.07 * (f / dur);
  const whip = interpolate(f, [0, 6], [140 * dir, 0], { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' });
  const blur = interpolate(f, [0, 6], [14, 0], { extrapolateRight: 'clamp' });
  return { f, style: { transform: `translateX(${whip}px) scale(${punch * push})`, filter: `blur(${blur}px)` } as React.CSSProperties };
};

const VideoShot: React.FC<{ from: number; dur: number; rate?: number; dir?: number }> = ({ from, dur, rate = 1, dir = 1 }) => {
  const { style } = useShot(dur, dir);
  return <AbsoluteFill style={style}><OffthreadVideo src={staticFile('halloween/rec.mp4')} startFrom={from} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>;
};
// Foto vertical: cubre el cuadro con paneo suave entre dos puntos
const PhotoShot: React.FC<{ src: string; dur: number; px?: [number, number]; zoom?: [number, number]; dir?: number }> = ({ src, dur, px = [0, 0], zoom = [1, 1.12], dir = 1 }) => {
  const { f, style } = useShot(dur, dir); const p = f / dur;
  return (
    <AbsoluteFill style={{ ...style, overflow: 'hidden' }}>
      <Img src={staticFile(`halloween/${src}`)} style={{ position: 'absolute', left: '50%', top: '50%', height: 1920 * (zoom[0] + (zoom[1] - zoom[0]) * p), transform: `translate(${-50 + px[0] + (px[1] - px[0]) * p}%, -50%)` }} />
    </AbsoluteFill>
  );
};
// Foto horizontal: fondo desenfocado + "polaroid" inclinada
const PolaroidShot: React.FC<{ src: string; dur: number }> = ({ src, dur }) => {
  const { f, style } = useShot(dur, -1); const p = f / dur;
  return (
    <AbsoluteFill style={{ ...style, overflow: 'hidden', background: BK }}>
      <Img src={staticFile(`halloween/${src}`)} style={{ position: 'absolute', left: '50%', top: '50%', height: 2300, transform: 'translate(-50%,-50%)', filter: 'blur(26px) brightness(.7) saturate(1.3)' }} />
      <div style={{ position: 'absolute', left: 50, top: 520, width: 980, padding: '22px 22px 90px', background: '#fff', borderRadius: 14, boxShadow: '0 40px 80px rgba(0,0,0,.55)', transform: `rotate(${-4 + 3 * p}deg) scale(${1 + 0.05 * p})` }}>
        <div style={{ width: '100%', height: 690, overflow: 'hidden', borderRadius: 6 }}><Img src={staticFile(`halloween/${src}`)} style={{ width: `${118 + 8 * p}%`, marginLeft: `${-12 - 4 * p}%`, marginTop: -40 }} /></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- texto cinético estilo Halloween
const Kinetic: React.FC<{ lines: string[]; top: number; dur: number; size?: number; colors?: string[] }> = ({ lines, top, dur, size = 150, colors = [YL, LIME, OR] }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const out = interpolate(f, [dur - 5, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ alignItems: 'center', top, height: 'auto', opacity: out, transform: `scale(${0.9 + 0.1 * out})` }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ display: 'flex', gap: size * 0.34, font: `400 ${size}px/0.95 ${CREEP}`, letterSpacing: 2 }}>
          {ln.split(' ').map((w, wi) => {
            const k = li * 3 + wi, p = spring({ frame: f - 3 - k * 4, fps, config: { damping: 9, stiffness: 170, mass: .6 } });
            const rot = (random(`r${ln}${wi}`) - .5) * 9;
            return <span key={wi} style={{ display: 'inline-block', color: colors[(li + wi) % colors.length], WebkitTextStroke: `${size * 0.075}px ${BK}`, paintOrder: 'stroke fill',
              textShadow: `0 ${size * .06}px 0 ${PU}, 0 ${size * .12}px ${size * .2}px rgba(0,0,0,.6)`, transform: `scale(${p}) rotate(${rot * p + Math.sin((f + k * 7) / 9) * 1.2}deg)` }}>{w}</span>;
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ---------- decoración: murciélagos, araña colgante, destellos
const Bat: React.FC<{ x: number; y: number; s: number; flap: number }> = ({ x, y, s, flap }) => (
  <svg width={140 * s} height={70 * s} viewBox="0 0 140 70" style={{ position: 'absolute', left: x, top: y }}>
    <g fill={BK} transform={`translate(70 36) scale(1 ${0.55 + 0.45 * Math.abs(Math.sin(flap))}) translate(-70 -36)`}>
      <path d="M70 18 C60 4 40 8 8 14 C22 22 22 36 30 44 C40 36 50 40 56 52 C62 44 66 36 70 36 C74 36 78 44 84 52 C90 40 100 36 110 44 C118 36 118 22 132 14 C100 8 80 4 70 18Z" />
    </g>
    <circle cx="64" cy="26" r="2.4" fill="#FFD84A" /><circle cx="76" cy="26" r="2.4" fill="#FFD84A" />
  </svg>
);
const Bats: React.FC<{ n?: number; seed?: string; dur: number }> = ({ n = 4, seed = 'b', dur }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{Array.from({ length: n }, (_, i) => {
    const r = (k: number) => random(`${seed}${i}${k}`), p = ((f / dur) * (0.8 + r(1) * .6) + r(2)) % 1.3;
    return <Bat key={i} x={-200 + p * 1500} y={220 + r(3) * 1100 + Math.sin(f / 7 + i) * 40 - p * 180} s={.55 + r(4) * .6} flap={f / 1.6 + i * 2} />;
  })}</AbsoluteFill>;
};
const Spider: React.FC<{ x: number; dur: number; len?: number }> = ({ x, len = 520 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const d = len * spring({ frame: f - 4, fps, config: { damping: 6, stiffness: 60 } }) + Math.sin(f / 8) * 14;
  return (
    <svg width="160" height={d + 120} viewBox={`0 0 160 ${d + 120}`} style={{ position: 'absolute', left: x, top: 0, overflow: 'visible' }}>
      <line x1="80" y1="0" x2="80" y2={d} stroke="#fff" strokeOpacity=".8" strokeWidth="3" />
      <g transform={`translate(80 ${d + 30})`} stroke={BK} strokeWidth="7" strokeLinecap="round" fill="none">
        {[-1, 1].flatMap((sx) => [0, 1, 2, 3].map((i) => <path key={`${sx}${i}`} d={`M0 0 Q${sx * (36 + i * 6)} ${-28 + i * 14} ${sx * (58 + i * 4)} ${8 + i * 18}`} />))}
        <ellipse cx="0" cy="0" rx="26" ry="30" fill={BK} stroke="none" /><circle cx="-9" cy="-8" r="5" fill="#FF3B3B" stroke="none" /><circle cx="9" cy="-8" r="5" fill="#FF3B3B" stroke="none" />
      </g>
    </svg>
  );
};
const Sparks: React.FC<{ seed?: string }> = ({ seed = 's' }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill>{Array.from({ length: 14 }, (_, i) => {
    const r = (k: number) => random(`${seed}${i}${k}`), t = (f / 40 + r(1)) % 1;
    return <div key={i} style={{ position: 'absolute', left: r(2) * 1080, top: 1920 - t * 2100, width: 8 + r(3) * 14, height: 8 + r(3) * 14, borderRadius: '50%', background: i % 2 ? YL : OR, opacity: Math.sin(t * Math.PI) * .85, boxShadow: `0 0 18px ${OR}` }} />;
  })}</AbsoluteFill>;
};

// ---------- cierre con logo
const Closing: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const bg = interpolate(f, [0, 10], [1.2, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: f - 8, fps, config: { damping: 7, stiffness: 110, mass: .8 } });
  const t2 = spring({ frame: f - 26, fps, config: { damping: 10, stiffness: 120 } });
  const fade = interpolate(f, [dur - 8, dur], [1, 0.0], { extrapolateLeft: 'clamp' }) * 0 + 1;
  return (
    <AbsoluteFill style={{ background: BK, overflow: 'hidden', opacity: fade }}>
      <Img src={staticFile('halloween/foto7.jpg')} style={{ position: 'absolute', left: '50%', top: '50%', height: 2300 * bg, transform: 'translate(-50%,-50%)', filter: 'blur(14px) brightness(.45) saturate(1.2)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 46%, rgba(255,122,0,.55), rgba(107,47,160,.35) 55%, rgba(18,10,26,.85) 100%)` }} />
      <AbsoluteFill style={{ opacity: .35, mixBlendMode: 'screen', background: `repeating-conic-gradient(from ${f * 1.2}deg at 50% 46%, rgba(255,194,26,.55) 0 6deg, transparent 6deg 18deg)`, WebkitMaskImage: 'radial-gradient(circle at 50% 46%, #000 0, transparent 62%)' }} />
      <Sparks seed="c" /><Bats n={5} seed="cb" dur={dur} /><Spider x={110} dur={dur} len={430} /><Spider x={830} dur={dur} len={300} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', top: -260 }}>
        <div style={{ transform: `scale(${pop}) rotate(${(1 - pop) * -8}deg)`, filter: `drop-shadow(0 0 40px rgba(255,122,0,.8)) drop-shadow(0 20px 30px rgba(0,0,0,.6))` }}>
          {HAS_LOGO ? <Img src={staticFile('halloween/logo.svg')} style={{ width: 960 }} />
            : <div style={{ font: `800 150px ${MONT}`, color: '#fff', WebkitTextStroke: '22px #D32B2B', paintOrder: 'stroke fill', fontStyle: 'italic', letterSpacing: -4 }}>Don Vitto</div>}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame(); const d = f - at;
  if (d < -1 || d > 4) return null;
  return <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #FFF6D8, #FF9A2E)', opacity: interpolate(d, [-1, 0, 4], [0, .75, 0], { extrapolateRight: 'clamp' }), mixBlendMode: 'screen' }} />;
};

export const Halloween: React.FC = () => {
  useFonts();
  const D = (i: number) => CUTS[i + 1] - CUTS[i];
  const S = (i: number, children: React.ReactNode) => <Sequence key={i} from={CUTS[i]} durationInFrames={D(i)}>{children}</Sequence>;
  return (
    <AbsoluteFill style={{ background: BK }}>
      {S(0, <><VideoShot from={0} dur={D(0)} /><Spider x={70} dur={D(0)} len={380} /></>)}
      {S(1, <><VideoShot from={51} dur={D(1)} dir={-1} /><Sparks seed="a" /></>)}
      {S(2, <><VideoShot from={103} dur={D(2)} /><Bats dur={D(2)} seed="x" /></>)}
      {S(3, <><VideoShot from={154} dur={D(3)} dir={-1} /><Spider x={810} dur={D(3)} len={330} /></>)}
      {S(4, <><VideoShot from={206} dur={D(4)} rate={0.8} /><Sparks seed="b" /></>)}
      {S(5, <><PhotoShot src="foto4.jpg" dur={D(5)} px={[4, -4]} zoom={[1.0, 1.14]} /><Bats dur={D(5)} seed="y" n={3} /></>)}
      {S(6, <><PhotoShot src="foto6.jpg" dur={D(6)} px={[-3, 3]} zoom={[1.02, 1.14]} dir={-1} /><Spider x={60} dur={D(6)} len={300} /></>)}
      {S(7, <><PolaroidShot src="foto5.jpg" dur={D(7)} /><Sparks seed="d" /></>)}
      {S(8, <><PhotoShot src="foto3.jpg" dur={D(8)} px={[3, -3]} zoom={[1.0, 1.15]} /><Bats dur={D(8)} seed="z" /></>)}
      {S(9, <Closing dur={D(9)} />)}
      {CUTS.slice(1, 10).map((c) => <Flash key={c} at={c} />)}
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(18,10,26,.5) 100%)' }} />
      <Captions />
      <Audio src={staticFile('halloween/mix.wav')} />
    </AbsoluteFill>
  );
};
