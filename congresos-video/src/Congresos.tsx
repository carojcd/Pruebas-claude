import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile } from "remotion";
import { Captions } from "./components/Captions";
import { Card, EndCard, Scrim } from "./components/Graphics";
import { ChannelFilters, Shot } from "./components/Shot";
import {
  CARD_DARK_FROM,
  CARD_LIGHT_FROM,
  CARD_TO,
  DURATION,
  EDIT_END,
  END_CARD,
  GLITCH_AT,
  SHOTS,
} from "./montaje";

// DM Sans local (tipografía corporativa del manual)
const useBrandFonts = () => {
  const [handle] = useState(() => delayRender("Cargando DM Sans"));
  useEffect(() => {
    const faces = [
      new FontFace("DM Sans", `url(${staticFile("fonts/dm-sans-latin-500-normal.woff2")})`, { weight: "500" }),
      new FontFace("DM Sans", `url(${staticFile("fonts/dm-sans-latin-800-normal.woff2")})`, { weight: "800" }),
    ];
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => {
        loaded.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);
};

const PAD_FROM = GLITCH_AT; // la cama musical entra tras el glitch (≈ 60 % del vídeo, como la referencia)

export const Congresos: React.FC = () => {
  useBrandFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: "#111827" }}>
      <ChannelFilters />

      {/* Planos */}
      {SHOTS.map((shot, i) => (
        <Sequence
          key={i}
          name={`Plano ${i + 1}${shot.dark ? " (énfasis)" : ""} · ${shot.framing} ${Math.round(shot.zoom * 100)}%`}
          from={shot.from}
          durationInFrames={shot.to - shot.from}
        >
          <Shot shot={shot} />
        </Sequence>
      ))}

      <Sequence name="Oscurecido inferior" durationInFrames={EDIT_END}>
        <Scrim />
      </Sequence>

      {/* Tarjetas de texto (la voz sigue debajo) */}
      <Sequence name="Tarjeta oscura" from={CARD_DARK_FROM} durationInFrames={CARD_LIGHT_FROM - CARD_DARK_FROM}>
        <Card variant="oscura" />
      </Sequence>
      <Sequence name="Tarjeta clara" from={CARD_LIGHT_FROM} durationInFrames={CARD_TO - CARD_LIGHT_FROM}>
        <Card variant="clara" />
      </Sequence>

      <Captions />

      <Sequence name="Cierre" from={EDIT_END} durationInFrames={END_CARD}>
        <EndCard />
      </Sequence>

      {/* Sonido */}
      <Sequence name="SFX riser" durationInFrames={40}>
        <Audio src={staticFile("sfx/riser.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="SFX glitch" from={GLITCH_AT - 3} durationInFrames={12}>
        <Audio src={staticFile("sfx/glitch.wav")} volume={0.55} />
      </Sequence>
      {[CARD_DARK_FROM, CARD_LIGHT_FROM, CARD_TO].map((f) => (
        <Sequence key={f} name="SFX whoosh" from={f - 6} durationInFrames={12}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
        </Sequence>
      ))}
      <Sequence name="Cama musical" from={PAD_FROM} durationInFrames={DURATION - PAD_FROM}>
        <Audio
          src={staticFile("sfx/pad.wav")}
          loop
          volume={(f) => {
            const total = DURATION - PAD_FROM;
            const endCardAt = EDIT_END - PAD_FROM;
            return interpolate(
              f,
              [0, 30, endCardAt, endCardAt + 10, total - 20, total],
              [0, 0.11, 0.11, 0.3, 0.3, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
          }}
        />
      </Sequence>
      <Sequence name="SFX cierre" from={EDIT_END} durationInFrames={END_CARD}>
        <Audio src={staticFile("sfx/cierre.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
