import React from 'react';
export const C = { deep: '#0B3C75', blue: '#1E88E5', mid: '#4FA9F0', sky: '#8FD0FA', pale: '#E3F3FF', white: '#fff' };

const drop = (cx: number, cy: number, s: number) => `M${cx} ${cy - 22 * s} C${cx + 6 * s} ${cy - 10 * s} ${cx + 18 * s} ${cy + 2 * s} ${cx + 18 * s} ${cy + 12 * s} A${18 * s} ${18 * s} 0 0 1 ${cx - 18 * s} ${cy + 12 * s} C${cx - 18 * s} ${cy + 2 * s} ${cx - 6 * s} ${cy - 10 * s} ${cx} ${cy - 22 * s}Z`;

export const Hand: React.FC<{ fill?: string }> = ({ fill = C.white }) => (
  <g fill={fill}>
    <rect x="27" y="14" width="11" height="40" rx="5.5" /><rect x="40" y="8" width="11" height="46" rx="5.5" />
    <rect x="53" y="12" width="11" height="42" rx="5.5" /><rect x="66" y="22" width="10" height="34" rx="5" />
    <rect x="24" y="40" width="54" height="42" rx="20" />
    <rect x="8" y="46" width="30" height="12" rx="6" transform="rotate(32 20 52)" />
  </g>
);
export const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 100, color = C.white }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
    {name === 'drop' && <path d={drop(50, 52, 1.6)} fill={color} />}
    {name === 'soap' && (<g fill={color}><rect x="30" y="44" width="40" height="44" rx="10" /><rect x="44" y="26" width="12" height="20" rx="3" />
      <path d="M44 26 H72 a6 6 0 0 1 6 6 v2 H56 v-4 H44Z" /><circle cx="82" cy="42" r="4" opacity=".8" /><circle cx="88" cy="30" r="3" opacity=".7" />
      <rect x="38" y="58" width="24" height="14" rx="4" fill={C.blue} opacity=".35" /></g>)}
    {name === 'hands' && (<g><g transform="translate(-14 2) scale(.82)"><Hand fill={color} /></g><g transform="translate(114 2) scale(-.82 .82)"><Hand fill={color} /></g></g>)}
    {name === 'faucet' && (<g><path d="M18 40 H58 a18 18 0 0 1 18 18 v6 h-14 v-6 a4 4 0 0 0 -4 -4 H18Z" fill={color} /><rect x="30" y="26" width="14" height="14" rx="3" fill={color} />
      <rect x="22" y="22" width="30" height="7" rx="3" fill={color} /><path d={drop(69, 80, .42)} fill={color} /><path d={drop(69, 96, .3)} fill={color} opacity=".7" /></g>)}
    {name === 'clock' && (<g><circle cx="50" cy="52" r="36" fill="none" stroke={color} strokeWidth="9" /><path d="M50 30 V52 L66 62" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="40" y="6" width="20" height="9" rx="4" fill={color} /></g>)}
    {name === 'towel' && (<g><rect x="22" y="14" width="56" height="72" rx="8" fill={color} /><path d="M32 34 H68 M32 48 H68 M32 62 H56" stroke={C.blue} strokeWidth="6" strokeLinecap="round" opacity=".5" /></g>)}
  </svg>
);
export const HeartDrop: React.FC<{ size?: number }> = ({ size = 300 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
    <defs><linearGradient id="hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.sky} /><stop offset="1" stopColor={C.blue} /></linearGradient></defs>
    <path d={drop(50, 54, 2.0)} fill="url(#hd)" />
    <path d="M50 70 C28 56 32 40 42 40 C47 40 50 44 50 46 C50 44 53 40 58 40 C68 40 72 56 50 70Z" fill="#fff" />
    <ellipse cx="38" cy="38" rx="4" ry="9" fill="#fff" opacity=".35" transform="rotate(-24 38 38)" />
  </svg>
);
