"""Sintetiza por código pop, whoosh y música de fondo (no hay librería de sonido).
Salida en public/sfx/: pop.wav, whoosh.wav, musica.wav (48 kHz estéreo, 16 bit).
Uso: python3 scripts/sfx.py public/sfx [duración_música_s]
"""
import os, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(11)
out = sys.argv[1]
MUSIC_S = float(sys.argv[2]) if len(sys.argv) > 2 else 26.0
os.makedirs(out, exist_ok=True)


def save(name, x, peak_db):
    x = np.atleast_2d(x)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    pcm = (np.clip(x.T, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(out, name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def t(d):
    return np.arange(int(d * SR)) / SR


def lp(x, fc):
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


# 1) Pop de emoji: seno 520 → 880 Hz, 90 ms, ataque 4 ms, caída exponencial; pico −24 dBFS
tt = t(0.09)
f = 520 + 360 * (tt / 0.09) ** 0.6
pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(tt / 0.004, 1) * np.exp(-tt * 38)
save("pop.wav", pop, -24)

# 2) Whoosh de punch-in: ruido paso-banda 400 → 4000 Hz, 280 ms, pico en 6 fotogramas (0,2 s); pico −22 dBFS
d = 0.28
tt = t(d)
n = rng.standard_normal(len(tt))
fc = np.geomspace(400, 4000, len(tt))
band = lp(n, fc * 1.5) - lp(n, fc * 0.6)
env = np.where(tt < 0.2, (tt / 0.2) ** 2, np.exp(-(tt - 0.2) * 40))
w = band * env
save("whoosh.wav", np.vstack([w, np.roll(w, int(0.003 * SR))]), -22)

# 3) Música: pad cálido Dm – Bb – F – C (6,5 s por acorde, cruce suave) + bajo + campanitas
dur = MUSIC_S
tt = t(dur)
CH = [  # frecuencias (Hz) de cada acorde
    [146.83, 220.0, 293.66, 349.23, 440.0],   # Dm
    [116.54, 233.08, 293.66, 349.23, 466.16], # Bb
    [174.61, 220.0, 261.63, 349.23, 440.0],   # F
    [130.81, 196.0, 261.63, 329.63, 392.0],   # C
]
step = 6.5
mus = np.zeros((2, len(tt)))
for k in range(int(np.ceil(dur / step))):
    ch = CH[k % 4]
    c0 = k * step
    env = np.clip((tt - (c0 - 1.2)) / 1.6, 0, 1) * np.clip(((c0 + step + 1.2) - tt) / 1.6, 0, 1)
    for j, fr in enumerate(ch):
        for side, det in ((0, -0.5), (1, 0.5)):
            ph = 2 * np.pi * (fr + det) * tt
            mus[side] += env * (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)) / (1 + 0.25 * j)
    # campanitas suaves sobre notas del acorde cada 1,625 s
    for b in range(4):
        bt = c0 + b * step / 4
        m = tt - bt
        mask = (m >= 0) & (m < 1.6)
        fr = ch[(b * 2 + k) % len(ch)] * 2
        bell = np.where(mask, np.sin(2 * np.pi * fr * np.clip(m, 0, None)) * np.exp(-np.clip(m, 0, None) * 3.2) * np.minimum(m / 0.01, 1), 0)
        mus[0] += bell * 0.35; mus[1] += np.roll(bell, int(0.011 * SR)) * 0.35
    bass = np.sin(2 * np.pi * ch[0] / 2 * tt) * env * 0.9
    mus += bass
lfo = 0.88 + 0.12 * np.sin(2 * np.pi * 0.2 * tt)
mus *= lfo
mus[0] = lp(mus[0], 1600); mus[1] = lp(mus[1], 1600)
fi, fo = int(1.0 * SR), int(2.0 * SR)
mus[:, :fi] *= np.linspace(0, 1, fi); mus[:, -fo:] *= np.linspace(1, 0, fo)
save("musica.wav", mus, -6)
print("SFX generados en", out)
