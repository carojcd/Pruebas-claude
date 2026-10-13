"""Diseño sonoro sintetizado (sin muestras): pad ambiental + whoosh/chime por cada aparición."""
import sys, wave
import numpy as np

SR, DUR = 48000, 5.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)
out = np.zeros((N, 2))


def env(n, a, d):
    x = np.arange(n) / SR
    return np.minimum(x / a, 1) * np.exp(-np.maximum(x - a, 0) / d)


def lowpass(x, cutoff):
    k = np.exp(-2 * np.pi * cutoff / SR); y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - k) * v + k * acc; y[i] = acc
    return y


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); n = min(len(sig), N - i)
    out[i:i + n, 0] += sig[:n] * gain * np.sqrt(0.5 * (1 - pan))
    out[i:i + n, 1] += sig[:n] * gain * np.sqrt(0.5 * (1 + pan))


def whoosh(length, peak):
    n = int(length * SR); x = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), 1800) - lowpass(rng.standard_normal(n), 250) * 0.5
    shape = np.where(x < peak, (x / peak) ** 2, np.exp(-(x - peak) / 0.12))
    return noise * shape


def chime(freq, length=1.6):
    n = int(length * SR); x = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * m * x + 0.3 * np.sin(2 * np.pi * 3 * x)) * np.exp(-x / (d))
            for m, a, d in [(1, 1, .9), (2.01, .35, .45), (3.0, .15, .25), (4.2, .08, .15)])
    return s * env(n, 0.006, 10)


# Pad ambiental (La mayor suave) con entrada y salida lentas
pad = sum(np.sin(2 * np.pi * f * t + 0.5 * np.sin(2 * np.pi * 0.2 * t + f)) for f in (110, 164.8, 220.4, 277.2)) / 4
pad *= np.minimum(t / 1.2, 1) * np.minimum((DUR - t) / 1.0, 1)
out += np.stack([pad * 0.05, np.roll(pad, 300) * 0.05], 1)

# Título (0.0 s): whoosh aireado + campana grave brillante
add(whoosh(1.0, 0.35), 0.0, 0, 0.16)
add(chime(440) + 0.6 * chime(659.3), 0.30, 0, 0.22)
# Tarjetas izquierda -> derecha (sincronizadas con el pico de cada aparición)
for start, f, pan in [(0.55, 554.4, -0.45), (0.95, 659.3, 0.0), (1.35, 880.0, 0.45)]:
    add(whoosh(0.7, 0.22), start - 0.08, pan, 0.12)
    add(chime(f), start + 0.14, pan, 0.20)

# Reverb por convolución (IR de ruido con decaimiento exponencial)
ir_n = int(SR * 1.8); irt = np.arange(ir_n) / SR
ir = rng.standard_normal((ir_n, 2)) * np.exp(-irt / 0.45)[:, None]; ir /= np.sqrt((ir ** 2).sum(0))
M = 1 << int(np.ceil(np.log2(N + ir_n)))
wet = np.stack([np.fft.irfft(np.fft.rfft(out[:, c], M) * np.fft.rfft(ir[:, c], M), M)[:N] for c in range(2)], 1)
mix = out + 0.35 * wet
mix *= np.minimum((DUR - t) / 0.3, 1)[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.1) * 0.85  # normalizado + saturación suave

with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
