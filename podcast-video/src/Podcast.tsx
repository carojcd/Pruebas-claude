import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile } from "remotion";
import { Captions } from "./components/Captions";
import { Shot } from "./components/Shot";
import { DURATION, PLAN } from "./montaje";

const useFonts = () => {
  const [handle] = useState(() => delayRender("Cargando fuentes"));
  useEffect(() => {
    const faces = [
      new FontFace("Montserrat", `url(${staticFile("fonts/montserrat-latin-800-normal.woff2")})`, { weight: "800" }),
      new FontFace("Playfair Display", `url(${staticFile("fonts/playfair-display-latin-800-italic.woff2")})`, {
        weight: "800",
        style: "italic",
      }),
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

const MUSIC_VOL = 0.16; // ≈ −33 LUFS bajo la voz (−14 LUFS)

export const Podcast: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {PLAN.shots.map((shot, i) => (
        <Sequence key={i} name={`Plano ${i + 1} · ${Math.round(shot.zoom * 100)}%`} from={shot.from} durationInFrames={shot.to - shot.from}>
          <Shot shot={shot} />
        </Sequence>
      ))}

      <Captions />

      {/* Sonido: voz editada y normalizada + música muy baja + pop de emojis + whoosh del punch-in */}
      <Audio src={staticFile("voz.wav")} />
      <Sequence name="Música" durationInFrames={DURATION}>
        <Audio
          src={staticFile("sfx/musica.wav")}
          volume={(f) => interpolate(f, [0, 30, DURATION - 45, DURATION], [0, MUSIC_VOL, MUSIC_VOL, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      {PLAN.emojiFrames.map((f) => (
        <Sequence key={f} name="Pop emoji" from={f} durationInFrames={6}>
          <Audio src={staticFile("sfx/pop.wav")} />
        </Sequence>
      ))}
      <Sequence name="Whoosh punch-in" from={PLAN.punchFrame - 6} durationInFrames={12}>
        <Audio src={staticFile("sfx/whoosh.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};
