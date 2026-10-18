import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { grain, vignette } from "./lib/fx";
import { H, W } from "./lib/util";
import { shotA, shotB, shotC, shotD, shotE, shotF } from "./scenes";
import timeline from "./timeline.json";

const SCENES = { A: shotA, B: shotB, C: shotC, D: shotD, E: shotE, F: shotF } as const;

const drawFrame = (ctx: CanvasRenderingContext2D, frame: number) => {
  const shot = timeline.shots.find((s) => frame >= s.from && frame < s.to) ?? timeline.shots[timeline.shots.length - 1];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  SCENES[shot.id as keyof typeof SCENES](ctx, frame - shot.from, shot.to - shot.from);
  ctx.restore();
  vignette(ctx, 0.7);
  grain(ctx, frame, 0.09);
};

// Glifos 酒 y 場 de Noto Serif JP Black (solo los dos subconjuntos necesarios)
const useSignFont = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Fuente del letrero"));
  useEffect(() => {
    const faces = [
      new FontFace("NoirJP", `url(${staticFile("fonts/noto-serif-jp-106-900-normal.woff2")})`, { weight: "900", unicodeRange: "U+9152" }),
      new FontFace("NoirJP", `url(${staticFile("fonts/noto-serif-jp-117-900-normal.woff2")})`, { weight: "900", unicodeRange: "U+5834" }),
    ];
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => loaded.forEach((f) => document.fonts.add(f)))
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

export const Noir: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const ready = useSignFont();
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    // la línea de tiempo está en ticks de 1/30 s; se muestrea a renderFps (20 fps)
    if (ready && ctx) drawFrame(ctx, (frame * timeline.fps) / timeline.renderFps);
  }, [frame, ready]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("banda-sonora.wav")} />
    </AbsoluteFill>
  );
};
