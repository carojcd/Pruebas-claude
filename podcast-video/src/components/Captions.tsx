import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { BlockDef, CAPTION_Y, PLAN, wordFrame, WORDS } from "../montaje";

// estilo-podcast.md §3 y §4
const BASE = 78;
const KEY = Math.round(BASE * 1.3); // 101 px
const ORANGE = "#FF6A1A";
const EMOJI = 90;
const MAX_W = 880; // ancho útil (100 px de margen a cada lado)
const MAX_W_EMOJI = 760;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Word: React.FC<{ i: number; isKey: boolean; blockFrom: number }> = ({ i, isKey, blockFrom }) => {
  const frame = useCurrentFrame() + blockFrom; // fotograma global
  const t = frame - wordFrame(i);
  // pop 0,8 → 1,05 → 1 en 6 f; la clave 0,7 → 1,15 → 0,97 → 1 en 9 f
  const scale = isKey
    ? interpolate(t, [0, 5, 7, 9], [0.7, 1.15, 0.97, 1], clamp)
    : interpolate(t, [0, 4, 6], [0.8, 1.05, 1], clamp);
  const opacity = interpolate(t, [0, isKey ? 6 : 6], [0, 1], clamp);
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.13em",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "50% 75%",
        ...(isKey
          ? {
              fontFamily: "Playfair Display",
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: KEY,
              color: ORANGE,
              textShadow: `0 0 18px ${ORANGE}99, 0 0 42px ${ORANGE}55, 0 4px 14px rgba(0,0,0,.55)`,
            }
          : {
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontSize: BASE,
              color: "#FFFFFF",
              WebkitTextStroke: "2px rgba(0,0,0,.35)",
              paintOrder: "stroke fill",
              textShadow: "0 4px 14px rgba(0,0,0,.55)",
            }),
      }}
    >
      {WORDS[i].text.trim()}
    </span>
  );
};

const BlockView: React.FC<{ block: BlockDef }> = ({ block }) => {
  const frame = useCurrentFrame() + block.from;
  const te = frame - block.keyFrame;
  const eScale = interpolate(te, [0, 5, 8], [0.5, 1.2, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CAPTION_Y,
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: block.emoji ? MAX_W_EMOJI : MAX_W, lineHeight: 1.05, letterSpacing: "-0.01em" }}>
        {block.lines.map((line, li) => (
          <div key={li}>
            {line.map((i) => (
              <Word key={i} i={i} isKey={i === block.key} blockFrom={block.from} />
            ))}
          </div>
        ))}
      </div>
      {block.emoji ? (
        <span
          style={{
            fontFamily: "Noto Color Emoji",
            fontSize: EMOJI,
            lineHeight: 1,
            opacity: interpolate(te, [0, 4], [0, 1], clamp),
            transform: `scale(${eScale})`,
          }}
        >
          {block.emoji}
        </span>
      ) : null}
    </div>
  );
};

export const Captions: React.FC = () => (
  <>
    {PLAN.blocks.map((block, b) => (
      <Sequence key={b} name={`Subtítulo ${b + 1}`} from={block.from} durationInFrames={Math.max(1, block.to - block.from)} layout="none">
        <BlockView block={block} />
      </Sequence>
    ))}
  </>
);
