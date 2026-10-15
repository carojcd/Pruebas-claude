import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { GLITCH_AT, HEIGHT, outToSrc, ShotDef, WIDTH } from "../montaje";

const SRC = staticFile("mi-video-norm.mp4");
const SRC_W = 1920;
const SRC_H = 1080;
const S0 = HEIGHT / SRC_H; // el 16:9 se escala a 1920 px de alto y se recorta a 1080 de ancho

// Encuadre vertical por tipo de plano (coordenadas del original 1920×1080)
const FRAMING = {
  general: { cx: 700, anchorY: 560 }, // atril + parte de la pantalla del escenario
  medio: { cx: 1070, anchorY: 330 }, // cara del ponente
};

// Corrección de color: el original está sobreexpuesto y frío-lavanda; se baja hacia clave media
const GRADE = "brightness(0.9) contrast(1.1) saturate(1.06)";
const GRADE_DARK = "brightness(0.58) contrast(1.12) saturate(0.95)";

const GLITCH_HALF = 5; // fotogramas a cada lado del corte (≈ 330 ms en total)

const Layer: React.FC<{
  trimBefore: number;
  filter: string;
  dx?: number;
  channel?: "r" | "g" | "b";
  muted?: boolean;
}> = ({ trimBefore, filter, dx = 0, channel, muted }) => (
  <OffthreadVideo
    src={SRC}
    trimBefore={trimBefore}
    muted={muted}
    style={{
      position: "absolute",
      width: SRC_W * S0,
      height: HEIGHT,
      left: dx,
      top: 0,
      filter: channel ? `${filter} url(#solo-${channel})` : filter,
      mixBlendMode: channel ? "screen" : undefined,
    }}
  />
);

export const Shot: React.FC<{ shot: ShotDef }> = ({ shot }) => {
  const local = useCurrentFrame();
  const global = shot.from + local;
  const f = FRAMING[shot.framing];
  const trimBefore = outToSrc(shot.from);

  // Fuerza del glitch (triangular, centrada en el corte)
  const g = Math.max(0, 1 - Math.abs(global - GLITCH_AT + 0.5) / GLITCH_HALF);
  const base = shot.dark ? GRADE_DARK : GRADE;
  const filter = g > 0 ? `${base} blur(${(g * 16).toFixed(1)}px)` : base;
  const split = g * 16;

  const left = WIDTH / 2 - f.cx * S0;
  const originY = f.anchorY * S0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${shot.zoom})`,
          transformOrigin: `${WIDTH / 2}px ${originY}px`,
        }}
      >
        <div style={{ position: "absolute", left, top: 0, width: SRC_W * S0, height: HEIGHT }}>
          {g > 0 ? (
            <>
              {/* separación RGB: tres capas de un solo canal sumadas con «screen» */}
              <Layer trimBefore={trimBefore} filter={filter} channel="r" dx={split} />
              <Layer trimBefore={trimBefore} filter={filter} channel="g" muted />
              <Layer trimBefore={trimBefore} filter={filter} channel="b" dx={-split} muted />
            </>
          ) : (
            <Layer trimBefore={trimBefore} filter={filter} />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Filtros SVG de aislamiento de canal (se montan una vez en la composición)
export const ChannelFilters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {(["r", "g", "b"] as const).map((c) => (
        <filter id={`solo-${c}`} key={c} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={[
              c === "r" ? "1 0 0 0 0" : "0 0 0 0 0",
              c === "g" ? "0 1 0 0 0" : "0 0 0 0 0",
              c === "b" ? "0 0 1 0 0" : "0 0 0 0 0",
              "0 0 0 1 0",
            ].join(" ")}
          />
        </filter>
      ))}
    </defs>
  </svg>
);
