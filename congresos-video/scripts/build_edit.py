"""Construye la edición (EDL + subtítulos) a partir del audio y de los tiempos de Whisper.

1. Detecta silencios por energía (RMS en ventanas de 10 ms).
2. Recorta todo silencio > MIN_SIL s dejando PAD_PRE / PAD_POST de aire.
3. Ajusta los tiempos de Whisper a los bordes reales de la voz y los traslada a la línea de tiempo editada.
4. Agrupa las palabras en bloques de subtítulo según BLOCKS (decisión editorial, ver estilo.md).

Uso: python3 scripts/build_edit.py public/mi-video.mp4 analisis/mi-video-palabras.json src/data/edit.json
"""
import json
import os
import subprocess
import sys

import numpy as np

FPS = 30
SR = 16000
WIN = 0.01  # s
MIN_SIL = 0.30  # silencios más largos que esto se cortan
PAD_PRE = 0.06  # aire que se deja antes de retomar la voz
PAD_POST = 0.08  # aire que se deja tras la última palabra
SOFT_DB = -42.0  # pausas suaves (solo para alinear palabras, no se cortan)
SOFT_MIN = 0.25
THR_DB = -55.0  # umbral de voz (dBFS RMS); el fondo real está < -60 dB

src, words_path, out_path = sys.argv[1:4]

pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    capture_output=True, check=True,
).stdout
audio = np.frombuffer(pcm, np.float32)
dur = len(audio) / SR
n = int(len(audio) / (SR * WIN))
frames = audio[: n * int(SR * WIN)].reshape(n, -1)
db = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-9)
voiced = db > THR_DB

# silencios = tramos sin voz de más de MIN_SIL
silences = []
i = 0
while i < n:
    if not voiced[i]:
        j = i
        while j < n and not voiced[j]:
            j += 1
        s, e = i * WIN, j * WIN
        if e - s > MIN_SIL:
            silences.append((s, e))
        i = j
    else:
        i += 1

# tramos a conservar
keep = []
cursor = 0.0
for s, e in silences:
    cut_from = s + PAD_POST if s > 0 else 0.0
    cut_to = e - PAD_PRE if e < dur else dur
    if cut_to - cut_from <= 0:
        continue
    if cut_from > cursor:
        keep.append([cursor, cut_from])
    cursor = cut_to
if cursor < dur:
    keep.append([cursor, dur])

# a fotogramas (el original es 30 fps: cortes exactos de fotograma)
segs = []
out_f = 0
for s, e in keep:
    fs, fe = round(s * FPS), round(e * FPS)
    if fe - fs < 3:
        continue
    segs.append({"srcStartFrame": fs, "srcEndFrame": fe, "outStartFrame": out_f})
    out_f += fe - fs
total = out_f


def src_to_out(t):
    """Segundo de origen → segundo editado (None si cae en un tramo cortado)."""
    f = t * FPS
    for sg in segs:
        if sg["srcStartFrame"] <= f <= sg["srcEndFrame"]:
            return (sg["outStartFrame"] + f - sg["srcStartFrame"]) / FPS
    return None


def snap_out(t, prefer_next=True):
    o = src_to_out(t)
    if o is not None:
        return o
    f = t * FPS
    if prefer_next:
        for sg in segs:
            if sg["srcStartFrame"] > f:
                return sg["outStartFrame"] / FPS
        return total / FPS
    for sg in reversed(segs):
        if sg["srcEndFrame"] < f:
            return (sg["outStartFrame"] + sg["srcEndFrame"] - sg["srcStartFrame"]) / FPS
    return 0.0


# pausas suaves: tramos bajo SOFT_DB de más de SOFT_MIN s (informativo: aplicarlas a todas
# las palabras empeoraba la sincronía, así que solo se usan en OVERRIDES)
soft = []
i = 0
while i < n:
    if db[i] <= SOFT_DB:
        j = i
        while j < n and db[j] <= SOFT_DB:
            j += 1
        if (j - i) * WIN > SOFT_MIN:
            soft.append((i * WIN, j * WIN))
        i = j
    else:
        i += 1

words = json.load(open(words_path))
# Corrección de tiempos: Whisper alarga palabras sobre las pausas → recortar al silencio
# Ajustes manuales (s de origen), verificados re-transcribiendo el render:
# «pero» empieza tras la pausa suave 30,42–30,76 s (Whisper lo adelantaba 420 ms)
OVERRIDES = {67: (30.74, 31.0)}

for k, w in enumerate(words):
    s, e = w["startMs"] / 1000, w["endMs"] / 1000
    if k in OVERRIDES:
        s, e = OVERRIDES[k]
    for ss, se in silences:
        if ss < s < se:
            s = se - 0.02
        elif s < ss < e:
            # el silencio cae dentro de la palabra: se queda en el lado con más duración
            if e - se >= ss - s:
                s = se - 0.02
            else:
                e = ss + 0.02
    if k in OVERRIDES:
        s, e = OVERRIDES[k]
    if e <= s:
        e = s + 0.12
    w["s"], w["e"] = s, e
    w["os"], w["oe"] = snap_out(s, True), snap_out(e, False)
    if w["oe"] <= w["os"]:
        w["oe"] = w["os"] + 0.12

os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
json.dump(
    {
        "fps": FPS,
        "sourceDurationS": dur,
        "durationInFrames": total,
        "softPauses": [[round(a, 3), round(b, 3)] for a, b in soft],
        "silencesCut": [[round(a, 3), round(b, 3)] for a, b in silences],
        "segments": segs,
        "words": [
            {"text": w["text"], "srcStartMs": round(w["s"] * 1000), "srcEndMs": round(w["e"] * 1000),
             "startMs": round(w["os"] * 1000), "endMs": round(w["oe"] * 1000)}
            for w in words
        ],
    },
    open(out_path, "w"),
    indent=1,
    ensure_ascii=False,
)
print(f"Origen {dur:.2f} s → editado {total / FPS:.2f} s ({total} fot.), "
      f"{len(silences)} silencios cortados, {len(segs)} tramos")
for a, b in silences:
    print(f"  silencio {a:6.2f}–{b:6.2f} ({b - a:.2f} s)")
