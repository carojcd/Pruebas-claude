import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND } from "../montaje";

// Tres nodos del logotipo (sistema gráfico «puntos y nodos»)
export const Nodes: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <div style={{ display: "flex", gap: size * 0.7, ...style }}>
    {[BRAND.turquesa, BRAND.cyan, BRAND.morado].map((c) => (
      <div key={c} style={{ width: size, height: size, borderRadius: "50%", background: c }} />
    ))}
  </div>
);

// Línea de degradado (sistema gráfico «líneas y trayectorias»)
export const GradientLine: React.FC<{ width: number; progress: number; style?: React.CSSProperties }> = ({
  width,
  progress,
  style,
}) => (
  <div style={{ width: width * progress, height: 6, borderRadius: 3, background: BRAND.gradiente, ...style }} />
);

// Oscurecimiento inferior + viñeta en azul oscuro de marca para que el texto blanco se lea sobre el fondo lavanda
export const Scrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(17,24,39,0) 38%, rgba(17,24,39,0.55) 58%, rgba(17,24,39,0.35) 80%, rgba(17,24,39,0.15) 100%),
        radial-gradient(ellipse at 50% 40%, rgba(17,24,39,0) 55%, rgba(17,24,39,0.45) 100%)`,
    }}
  />
);

// Tarjeta de texto a pantalla completa (sustituye a las tarjetas negra/blanca de la referencia)
export const Card: React.FC<{ variant: "oscura" | "clara" }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const dark = variant === "oscura";
  const line = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ background: dark ? BRAND.azulOscuro : BRAND.grisClaro, overflow: "hidden" }}>
      {/* curva de marca en una esquina */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          right: dark ? -420 : undefined,
          left: dark ? undefined : -460,
          top: dark ? -380 : undefined,
          bottom: dark ? undefined : -420,
          background: dark
            ? "linear-gradient(160deg, rgba(0,240,191,0.35), rgba(59,130,246,0.25) 55%, rgba(112,77,255,0.15))"
            : "linear-gradient(20deg, rgba(0,240,191,0.85), rgba(54,200,247,0.75) 50%, rgba(112,77,255,0.7))",
          filter: dark ? "blur(2px)" : undefined,
        }}
      />
      <Nodes size={18} style={{ position: "absolute", left: 96, top: 200 }} />
      <GradientLine width={260} progress={line} style={{ position: "absolute", left: 410, top: 1170 }} />
    </AbsoluteFill>
  );
};

// Entrada: panel azul oscuro que se retira hacia la izquierda con un filo de degradado (0–1 s)
export const IntroWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 30], [0, -1120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>
      <div style={{ position: "absolute", inset: 0, right: 0, width: 1080, background: BRAND.azulOscuro }} />
      <div style={{ position: "absolute", top: 0, left: 1080, width: 14, height: "100%", background: "linear-gradient(180deg, #00F0BF, #36C8F7, #3B82F6, #704DFF)" }} />
    </AbsoluteFill>
  );
};

// Cierre con logotipo (manual: fondo oscuro, área de protección 2X, sin sombras ni deformaciones)
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) } as const;
  const logo = interpolate(frame, [0, 14], [0, 1], ease);
  const t1 = interpolate(frame, [10, 22], [0, 1], ease);
  const t2 = interpolate(frame, [16, 28], [0, 1], ease);
  const blob = interpolate(frame, [0, 66], [0.92, 1.0]);
  const out = interpolate(frame, [56, 66], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BRAND.azulOscuro, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: out }}>
        <div
          style={{
            position: "absolute",
            width: 1300,
            height: 1300,
            borderRadius: "50%",
            left: -110,
            top: 230,
            transform: `scale(${blob})`,
            background: "linear-gradient(200deg, rgba(0,240,191,0.22), rgba(59,130,246,0.2) 55%, rgba(112,77,255,0.18))",
          }}
        />
        <Nodes size={16} style={{ position: "absolute", left: 96, top: 160 }} />
        <Img
          src={staticFile("logo-oscuro.png")}
          style={{
            position: "absolute",
            width: 640,
            left: (1080 - 640) / 2,
            top: 620,
            opacity: logo,
            transform: `translateY(${(1 - logo) * 30}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 1110,
            width: "100%",
            textAlign: "center",
            fontFamily: "DM Sans",
            fontWeight: 800,
            fontSize: 62,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
          }}
        >
          <div style={{ color: "#FFFFFF", opacity: t1, transform: `translateY(${(1 - t1) * 20}px)` }}>
            CONOCIMIENTO QUE CONECTA.
          </div>
          <div
            style={{
              opacity: t2,
              transform: `translateY(${(1 - t2) * 20}px)`,
              backgroundImage: BRAND.gradiente,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              display: "inline-block",
            }}
          >
            IDEAS QUE TRANSFORMAN.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
