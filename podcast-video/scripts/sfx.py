"""Sintetiza por código los efectos y la cama musical (no hay librería de sonido disponible).

Salida en public/sfx/: riser.wav, glitch.wav, whoosh.wav, pad.wav, cierre.wav (48 kHz estéreo, 16 bit).
Uso: python3 scripts/sfx.py public/sfx
"""
import os
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)


def save(name, x, peak_db):
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    pcm = (np.clip(x.T, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(out, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def t(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, fc):
    """Paso bajo de un polo con frecuencia de corte variable (array o escalar)."""
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def bandnoise(d, f0, f1):
    n = rng.standard_normal(int(d * SR))
    fc = np.geomspace(f0, f1, len(n))
    lp = onepole_lp(n, fc * 1.6)
    return lp - onepole_lp(lp, fc * 0.6)


# 1) Riser de entrada (0–1,3 s): ruido filtrado + barrido senoidal 2 → 10 kHz, corte seco al final
d = 1.3
tt = t(d)
env = (tt / d) ** 2.2
f = np.geomspace(500, 5000, len(tt))
sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.12
riser = (bandnoise(d, 800, 9000) * 0.9 + sweep) * env
riser[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
save("riser.wav", riser, -12)

# 2) Glitch: clics digitales + golpe grave corto (0,35 s)
d = 0.35
tt = t(d)
thump = np.sin(2 * np.pi * (90 * tt - 60 * tt ** 2)) * np.exp(-tt * 14)
clicks = np.zeros_like(tt)
for c in [0.0, 0.03, 0.055, 0.09, 0.12]:
    i = int(c * SR)
    L = int(0.008 * SR)
    clicks[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (0.002 * SR))
crush = np.round(rng.standard_normal(len(tt)) * 3) / 3 * np.exp(-tt * 25) * 0.4
save("glitch.wav", thump * 0.9 + clicks * 0.6 + crush, -9)

# 3) Whoosh de tarjeta (0,4 s): ruido paso banda que sube y baja
d = 0.4
tt = t(d)
env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
wl = bandnoise(d, 400, 4000) * env
wr = np.roll(wl, int(0.004 * SR))
save("whoosh.wav", np.vstack([wl, wr]), -14)

# 4) Cama musical (pad) 12 s: acorde Lam9 → Fa maj7, ondas suaves, ataque lento
d = 12.0
tt = t(d)
chords = [[220.0, 261.63, 329.63, 392.0, 493.88], [174.61, 220.0, 261.63, 329.63, 440.0]]
pad = np.zeros((2, len(tt)))
half = len(tt) // 2
for k, ch in enumerate(chords):
    seg = slice(k * half, (k + 1) * half if k == 0 else len(tt))
    ts = tt[seg] - tt[seg][0]
    for j, fr in enumerate(ch):
        for side, det in [(0, -0.6), (1, 0.6)]:
            ph = 2 * np.pi * (fr + det) * ts
            pad[side, seg] += (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) / (1 + j * 0.3)
    xf = int(0.8 * SR)
    pad[:, seg][:, :xf] *= np.linspace(0, 1, xf)
    pad[:, seg][:, -xf:] *= np.linspace(1, 0, xf)
lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * tt)
pad *= lfo
pad[0] = onepole_lp(pad[0], 1800)
pad[1] = onepole_lp(pad[1], 1800)
sub = np.sin(2 * np.pi * 55 * tt) * 0.5
pad += sub
save("pad.wav", pad, -6)

# 5) Golpe de cierre (logo): grave + brillo con cola de 2 s
d = 2.2
tt = t(d)
boom = np.sin(2 * np.pi * (60 * tt - 8 * tt ** 2)) * np.exp(-tt * 3)
shine = sum(np.sin(2 * np.pi * fr * tt) for fr in [880, 1318.5, 1760]) * np.exp(-tt * 2.5) * 0.12
save("cierre.wav", boom + shine, -8)
print("SFX generados en", out)
