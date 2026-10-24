import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Captions } from './Captions';

export const FPS = 30, TOTAL = 456;
const HIT = 74, LOGO_AT = 346, CX = 535, CY = 100;               // CX/CY: centro del contador en la captura (px de la imagen)
const CYAN = '#35E0FF', RED = '#FF4D4D', WINE = '#6D0F24';
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const useFonts = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all([700, 800].map((w) => new FontFace('Montserrat', `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load()))
      .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

// ---------- cámara: spline suave (Catmull-Rom) por puntos clave [fotograma, px, py, zoom, rotX, rotY, rotZ]
type K = [number, number, number, number, number, number, number];
const KEYS: K[] = [
  [0, 422, 800, 0.62, 24, -20, 0], [30, 440, 430, 1.05, 14, -12, -1], [74, 548, 104, 2.5, 5, -9, 0], [118, 560, 112, 2.65, 3, -6, 0],
  [160, 420, 330, 1.55, 9, 8, 1], [215, 420, 570, 1.6, 8, -8, 0], [262, 300, 840, 1.5, 9, 9, -1], [310, 420, 1300, 1.35, 14, -7, 0], [348, 422, 900, 0.7, 26, 12, 3], [460, 422, 900, 0.7, 26, 12, 3],
];
const cr = (a: number, b: number, c: number, d: number, u: number) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
const camAt = (f: number) => {
  let i = KEYS.findIndex((k, j) => f >= k[0] && f < (KEYS[j + 1]?.[0] ?? 1e9)); if (i < 0) i = KEYS.length - 2;
  const k0 = KEYS[Math.max(i - 1, 0)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(i + 2, KEYS.length - 1)];
  const u0 = clamp((f - k1[0]) / (k2[0] - k1[0])), u = u0 * u0 * (3 - 2 * u0) * 0.55 + u0 * 0.45;      // arranque/frenada suaves sin detenerse
  return [1, 2, 3, 4, 5, 6].map((n) => cr(k0[n], k1[n], k2[n], k3[n], u)) as number[];
};

// ---------- fondo tecnológico
const Rain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ overflow: 'hidden', opacity: .5 }}>
    {Array.from({ length: 16 }, (_, i) => {
      const r = (k: number) => random(`rain${i}${k}`), sp = 1.5 + r(1) * 3.5, y = ((f * sp + r(2) * 2400) % 2600) - 500;
      return <div key={i} style={{ position: 'absolute', left: 30 + i * 66, top: y, width: 40, font: `700 34px/1.25 'Montserrat', monospace`, color: i % 5 === 0 ? RED : CYAN, opacity: .12 + r(3) * .22, textAlign: 'center', whiteSpace: 'pre', letterSpacing: 2 }}>
        {Array.from({ length: 14 }, (_, j) => Math.floor(random(`d${i}${j}${Math.floor(f / 6 + j)}`) * 10)).join('\n')}</div>;
    })}
  </AbsoluteFill>
);
const Grid: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ perspective: 900, overflow: 'hidden' }}>
    {[0, 1].map((top) => (
      <div key={top} style={{ position: 'absolute', left: -600, width: 2280, height: 1400, [top ? 'top' : 'bottom']: -380, transformOrigin: top ? '50% 0%' : '50% 100%', transform: `rotateX(${top ? -72 : 72}deg)`,
        backgroundImage: `linear-gradient(${CYAN}55 2px, transparent 2px), linear-gradient(90deg, ${CYAN}55 2px, transparent 2px)`, backgroundSize: '110px 110px', backgroundPosition: `0 ${(f * (top ? -3 : 3)) % 110}px`,
        WebkitMaskImage: `linear-gradient(${top ? 'to bottom' : 'to top'}, #000, transparent 70%)`, opacity: .55 }} />
    ))}
  </AbsoluteFill>
);
const Hud: React.FC<{ f: number }> = ({ f }) => (
  <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: .5 }}>
    <g transform="translate(540 900)" fill="none" stroke={CYAN}>
      <circle r="520" strokeWidth="2" strokeDasharray="6 22" transform={`rotate(${f * .6})`} opacity=".6" />
      <circle r="610" strokeWidth="3" strokeDasharray="160 90" transform={`rotate(${-f * .45})`} opacity=".5" />
      <circle r="430" strokeWidth="1.5" strokeDasharray="2 10" transform={`rotate(${f * .9})`} opacity=".7" />
      {Array.from({ length: 36 }, (_, i) => <line key={i} x1="0" y1="-640" x2="0" y2={i % 3 ? -660 : -690} strokeWidth="3" transform={`rotate(${i * 10 + f * .2})`} opacity=".5" />)}
    </g>
  </svg>
);
const TechBg: React.FC<{ f: number; px: number; py: number }> = ({ f, px, py }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(1100px 1300px at 50% 46%, #0F2A5E 0%, #071230 45%, #02040B 100%)' }}>
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${-(px - 422) * .05}px, ${-(py - 800) * .03}px)` }}><Grid f={f} /><Hud f={f} /></div>
    <Rain f={f} />
    <div style={{ position: 'absolute', left: -200, top: 600, width: 1500, height: 700, background: 'radial-gradient(closest-side, rgba(255,60,60,.16), transparent)', transform: `translate(${Math.sin(f / 40) * 60}px,0)` }} />
  </AbsoluteFill>
);

// ---------- la captura del perfil (plano 3D) con el contador animado
const Counter: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const p = clamp((f - 10) / (HIT - 10)), val = Math.round(1000 * Easing.out(Easing.cubic)(p)) , done = f >= HIT;
  const pop = done ? spring({ frame: f - HIT, fps, config: { damping: 6, stiffness: 160, mass: .7 } }) : 0;
  const glow = done ? Math.max(0, 1 - (f - HIT) / 40) : 0.5 + 0.5 * Math.sin(f / 2);
  return (
    <>
      <div style={{ position: 'absolute', left: 482, top: 80, width: 104, height: 44, background: '#0C0F14' }} />
      <div style={{ position: 'absolute', left: 488, top: 83, font: `600 36px/1 'Inter', 'Montserrat', sans-serif`, letterSpacing: -0.4, color: '#F5F6F7', transformOrigin: '0% 55%', transform: `scale(${1 + 0.32 * (1 - Math.min(pop, 1)) * (done ? 1 : 0) + (done ? 0.0 : 0)})`,
        textShadow: `0 0 ${10 + 24 * glow}px rgba(53,224,255,${.35 + .6 * glow}), 0 0 ${4 + 10 * glow}px rgba(255,255,255,.5)` }}>{val}</div>
    </>
  );
};
const Burst: React.FC<{ f: number }> = ({ f }) => {
  const d = f - HIT; if (d < 0 || d > 40) return null;
  return (
    <div style={{ position: 'absolute', left: CX, top: CY, width: 0, height: 0 }}>
      {[0, 6, 12].map((o, i) => { const r = clamp((d - o) / 26); return <div key={i} style={{ position: 'absolute', left: -150 * r - 4, top: -150 * r - 4, width: 300 * r + 8, height: 300 * r + 8, borderRadius: '50%', border: `${4 - 2 * r}px solid ${i === 1 ? RED : CYAN}`, opacity: 1 - r, boxShadow: `0 0 20px ${CYAN}` }} />; })}
      {Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2 + random(`a${i}`) * .4, r = 30 + (60 + random(`r${i}`) * 140) * Easing.out(Easing.cubic)(clamp(d / 30));
        return <div key={i} style={{ position: 'absolute', left: Math.cos(a) * r - 3, top: Math.sin(a) * r - 3, width: 6, height: 6, borderRadius: '50%', background: i % 3 ? '#fff' : RED, opacity: 1 - clamp(d / 36), boxShadow: `0 0 12px ${i % 3 ? CYAN : RED}` }} />; })}
    </div>
  );
};
const Plane: React.FC<{ f: number; cam: number[] }> = ({ f, cam }) => {
  const [px, py, z, rx, ry, rz] = cam, ez = z * (1080 / 844);
  const bob = Math.sin(f / 18) * 0.6, scan = clamp(f / 70);
  const enter = 0.35 + 0.65 * Easing.out(Easing.cubic)(clamp(f / 12));
  return (
    <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: '50% 46%', opacity: enter }}>
      <div style={{ position: 'absolute', left: 540, top: 880, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx + bob}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${ez}) translate(${-px}px, ${-py}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 844, height: 1600, borderRadius: 4, boxShadow: `0 0 0 2px ${CYAN}AA, 0 0 50px 6px rgba(53,224,255,.45), 0 60px 140px rgba(0,0,0,.7)` }}>
          <Img src={staticFile('mil/perfil2x.png')} style={{ position: 'absolute', inset: 0, width: 844, height: 1600 }} />
          <Counter f={f} /><Burst f={f} />
          {/* barrido de escaneo y marco de enfoque sobre el contador */}
          {scan < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: scan * 1600 - 40, height: 80, background: `linear-gradient(transparent, ${CYAN}55, transparent)` }} />}
          <div style={{ position: 'absolute', left: 470, top: 70, width: 130, height: 64, opacity: clamp((f - 16) / 10) * (1 - clamp((f - 150) / 14)) }}>
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => <div key={i} style={{ position: 'absolute', [x ? 'right' : 'left']: 0, [y ? 'bottom' : 'top']: 0, width: 16, height: 16, borderColor: CYAN, borderStyle: 'solid', borderWidth: `${y ? 0 : 3}px ${x ? 3 : 0}px ${y ? 3 : 0}px ${x ? 0 : 3}px`, filter: `drop-shadow(0 0 6px ${CYAN})` }} />)}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- cierre: fondo vino tinto + logo animado
const Closing: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig(); const l = f - LOGO_AT;
  const pop = spring({ frame: l - 6, fps, config: { damping: 9, stiffness: 90, mass: .9 } });
  const flip = interpolate(pop, [0, 1], [-70, 0]), shine = interpolate(l, [30, 62], [-60, 160], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = (o: number) => clamp((l - o) / 60);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 42%, #A3173A 0%, ${WINE} 45%, #2A0510 100%)`, overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: .22, mixBlendMode: 'screen', background: `repeating-conic-gradient(from ${l * .5}deg at 50% 42%, #FFB3C0 0 4deg, transparent 4deg 14deg)`, WebkitMaskImage: 'radial-gradient(circle at 50% 42%, #000 0, transparent 66%)' }} />
      {[0, 14, 28].map((o, i) => { const r = ring(o); return <div key={i} style={{ position: 'absolute', left: 540 - 700 * r, top: 800 - 700 * r, width: 1400 * r, height: 1400 * r, borderRadius: '50%', border: '3px solid rgba(255,214,150,.55)', opacity: (1 - r) * (r > 0 ? 1 : 0) }} />; })}
      {Array.from({ length: 26 }, (_, i) => { const r = (k: number) => random(`g${i}${k}`), t = (f / 120 + r(1)) % 1; return <div key={i} style={{ position: 'absolute', left: r(2) * 1080, top: 2000 - t * 2200, width: 6 + r(3) * 14, height: 6 + r(3) * 14, borderRadius: '50%', background: i % 2 ? '#FFD28A' : '#FF8FA3', opacity: Math.sin(t * Math.PI) * .75, filter: 'blur(1px)', boxShadow: '0 0 16px rgba(255,200,120,.7)' }} />; })}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', top: -110, perspective: 1400 }}>
        <div style={{ position: 'relative', width: 960, transform: `rotateY(${flip}deg) scale(${0.4 + 0.6 * pop}) translateY(${Math.sin(f / 16) * 8}px)`, opacity: clamp(l / 8), filter: 'drop-shadow(0 0 50px rgba(255,120,120,.55)) drop-shadow(0 26px 34px rgba(0,0,0,.55))' }}>
          <Img src={staticFile('mil/logo.svg')} style={{ width: 960, display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `url(${staticFile('mil/logo.svg')})`, WebkitMaskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', background: `linear-gradient(105deg, transparent ${shine - 20}%, rgba(255,255,255,.95) ${shine}%, transparent ${shine + 20}%)` }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Mil: React.FC = () => {
  useFonts();
  const f = useCurrentFrame(); const cam = camAt(f);
  const wipe = Easing.inOut(Easing.cubic)(clamp((f - (LOGO_AT - 12)) / 16));
  const flash = clamp(1 - Math.abs(f - HIT) / 5) * 0.22;
  return (
    <AbsoluteFill style={{ background: '#02040B' }}>
      <TechBg f={f} px={cam[0]} py={cam[1]} />
      <Plane f={f} cam={cam} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 75% at 50% 45%, transparent 55%, rgba(2,4,11,.55) 100%)`, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash, mixBlendMode: 'screen' }} />
      {f >= LOGO_AT - 14 && <AbsoluteFill style={{ clipPath: `circle(${wipe * 1500}px at 50% 46%)` }}><Closing f={f} /></AbsoluteFill>}
      <Captions />
      <Audio src={staticFile('mil/mix.wav')} />
    </AbsoluteFill>
  );
};
