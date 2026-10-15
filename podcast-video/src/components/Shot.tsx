import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { HEIGHT, outToSrc, ShotDef, WIDTH, zoomOrigin } from "../montaje";

// Corrección de color suave (estilo-podcast.md §6): contraste +8 %, saturación +5 %, sin tocar el matiz
const GRADE = "contrast(1.08) saturate(1.05)";

export const Shot: React.FC<{ shot: ShotDef }> = ({ shot }) => {
  const o = zoomOrigin(shot.from);
  return (
  <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
    <AbsoluteFill
      style={{
        transform: `scale(${shot.zoom})`,
        transformOrigin: `${WIDTH * o.x}px ${HEIGHT * o.y}px`,
      }}
    >
      <OffthreadVideo
        src={staticFile("clip-norm.mp4")}
        trimBefore={outToSrc(shot.from)}
        muted
        style={{ width: WIDTH, height: HEIGHT, objectFit: "cover", filter: GRADE }}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);
};
