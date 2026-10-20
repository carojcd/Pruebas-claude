"""Música de la tarjeta: "Happy Birthday" instrumental (dominio público),
sintetizada por código: caja de música + piano suave + colchón de cuerdas.

Genera musica.wav (44.1 kHz, estéreo). Para usar otra pista, reemplaza
musica.wav por tu archivo (o pasa --audio a render.py).

Los tiempos están pensados para la animación:
  0.0–2.0 s   arpegio de introducción
  2.0 s       empieza la melodía
  ~15.6 s     "birth-day to you" final  ->  aparece "Feliz cumpleaños, Nuera"
  ~16.3 s     última nota                ->  "Nuera ❤️"
"""
import wave

import numpy as np

SR = 44100
DUR = 20.0
BEAT = 0.62          # ~97 bpm, compás de 3/4
T0 = 2.0             # inicio de la melodía
FERMATA = 0.55       # respiración en "dear Ka-ren"

N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)


def hz(note):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = names[note[0]] + (1 if "#" in note else 0)
    octave = int(note[-1])
    return 440.0 * 2 ** ((n + 12 * (octave + 1) - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def music_box(f, dur=2.6):
    t = np.arange(int(SR * dur)) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2)
         + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 4.0)
         + 0.12 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 7.0)
         + 0.05 * np.sin(2 * np.pi * f * 6.3 * t) * np.exp(-t * 12.0))
    att = np.minimum(1, t / 0.004)
    return s * att


def piano(f, dur=2.4, soft=1.0):
    t = np.arange(int(SR * dur)) / SR
    s = np.zeros_like(t)
    for k, a in enumerate([1, 0.45, 0.22, 0.12, 0.06], start=1):
        detune = 1 + 0.0004 * k * k
        s += a * np.sin(2 * np.pi * f * k * detune * t) * np.exp(-t * (1.1 + 0.9 * k) / soft)
    att = np.minimum(1, t / 0.008)
    rel = np.clip((dur - t) / 0.3, 0, 1)
    return s * att * rel


def pad(freqs, dur):
    t = np.arange(int(SR * dur)) / SR
    s = np.zeros_like(t)
    for f in freqs:
        for d in (-0.7, 0.0, 0.8):  # leve desafinación = calidez
            s += np.sin(2 * np.pi * (f + d) * t) + 0.18 * np.sin(2 * np.pi * 2 * (f + d) * t)
    env = np.minimum(1, t / 0.9) * np.clip((dur - t) / 1.1, 0, 1)
    return s * env / (3 * len(freqs))


# --- Melodía (nota, duración en tiempos) -------------------------------
melody = [
    ("G4", .75), ("G4", .25), ("A4", 1), ("G4", 1), ("C5", 1), ("B4", 2),
    ("G4", .75), ("G4", .25), ("A4", 1), ("G4", 1), ("D5", 1), ("C5", 2),
    ("G4", .75), ("G4", .25), ("G5", 1), ("E5", 1), ("C5", 1), ("B4", 1), ("A4", 1),
    ("F5", .75), ("F5", .25), ("E5", 1), ("C5", 1), ("D5", 1), ("C5", 3),
]

beat_times = []  # instante real de cada tiempo (incluye la fermata)


def at(beat):
    """Tiempo en segundos del tiempo `beat` (0 = anacrusa)."""
    extra = FERMATA if beat >= 18 else 0.0
    return T0 + beat * BEAT + extra


b = 0.0
for note, d in melody:
    t = at(b)
    f = hz(note)
    add(music_box(f), t, 0.30, pan=0.15)
    add(piano(f, soft=1.2), t, 0.16, pan=-0.1)
    b += d

# --- Armonía en vals (bajo en el 1, acorde suave en 2 y 3) -------------
chords = {
    "C": ["C3", "E4", "G4"], "G": ["G2", "D4", "F4"], "G7": ["G2", "B3", "F4"],
    "F": ["F2", "A3", "C4"], "C/G": ["G2", "E4", "G4"],
}
bars = ["C", "G7", "G7", "C", "C", "F", "C/G", "C"]  # compases 1..8
for i, name in enumerate(bars):
    start_beat = 1 + 3 * i
    bass, *upper = chords[name]
    add(piano(hz(bass), 2.2, soft=1.4), at(start_beat), 0.16, pan=-0.25)
    if i < 7:
        for k in (1, 2):
            for n in upper:
                add(piano(hz(n), 1.2, soft=0.6), at(start_beat + k), 0.045, pan=0.2)
    # colchón de cuerdas bajo cada compás
    dur = 3 * BEAT + (FERMATA if i == 5 else 0) + 0.9
    add(pad([hz(bass) * 2] + [hz(n) for n in upper], dur), at(start_beat) - 0.2, 0.05)

# --- Intro: arpegio de caja de música ----------------------------------
for k, n in enumerate(["C5", "E5", "G5", "C6", "G5", "E5"]):
    add(music_box(hz(n), 2.0), 0.15 + k * 0.26, 0.12 * (1 - k * 0.08), pan=(-0.4 + 0.16 * k))
add(pad([hz("C4"), hz("E4"), hz("G4")], 2.6), 0.0, 0.06)

# --- Final: acorde que respira + destello al aparecer la firma ---------
end = at(22) + 3 * BEAT
add(pad([hz("C4"), hz("E4"), hz("G4"), hz("C5")], DUR - at(22) + 0.2), at(22) - 0.1, 0.07)
for k, n in enumerate(["G5", "C6", "E6", "G6"]):
    add(music_box(hz(n), 2.2), end + 0.15 + k * 0.17, 0.07, pan=(0.3 - 0.2 * k))
for k, n in enumerate(["C6", "E6", "G6", "C7"]):  # brillo junto a la firma (~18.4 s)
    add(music_box(hz(n), 1.8), 18.35 + k * 0.09, 0.035, pan=(-0.3 + 0.2 * k))


# --- Reverb (convolución con cola de ruido decreciente) ----------------
def reverb(x, seed):
    rng = np.random.default_rng(seed)
    n = int(SR * 2.2)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.0)
    ir[: int(SR * 0.012)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y


wetL, wetR = reverb(L, 1), reverb(R, 2)
outL = L * 0.8 + wetL * 0.35
outR = R * 0.8 + wetR * 0.35

# Fundido de entrada/salida
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.05) * np.clip((DUR - t) / 1.6, 0, 1) ** 1.5
out = np.stack([outL, outR], axis=1) * fade[:, None]
out *= 0.89 / np.max(np.abs(out))  # ~ -1 dBFS

with wave.open("musica.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())

print("musica.wav listo — melodía inicia en %.2fs, última nota en %.2fs" % (T0, at(22)))
