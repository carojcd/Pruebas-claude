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
    {name === 'bed' && (<g fill={color}><rect x="8" y="62" width="84" height="12" rx="4" /><rect x="8" y="30" width="10" height="50" rx="4" /><circle cx="32" cy="50" r="8" /><path d="M44 46 H80 a12 12 0 0 1 12 12 v4 H44Z" /><rect x="84" y="74" width="8" height="12" rx="3" /></g>)}
    {name === 'syringe' && (<g fill={color}><rect x="30" y="34" width="40" height="18" rx="4" transform="rotate(-35 50 43)" /><rect x="14" y="64" width="26" height="5" rx="2.5" transform="rotate(-35 27 66)" /><rect x="62" y="20" width="6" height="26" rx="3" transform="rotate(55 65 33)" /><rect x="68" y="14" width="22" height="7" rx="3" transform="rotate(55 79 18)" /></g>)}
    {name === 'fluid' && (<g><path d={drop(40, 46, 1.2)} fill={color} /><path d={drop(70, 70, .8)} fill={color} opacity=".8" /><path d={drop(24, 80, .5)} fill={color} opacity=".7" /></g>)}
    {name === 'person' && (<g fill={color}><circle cx="50" cy="30" r="15" /><path d="M18 88 C18 62 34 52 50 52 C66 52 82 62 82 88Z" /></g>)}
    {name === 'monitor' && (<g><rect x="12" y="18" width="76" height="52" rx="8" fill={color} /><path d="M20 46 H36 L42 32 L52 60 L58 44 H80" fill="none" stroke={C.blue} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><rect x="42" y="72" width="16" height="10" fill={color} /><rect x="30" y="82" width="40" height="7" rx="3.5" fill={color} /></g>)}
    {name === 'back' && (<g><g transform="translate(14 -6) scale(.78)"><Hand fill={color} /></g><g transform="translate(6 40) scale(.78)" opacity=".85"><Hand fill={color} /></g></g>)}
    {name === 'interlace' && (<g fill="none" stroke={color} strokeWidth="9"><rect x="10" y="30" width="46" height="30" rx="15" /><rect x="44" y="40" width="46" height="30" rx="15" /></g>)}
    {name === 'padlock' && (<g><path d="M30 46 V34 a20 20 0 0 1 40 0 V46" fill="none" stroke={color} strokeWidth="10" /><rect x="18" y="44" width="64" height="44" rx="10" fill={color} /><circle cx="50" cy="63" r="6" fill={C.blue} /><rect x="47" y="66" width="6" height="12" rx="3" fill={C.blue} /></g>)}
    {name === 'thumb' && (<g><path d="M40 86 V50 L50 18 a8 8 0 0 1 14 6 L60 44 H80 a8 8 0 0 1 8 10 L82 80 a10 10 0 0 1 -10 6Z" fill={color} /><rect x="14" y="48" width="18" height="38" rx="5" fill={color} /><path d="M20 22 a30 30 0 0 1 24 -10" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" /><path d="M42 4 L50 12 L40 18Z" fill={color} /></g>)}
    {name === 'fingertips' && (<g fill={color}><rect x="16" y="10" width="13" height="42" rx="6.5" /><rect x="33" y="6" width="13" height="48" rx="6.5" /><rect x="50" y="10" width="13" height="44" rx="6.5" /><rect x="67" y="18" width="12" height="36" rx="6" /><rect x="12" y="62" width="72" height="24" rx="10" opacity=".85" /></g>)}
    {name === 'rinse' && (<g><path d="M14 36 H54 a18 18 0 0 1 18 18 v4 h-14 v-4 a4 4 0 0 0 -4 -4 H14Z" fill={color} /><rect x="22" y="20" width="24" height="7" rx="3" fill={color} /><rect x="30" y="26" width="9" height="10" fill={color} /><path d={drop(65, 74, .5)} fill={color} /><path d={drop(50, 88, .36)} fill={color} opacity=".75" /><path d={drop(82, 90, .36)} fill={color} opacity=".75" /></g>)}
    {name === 'towelfaucet' && (<g><rect x="8" y="28" width="44" height="60" rx="7" fill={color} /><path d="M16 46 H44 M16 58 H44 M16 70 H36" stroke={C.blue} strokeWidth="5" strokeLinecap="round" opacity=".5" /><path d="M54 24 H78 a10 10 0 0 1 10 10 v8 h-10 v-8 H54Z" fill={color} /><path d={drop(83, 62, .34)} fill={color} /></g>)}
    {name === 'bin' && (<g><rect x="22" y="34" width="56" height="54" rx="8" fill="#FF6B6B" /><rect x="16" y="24" width="68" height="10" rx="5" fill="#FF6B6B" /><rect x="40" y="16" width="20" height="8" rx="4" fill="#FF6B6B" /><path d="M36 46 V76 M50 46 V76 M64 46 V76" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".85" /></g>)}
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
