"""Plan de montaje: planos, zooms, bloques de subtítulo y eventos de sonido (→ src/data/plan.json).
Reglas de estilo-podcast.md: corte en cada silencio eliminado, jump cut al inicio de bloque si el plano
lleva ≥ MIN_SHOT f, zoom alterno 100/110 %, punch-in 120 % en la frase marcada (punchWord) hasta el final.
Uso: python3 scripts/plan.py src/data/edit.json src/data/blocks.json src/data/plan.json
"""
import json, sys
FPS = 30; MIN_SHOT = 45; NEAR = 4; TAIL = 10; HOLD = 8
edit = json.load(open(sys.argv[1])); B = json.load(open(sys.argv[2]))
W = edit["words"]
wf = lambda i: round(W[i]["startMs"] / 1000 * FPS)
wef = lambda i: round(W[i]["endMs"] / 1000 * FPS)
blocks = B["blocks"]
last_word = max(i for b in blocks for l in b["lines"] for i in l)
end = min(edit["durationInFrames"], wef(last_word) + TAIL)
forced = [s["outStartFrame"] for s in edit["segments"]]
punch = wf(B["punchWord"]) - 1
cuts = set(forced) | {punch}
for k, b in enumerate(blocks):
    c = wf(b["lines"][0][0]) - 1
    if c <= 0 or c >= end - 20: continue
    near = sorted(cuts)
    prev = max(x for x in near if x <= c) if any(x <= c for x in near) else 0
    nxt = min((x for x in near if x > c), default=end)
    if abs(c - prev) < MIN_SHOT or nxt - c < 30 or c >= punch - 30 and c < punch: continue
    cuts.add(c)
cuts = sorted(cuts)
shots = []
for i, f in enumerate(cuts):
    to = cuts[i + 1] if i + 1 < len(cuts) else end
    zoom = 1.0 if i % 2 == 0 else 1.10
    if f == punch: zoom = 1.20
    shots.append({"from": f, "to": to, "zoom": zoom})
# alternancia estricta: si el plano anterior al punch ya es 110, se queda; sin dos iguales seguidos salvo punch
out_blocks = []
for k, b in enumerate(blocks):
    first = b["lines"][0][0]; lastw = b["lines"][-1][-1]
    fr = wf(first)
    nxt = wf(blocks[k + 1]["lines"][0][0]) if k + 1 < len(blocks) else end
    to = min(nxt, max(wef(lastw) + HOLD, fr + 12), end)
    out_blocks.append({**b, "from": fr, "to": to, "keyFrame": wf(b["key"]),
                       "text": [[W[i]["text"].strip() for i in l] for l in b["lines"]]})
plan = {"fps": FPS, "durationInFrames": end, "punchFrame": punch, "shots": shots, "blocks": out_blocks,
        "emojiFrames": [b["keyFrame"] for b in out_blocks if b.get("emoji")]}
json.dump(plan, open(sys.argv[3], "w"), ensure_ascii=False, indent=1)
print(f"{end} f ({end/FPS:.2f} s), {len(shots)} planos, {len(out_blocks)} bloques, {len(plan['emojiFrames'])} emojis, punch f{punch}")
print("planos (s):", [round((s['to']-s['from'])/FPS, 2) for s in shots])
print("zooms:", [s['zoom'] for s in shots])
