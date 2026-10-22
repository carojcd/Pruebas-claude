import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

// Pieza de verificación: título que aparece con desenfoque y glow.
export const Prueba = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 24], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#04040c', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: '#fff', font: '700 120px system-ui, sans-serif', opacity: p, filter: `blur(${(1 - p) * 14}px)`,
        transform: `translateY(${(1 - p) * 26}px)`, textShadow: '0 0 24px rgba(150,120,255,.9), 0 0 70px rgba(110,80,255,.6)' }}>
        Remotion listo
      </div>
    </AbsoluteFill>
  );
};
