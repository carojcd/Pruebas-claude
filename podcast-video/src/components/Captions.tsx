import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { Block, BLOCKS, blockWindow, BRAND, wordFrame, WORDS } from "../montaje";

const FADE = 8; // 250 ms
const BLUR = 6;

// Tamaños (estilo.md §B)
const STYLE = {
  normal: { size: 72, hlSize: 110, color: "#FFFFFF", align: "left" as const },
  enfasis: { size: 100, hlSize: 160, color: "#FFFFFF", align: "center" as const },
  tarjetaOscura: { size: 84, hlSize: 128, color: "#FFFFFF", align: "center" as const },
  tarjetaClara: { size: 84, hlSize: 128, color: BRAND.azulOscuro, align: "center" as const },
};

const WordSpan: React.FC<{ i: number; hl: boolean; blockFrom: number; kind: keyof typeof STYLE }> = ({
  i,
  hl,
  blockFrom,
  kind,
}) => {
  const frame = useCurrentFrame() + blockFrom; // fotograma global
  const start = wordFrame(i);
  const p = interpolate(frame, [start, start + FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s = STYLE[kind];
  const onVideo = kind === "normal" || kind === "enfasis";
  const text = WORDS[i].text.trim();
  const blur = `blur(${((1 - p) * BLUR).toFixed(2)}px)`;
  const shadow = onVideo ? " drop-shadow(0 4px 18px rgba(0,0,0,0.45))" : "";

  return (
    <span
      style={{
        display: "inline-block",
        marginRight: "0.24em",
        opacity: p,
        fontWeight: hl ? 800 : 500,
        fontSize: hl ? s.hlSize : s.size,
        letterSpacing: hl ? "-0.02em" : "-0.01em",
        filter: blur + shadow,
        ...(hl
          ? {
              backgroundImage: BRAND.gradiente,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              paddingBottom: "0.08em",
            }
          : { color: s.color }),
      }}
    >
      {text}
    </span>
  );
};

const BlockView: React.FC<{ block: Block; from: number }> = ({ block, from }) => {
  const kind = block.kind ?? "normal";
  const s = STYLE[kind];
  const centered = s.align === "center";
  return (
    <div
      style={{
        position: "absolute",
        left: centered ? 90 : 120,
        width: centered ? 900 : 820,
        top: kind === "normal" ? 1070 : 960,
        transform: "translateY(-50%)",
        textAlign: s.align,
        fontFamily: "DM Sans",
        lineHeight: 0.98,
      }}
    >
      {block.lines.map((line, li) => (
        <div key={li}>
          {line.map((i) => (
            <WordSpan key={i} i={i} hl={block.hl === i} blockFrom={from} kind={kind} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const Captions: React.FC = () => (
  <>
    {BLOCKS.map((block, b) => {
      const { from, to } = blockWindow(b);
      return (
        <Sequence key={b} name={`Subtítulo ${b + 1}`} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
          <BlockView block={block} from={from} />
        </Sequence>
      );
    })}
  </>
);
